import type {
  EmployeeInput,
  GeneratedSchedule,
  GenerationRequest,
  ScheduleAssignment,
  ScheduleIssue,
  ScheduleMetrics,
  ShiftTemplate,
  WishOutcome,
} from "../../domain/schedule/types";
import { validateScheduleDraft } from "../../domain/schedule/validation";
import type { ScheduleEngine } from "./ScheduleEngine";

function parseDate(value: string): Date {
  return new Date(`${value}T12:00:00`);
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(value: string, amount: number): string {
  const date = parseDate(value);
  date.setDate(date.getDate() + amount);
  return formatDate(date);
}

function datesBetween(start: string, end: string): string[] {
  const result: string[] = [];
  let cursor = start;
  while (cursor <= end && result.length < 62) {
    result.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return result;
}

function weekday(date: string): number {
  return (parseDate(date).getDay() + 6) % 7;
}

function isPatternDay(request: GenerationRequest, date: string, index: number): boolean {
  const pattern = request.input.workPattern;
  if (pattern.type === "daily") return true;
  if (pattern.type === "weekly") return pattern.workingWeekdays.includes(weekday(date));
  const cycle = pattern.segments.flatMap(segment => Array.from({ length: segment.days }, () => segment.type));
  return cycle.length === 0 ? true : cycle[index % cycle.length] === "work";
}

function absenceOn(employee: EmployeeInput, date: string): boolean {
  return employee.absences.some(absence => {
    if ((absence.type === "sick" || absence.type === "vacation") && absence.dateFrom && absence.dateTo) return date >= absence.dateFrom && date <= absence.dateTo;
    if (absence.recurrence === "once") return absence.onceDate === date;
    if (absence.recurrence === "weekly") return absence.weekdays?.includes(weekday(date)) ?? false;
    if (absence.recurrence === "monthly") return absence.monthDays?.includes(parseDate(date).getDate()) ?? false;
    return false;
  });
}

function eligible(employee: EmployeeInput, shift: ShiftTemplate, date: string): boolean {
  if (employee.hiredOn && date < employee.hiredOn) return false;
  if (employee.terminatedOn && date > employee.terminatedOn) return false;
  if (absenceOn(employee, date)) return false;
  return !shift.requiredRoleId || employee.roleIds.includes(shift.requiredRoleId);
}

function hoursBetween(start: string, end: string): number {
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  let minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
  if (minutes <= 0) minutes += 24 * 60;
  return minutes / 60;
}

function calculateMetrics(assignments: ScheduleAssignment[], employees: EmployeeInput[], shifts: ShiftTemplate[], issues: ScheduleIssue[], wishes: WishOutcome[]): ScheduleMetrics {
  const covered = assignments.filter(item => item.employeeId && item.state !== "open").length;
  const hardTotal = Math.max(1, assignments.length);
  return {
    qualityScore: Math.max(0, Math.round((covered / Math.max(1, assignments.length)) * 100 - issues.filter(item => !item.resolved).length * 2)),
    coveragePercent: Math.round((covered / Math.max(1, assignments.length)) * 100),
    coveredSlots: covered,
    totalSlots: assignments.length,
    hardConstraintsSatisfied: hardTotal - issues.filter(item => item.severity === "error" && !item.resolved).length,
    hardConstraintsTotal: hardTotal,
    wishesSatisfied: wishes.filter(item => item.outcome === "satisfied" || item.outcome === "partially_satisfied").length,
    wishesTotal: wishes.length,
    unresolvedIssueCount: issues.filter(item => !item.resolved).length,
    employeeWorkload: employees.map(employee => {
      const own = assignments.filter(item => item.employeeId === employee.id);
      return {
        employeeId: employee.id,
        totalHours: own.reduce((sum, assignment) => {
          const shift = shifts.find(item => item.id === assignment.shiftTemplateId);
          return sum + (shift ? hoursBetween(shift.startTime, shift.endTime) : 0);
        }, 0),
        shiftCount: own.length,
        nightShiftCount: own.filter(assignment => {
          const shift = shifts.find(item => item.id === assignment.shiftTemplateId);
          return !!shift && shift.endTime <= shift.startTime;
        }).length,
      };
    }),
  };
}

export class MockScheduleEngine implements ScheduleEngine {
  async generate(request: GenerationRequest): Promise<GeneratedSchedule> {
    const draft = request.input;
    const validation = validateScheduleDraft(draft);
    const blocking = validation.filter(item => item.code === "missing_role" || item.code === "no_employees" || item.code === "no_shifts" || item.code === "incomplete_shift");
    const dates = datesBetween(draft.period.start, draft.period.end);
    const assignments: ScheduleAssignment[] = [];
    const issues: ScheduleIssue[] = blocking.map((item, index) => ({
      id: `issue-validation-${index + 1}`,
      severity: "error",
      type: item.code === "missing_role" ? "missing_role" : "other",
      title: item.code === "missing_role" ? "Для смены некому назначить требуемую роль" : "Нужно дополнить параметры расписания",
      description: item.message,
      employeeIds: [],
      assignmentIds: [],
      resolutionActions: [{ id: "open-wizard", label: "Исправить параметры", target: "wizard" }],
      resolved: false,
    }));

    let cursor = 0;
    dates.forEach((date, dateIndex) => {
      if (!isPatternDay(request, date, dateIndex) || draft.rules.nonWorkingDates.includes(date)) return;
      draft.shiftTemplates.forEach(shift => {
        if (shift.activeDays?.length && !shift.activeDays.includes(weekday(date))) return;
        const candidates = draft.employees.filter(employee => eligible(employee, shift, date));
        const employee = candidates.length ? candidates[cursor % candidates.length] : undefined;
        cursor += 1;
        const assignmentId = `assignment-${date}-${shift.id}`;
        const issueId = employee ? undefined : `issue-open-${date}-${shift.id}`;
        assignments.push({
          id: assignmentId,
          date,
          employeeId: employee?.id ?? null,
          shiftTemplateId: shift.id,
          roleId: shift.requiredRoleId ?? null,
          startsAt: `${date}T${shift.startTime || "00:00"}:00`,
          endsAt: `${shift.endTime <= shift.startTime ? addDays(date, 1) : date}T${shift.endTime || "00:00"}:00`,
          state: employee ? "assigned" : "open",
          issueIds: issueId ? [issueId] : [],
          origin: "generated",
          explanation: employee
            ? shift.requiredRoleId ? "Сотрудник доступен и имеет нужную роль." : "У смены нет ограничения по роли; сотрудник выбран из доступных."
            : "Среди доступных сотрудников не найден подходящий кандидат.",
        });
        if (issueId) {
          issues.push({
            id: issueId,
            severity: "warning",
            type: shift.requiredRoleId ? "missing_role" : "uncovered_shift",
            title: `Смена «${shift.name}» осталась открытой`,
            description: shift.requiredRoleId
              ? "На эту дату нет доступного сотрудника с требуемой ролью."
              : "На эту дату нет доступного сотрудника без пересечения с отсутствиями.",
            date,
            employeeIds: [],
            assignmentIds: [assignmentId],
            resolutionActions: [{ id: "show-assignment", label: "Показать в расписании", target: "assignment" }],
            resolved: false,
          });
        }
      });
    });

    const wishOutcomes: WishOutcome[] = draft.employees.flatMap(employee => [
      ...employee.timePreferences.map((preference, index) => ({
        wishId: preference.id,
        employeeId: employee.id,
        outcome: index % 3 === 2 ? "partially_satisfied" as const : "satisfied" as const,
        summary: preference.preference === "prefer" ? "Предпочтительное время" : "Нежелательное время",
        explanation: index % 3 === 2 ? "Пожелание учтено не во все дни из-за покрытия смен." : "Пожелание учтено в демо-распределении.",
        relatedAssignmentIds: assignments.filter(item => item.employeeId === employee.id).slice(0, 2).map(item => item.id),
        relatedIssueIds: [],
      })),
      ...employee.teammatePreferences.map(preference => ({
        wishId: preference.id,
        employeeId: employee.id,
        outcome: "partially_satisfied" as const,
        summary: preference.preference === "with" ? "Работать вместе" : "Работать раздельно",
        explanation: "Пожелание учтено частично: приоритет отдавался обязательному покрытию смен.",
        relatedAssignmentIds: assignments.filter(item => item.employeeId === employee.id).slice(0, 1).map(item => item.id),
        relatedIssueIds: [],
      })),
    ]);

    if (draft.employees.length >= 3 && assignments.length && !issues.some(item => item.type === "workload_imbalance")) {
      issues.push({
        id: "issue-workload-balance",
        severity: "info",
        type: "workload_imbalance",
        title: "Проверьте распределение нагрузки",
        description: "Демо-распределение циклическое и не является результатом оптимизационного алгоритма.",
        employeeIds: draft.employees.slice(0, 2).map(item => item.id),
        assignmentIds: [],
        resolutionActions: [{ id: "review-workload", label: "Посмотреть нагрузку", target: "employee" }],
        resolved: false,
      });
    }

    const metrics = calculateMetrics(assignments, draft.employees, draft.shiftTemplates, issues, wishOutcomes);
    const now = new Date().toISOString();
    return {
      schemaVersion: 1,
      id: `schedule-${draft.sourceDraftId ?? draft.id}`,
      draftId: draft.id,
      sourceDraftId: draft.sourceDraftId,
      generationRequestId: request.requestId,
      revision: draft.revision,
      status: blocking.length ? "failed" : issues.some(item => item.severity !== "info") ? "needs_review" : "ready",
      isDemoResult: true,
      name: draft.name,
      period: draft.period,
      employees: draft.employees.map(employee => ({ id: employee.id, name: employee.name, roleIds: employee.roleIds, absences: employee.absences })),
      roles: draft.roles,
      shiftTemplates: draft.shiftTemplates,
      assignments,
      metrics,
      issues,
      wishOutcomes,
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
    };
  }
}

export const scheduleEngine: ScheduleEngine = new MockScheduleEngine();
