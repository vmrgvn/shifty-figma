import type {
  EmployeeInput,
  GenerationRequest,
  LegacyWizardSnapshot,
  RoleDefinition,
  ScheduleDraft,
  ShiftTemplate,
  WorkPattern,
} from "./types";

const ROLE_COLORS = ["#8b5cf6", "#ec4899", "#0ea5e9", "#10b981", "#f59e0b", "#f97316"];

function hashText(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function stableId(prefix: string, value: string | number): string {
  return `${prefix}-${hashText(String(value).trim().toLocaleLowerCase("ru"))}`;
}

function isoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function defaultPeriod(): { start: string; end: string; timezone: string } {
  const today = new Date();
  const weekday = (today.getDay() + 6) % 7;
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - weekday);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  return { start: isoDate(start), end: isoDate(end), timezone: "Asia/Yekaterinburg" };
}

type LegacyEmployee = {
  id?: number | string;
  name?: string;
  roles?: string[];
  absences?: Array<Record<string, unknown>>;
  hired?: string;
  fired?: string;
  timePrefs?: Array<Record<string, unknown>>;
  socialPrefs?: Array<Record<string, unknown>>;
};

type LegacyStep3 = {
  mode?: "daily" | "weekly" | "custom";
  weekDays?: number[];
  cycle?: Array<{ id?: number; type?: "work" | "off"; days?: number }>;
  configs?: Array<{ id?: number; activeDays?: number[]; shifts?: Array<{ id?: number; from?: string; to?: string; role?: string; name?: string }> }>;
};

type LegacyStep5 = {
  breaks?: Array<{ id?: number; from?: string; to?: string }>;
  daysOff?: Array<{ id?: number; date?: string }>;
  minRestHours?: number;
  periodic?: boolean;
  periodStart?: string;
  periodEnd?: string;
  timezone?: string;
};

function safeArray<T>(value: T[] | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function roleDefinitions(names: string[]): RoleDefinition[] {
  const normalized = names.map(name => name.trim()).filter(Boolean);
  return normalized.filter((name, index) => normalized.findIndex(item => item.toLocaleLowerCase("ru") === name.toLocaleLowerCase("ru")) === index)
    .map((name, index) => ({ id: stableId("role", name), name, color: ROLE_COLORS[index % ROLE_COLORS.length] }));
}

function workPattern(step3: LegacyStep3): WorkPattern {
  if (step3.mode === "weekly") return { type: "weekly", workingWeekdays: safeArray(step3.weekDays) };
  if (step3.mode === "custom") {
    return {
      type: "cycle",
      segments: safeArray(step3.cycle).map(item => ({ type: item.type === "off" ? "off" : "work", days: Math.max(1, Number(item.days) || 1) })),
    };
  }
  return { type: "daily" };
}

function employeeInput(employee: LegacyEmployee, index: number): EmployeeInput {
  const employeeId = String(employee.id ?? index + 1);
  return {
    id: `employee-${employeeId}`,
    name: employee.name?.trim() || `Сотрудник ${index + 1}`,
    roleIds: safeArray(employee.roles).map(role => stableId("role", role)),
    hiredOn: employee.hired || null,
    terminatedOn: employee.fired || null,
    absences: safeArray(employee.absences).map((absence, absenceIndex) => ({
      id: `absence-${employeeId}-${String(absence.id ?? absenceIndex + 1)}`,
      type: absence.type === "vacation" || absence.type === "other" ? absence.type : "sick",
      dateFrom: String(absence.dateFrom || "") || undefined,
      dateTo: String(absence.dateTo || "") || undefined,
      recurrence: absence.repeat === "weekly" || absence.repeat === "monthly" ? absence.repeat : "once",
      onceDate: String(absence.onceDate || "") || undefined,
      weekdays: Array.isArray(absence.weekDays) ? absence.weekDays as number[] : undefined,
      monthDays: Array.isArray(absence.monthDays) ? absence.monthDays as number[] : undefined,
      timeFrom: String(absence.timeFrom || "") || undefined,
      timeTo: String(absence.timeTo || "") || undefined,
    })),
    timePreferences: safeArray(employee.timePrefs).map((preference, preferenceIndex) => ({
      id: `time-pref-${employeeId}-${String(preference.id ?? preferenceIndex + 1)}`,
      preference: preference.prefer === "avoid" ? "avoid" : "prefer",
      recurrence: preference.repeat === "weekly" || preference.repeat === "monthly" ? preference.repeat : "daily",
      weekdays: Array.isArray(preference.weekDays) ? preference.weekDays as number[] : undefined,
      monthDays: Array.isArray(preference.monthDays) ? preference.monthDays as number[] : undefined,
      timeFrom: String(preference.timeFrom || ""),
      timeTo: String(preference.timeTo || ""),
      strength: "soft",
    })),
    teammatePreferences: safeArray(employee.socialPrefs).map((preference, preferenceIndex) => ({
      id: `team-pref-${employeeId}-${String(preference.id ?? preferenceIndex + 1)}`,
      targetEmployeeId: `employee-${String(preference.targetEmpId ?? "unknown")}`,
      targetName: String(preference.targetName || "") || undefined,
      preference: preference.type === "without" ? "without" : "with",
      strength: "soft",
    })),
  };
}

function shiftTemplates(step3: LegacyStep3): ShiftTemplate[] {
  return safeArray(step3.configs).flatMap((config, configIndex) =>
    safeArray(config.shifts).map((shift, shiftIndex) => {
      const start = shift.from || "";
      const end = shift.to || "";
      const overnight = !!start && !!end && end <= start;
      const automaticName = overnight ? "Ночная смена" : start < "12:00" ? "Утренняя смена" : start < "18:00" ? "Дневная смена" : "Вечерняя смена";
      return {
        id: `shift-${String(config.id ?? configIndex + 1)}-${String(shift.id ?? shiftIndex + 1)}`,
        name: shift.name?.trim() || automaticName,
        startTime: start,
        endTime: end,
        requiredRoleId: shift.role ? stableId("role", shift.role) : null,
        activeDays: safeArray(config.activeDays),
        sourceConfigId: String(config.id ?? configIndex + 1),
      };
    }),
  );
}

export function legacyWizardToDraft(raw: Record<string, unknown>, source: ScheduleDraft["source"]): ScheduleDraft {
  const snapshot = raw as LegacyWizardSnapshot;
  const step3 = (raw.step3Data ?? {}) as LegacyStep3;
  const step5 = (raw.step5Data ?? {}) as LegacyStep5;
  const employees = safeArray(raw.employees as LegacyEmployee[] | undefined);
  const roleNames = safeArray(raw.globalRoles as string[] | undefined);
  const fallback = defaultPeriod();
  const stablePayload = JSON.stringify({ employees, roleNames, step3, step5, scheduleName: raw.scheduleName });
  const sourceDraftId = `wizard-${hashText(stablePayload)}`;
  const now = new Date().toISOString();

  return {
    schemaVersion: 1,
    id: `draft-${sourceDraftId}`,
    source,
    sourceDraftId,
    revision: 1,
    name: String(raw.scheduleName || "Расписание без названия"),
    period: {
      start: step5.periodStart || fallback.start,
      end: step5.periodEnd || fallback.end,
      timezone: step5.timezone || fallback.timezone,
    },
    workPattern: workPattern(step3),
    roles: roleDefinitions(roleNames),
    employees: employees.map(employeeInput),
    shiftTemplates: shiftTemplates(step3),
    rules: {
      breaks: safeArray(step5.breaks).map((item, index) => ({ id: `break-${String(item.id ?? index + 1)}`, from: item.from || "", to: item.to || "" })),
      nonWorkingDates: safeArray(step5.daysOff).map(item => item.date || "").filter(Boolean),
      minimumRestHours: Number.isFinite(step5.minRestHours) ? Number(step5.minRestHours) : 8,
      preferStableShiftTimes: step5.periodic !== false,
    },
    legacySnapshot: snapshot,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Keeps the current wizard usable as an editor for schedules that were created
 * from typed data (fixtures today, an API response later). The conversion is
 * deliberately isolated at the boundary so the rest of Control Room never has
 * to depend on the wizard's legacy shape.
 */
export function scheduleDraftToLegacyWizard(draft: ScheduleDraft): Record<string, unknown> {
  const employeeNumberById = new Map(draft.employees.map((employee, index) => [employee.id, index + 1]));
  const roleNameById = new Map(draft.roles.map(role => [role.id, role.name]));
  const configKeys = [...new Set(draft.shiftTemplates.map(shift => shift.sourceConfigId || "1"))];
  const configNumberByKey = new Map(configKeys.map((key, index) => [key, index + 1]));

  const step3Data: LegacyStep3 = {
    mode: draft.workPattern.type === "cycle" ? "custom" : draft.workPattern.type,
    weekDays: draft.workPattern.type === "weekly" ? [...draft.workPattern.workingWeekdays] : [],
    cycle: draft.workPattern.type === "cycle"
      ? draft.workPattern.segments.map((segment, index) => ({ id: index + 1, type: segment.type, days: segment.days }))
      : [],
    configs: configKeys.map(key => {
      const shifts = draft.shiftTemplates.filter(shift => (shift.sourceConfigId || "1") === key);
      return {
        id: configNumberByKey.get(key),
        activeDays: [...(shifts[0]?.activeDays ?? [])],
        shifts: shifts.map((shift, index) => ({
          id: index + 1,
          from: shift.startTime,
          to: shift.endTime,
          role: shift.requiredRoleId ? roleNameById.get(shift.requiredRoleId) ?? "" : "",
          name: shift.name,
        })),
      };
    }),
  };

  return {
    step: 1,
    scheduleName: draft.name,
    globalRoles: draft.roles.map(role => role.name),
    employees: draft.employees.map((employee, employeeIndex) => ({
      id: employeeIndex + 1,
      name: employee.name,
      roles: employee.roleIds.map(roleId => roleNameById.get(roleId)).filter((name): name is string => !!name),
      hired: employee.hiredOn ?? "",
      fired: employee.terminatedOn ?? "",
      absences: employee.absences.map((absence, index) => ({
        id: index + 1,
        type: absence.type,
        dateFrom: absence.dateFrom,
        dateTo: absence.dateTo,
        repeat: absence.recurrence,
        onceDate: absence.onceDate,
        weekDays: absence.weekdays ? [...absence.weekdays] : undefined,
        monthDays: absence.monthDays ? [...absence.monthDays] : undefined,
        timeFrom: absence.timeFrom,
        timeTo: absence.timeTo,
      })),
      timePrefs: employee.timePreferences.map((preference, index) => ({
        id: index + 1,
        prefer: preference.preference,
        repeat: preference.recurrence,
        weekDays: preference.weekdays ? [...preference.weekdays] : undefined,
        monthDays: preference.monthDays ? [...preference.monthDays] : undefined,
        timeFrom: preference.timeFrom,
        timeTo: preference.timeTo,
      })),
      socialPrefs: employee.teammatePreferences.flatMap((preference, index) => {
        const targetEmpId = employeeNumberById.get(preference.targetEmployeeId);
        return targetEmpId ? [{
          id: index + 1,
          targetEmpId,
          targetName: preference.targetName ?? draft.employees.find(item => item.id === preference.targetEmployeeId)?.name ?? "",
          type: preference.preference,
        }] : [];
      }),
    })),
    step3Data,
    step5Data: {
      breaks: draft.rules.breaks.map((item, index) => ({ id: index + 1, from: item.from, to: item.to })),
      daysOff: draft.rules.nonWorkingDates.map((date, index) => ({ id: index + 1, date })),
      minRestHours: draft.rules.minimumRestHours,
      periodic: draft.rules.preferStableShiftTimes,
      periodStart: draft.period.start,
      periodEnd: draft.period.end,
      timezone: draft.period.timezone,
    },
  };
}

export function createGenerationRequest(draft: ScheduleDraft): GenerationRequest {
  return {
    requestId: `request-${draft.id}-r${draft.revision}`,
    draftId: draft.id,
    draftRevision: draft.revision,
    requestedAt: new Date().toISOString(),
    locale: "ru",
    timezone: draft.period.timezone,
    input: draft,
  };
}
