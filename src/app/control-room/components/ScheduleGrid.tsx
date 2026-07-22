import type { GeneratedSchedule, ScheduleAssignment } from "../../../domain/schedule/types";
import { assignmentHours, datesBetween, formatDate, initials, roleFor, shiftFor, weekdayLabel } from "../scheduleUtils";

function absenceLabel(schedule: GeneratedSchedule, employeeId: string, date: string): string | null {
  const employee = schedule.employees.find(item => item.id === employeeId);
  const absence = employee?.absences.find(item => {
    if (item.dateFrom && item.dateTo) return date >= item.dateFrom && date <= item.dateTo;
    if (item.onceDate) return item.onceDate === date;
    return false;
  });
  return absence ? absence.type === "vacation" ? "Отпуск" : absence.type === "sick" ? "Больничный" : "Недоступен" : null;
}

function ShiftButton({ schedule, assignment, selected, onSelect }: { schedule: GeneratedSchedule; assignment: ScheduleAssignment; selected: boolean; onSelect: (item: ScheduleAssignment) => void }) {
  const shift = shiftFor(schedule, assignment.shiftTemplateId);
  const role = roleFor(schedule, assignment.roleId);
  if (!shift) return null;
  return (
    <button
      type="button"
      className={`cr-shift ${selected ? "is-selected" : ""} ${assignment.state === "conflict" ? "is-conflict" : ""}`}
      style={{ "--shift-color": role?.color ?? "#8b5cf6" } as React.CSSProperties}
      onClick={() => onSelect(assignment)}
      aria-label={`${shift.name}, ${shift.startTime}–${shift.endTime}${assignment.issueIds.length ? ", есть вопрос" : ""}`}
    >
      <strong>{shift.startTime}–{shift.endTime}</strong>
      <span>{role?.name ?? shift.name}{assignment.issueIds.length ? " · ⚠" : ""}</span>
    </button>
  );
}

export function ScheduleGrid({ schedule, selectedId, onSelect, visibleDates }: { schedule: GeneratedSchedule; selectedId?: string; onSelect: (item: ScheduleAssignment) => void; visibleDates?: string[] }) {
  const dates = visibleDates ?? datesBetween(schedule.period.start, schedule.period.end).slice(0, 7);
  const open = schedule.assignments.filter(item => !item.employeeId);
  return (
    <>
      <div className="cr-grid-wrap">
        <div className="cr-schedule-grid" style={{ gridTemplateColumns: `190px repeat(${dates.length}, minmax(112px, 1fr))`, minWidth: dates.length > 7 ? `${190 + dates.length * 112}px` : undefined }}>
          <div className="cr-grid-corner">Сотрудник · нагрузка</div>
          {dates.map(date => {
            const hasIssue = schedule.issues.some(item => !item.resolved && item.date === date);
            return <div className={`cr-grid-day ${hasIssue ? "has-issue" : ""}`} key={date}><span>{weekdayLabel(date)}</span><strong>{formatDate(date)}</strong></div>;
          })}
          {schedule.employees.map(employee => (
            <div key={employee.id} style={{ display: "contents" }}>
              <div className="cr-employee-cell">
                <div className="cr-avatar">{initials(employee.name)}</div>
                <div><strong>{employee.name}</strong><span>{assignmentHours(schedule, employee.id)} ч · {employee.roleIds.map(id => roleFor(schedule, id)?.name).filter(Boolean).join(", ") || "Без роли"}</span></div>
              </div>
              {dates.map(date => {
                const absence = absenceLabel(schedule, employee.id, date);
                const assignments = schedule.assignments.filter(item => item.employeeId === employee.id && item.date === date);
                return (
                  <div className={`cr-grid-cell ${absence ? "is-absence" : ""}`} key={`${employee.id}-${date}`}>
                    {absence ?? assignments.map(item => <ShiftButton key={item.id} schedule={schedule} assignment={item} selected={selectedId === item.id} onSelect={onSelect} />)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {open.length > 0 && (
        <div className="cr-open-lane">
          <h3>Открытые смены · {open.length}</h3>
          <div className="cr-open-items">{open.map(item => { const shift = shiftFor(schedule, item.shiftTemplateId); return <button className="cr-open-item" key={item.id} onClick={() => onSelect(item)}>{formatDate(item.date)} · {shift?.startTime}–{shift?.endTime} · {shift?.name}</button>; })}</div>
        </div>
      )}
    </>
  );
}
