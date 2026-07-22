import type { GeneratedSchedule, ScheduleAssignment } from "../../../domain/schedule/types";
import { formatDate, initials, roleFor, shiftFor, weekdayLabel } from "../scheduleUtils";

export function ScheduleDayAgenda({ schedule, date, onSelect }: { schedule: GeneratedSchedule; date: string; onSelect: (assignment: ScheduleAssignment) => void }) {
  const assignments = schedule.assignments.filter(item => item.date === date);
  if (!assignments.length) return <div className="cr-panel cr-empty"><div><h2>На этот день назначений нет</h2><p>Выберите другую дату или вернитесь к параметрам расписания.</p></div></div>;
  return (
    <div className="cr-agenda" aria-label={`${weekdayLabel(date)}, ${formatDate(date)}`}>
      {schedule.shiftTemplates.map(shift => {
        const items = assignments.filter(item => item.shiftTemplateId === shift.id);
        if (!items.length) return null;
        return (
          <button className="cr-panel cr-agenda-card" key={shift.id} onClick={() => onSelect(items[0])} style={{ textAlign: "left", color: "inherit", cursor: "pointer" }}>
            <span className="cr-agenda-time">{shift.startTime}–{shift.endTime}</span><h3>{shift.name}</h3>
            {items.map(item => {
              const employee = schedule.employees.find(entry => entry.id === item.employeeId);
              const role = roleFor(schedule, item.roleId);
              return <div className="cr-agenda-assignee" key={item.id}><div className="cr-avatar">{employee ? initials(employee.name) : "?"}</div><span>{employee?.name ?? "Открытая смена"}{role ? ` · ${role.name}` : ""}{item.issueIds.length ? " · Требует внимания" : ""}</span></div>;
            })}
          </button>
        );
      })}
    </div>
  );
}
