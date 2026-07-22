import { X } from "lucide-react";
import type { GeneratedSchedule, ScheduleAssignment } from "../../../domain/schedule/types";
import { formatDate, roleFor, shiftFor } from "../scheduleUtils";

export function ShiftInspector({ schedule, assignment, onClose }: { schedule: GeneratedSchedule; assignment: ScheduleAssignment; onClose: () => void }) {
  const employee = schedule.employees.find(item => item.id === assignment.employeeId);
  const shift = shiftFor(schedule, assignment.shiftTemplateId);
  const role = roleFor(schedule, assignment.roleId);
  const issues = schedule.issues.filter(item => assignment.issueIds.includes(item.id));
  return (
    <aside className="cr-panel cr-inspector" aria-label="Детали смены">
      <div className="cr-inspector-head"><div><span className={`cr-status ${assignment.state === "open" ? "needs_review" : "ready"}`}>{assignment.state === "open" ? "Открытая смена" : "Назначено"}</span><h2 style={{ marginTop: 10 }}>{shift?.name ?? "Смена"}</h2></div><button className="cr-icon-button" onClick={onClose} aria-label="Закрыть детали"><X size={16} /></button></div>
      <dl>
        <div><dt>Сотрудник</dt><dd>{employee?.name ?? "Не назначен"}</dd></div>
        <div><dt>Дата</dt><dd>{formatDate(assignment.date, { day: "numeric", month: "long", weekday: "long" })}</dd></div>
        <div><dt>Время</dt><dd style={{ fontVariantNumeric: "tabular-nums" }}>{shift?.startTime}–{shift?.endTime}</dd></div>
        <div><dt>Роль</dt><dd>{role?.name ?? "Не требуется"}</dd></div>
        <div><dt>Источник</dt><dd>{assignment.origin === "generated" ? "Демо-распределение Shifty" : "Изменено вручную"}</dd></div>
      </dl>
      <div className="cr-explanation"><strong>Почему так</strong><br />{assignment.explanation ?? "Назначение сформировано локальным демо-адаптером."}</div>
      {issues.map(issue => <div className="cr-banner warning" key={issue.id} style={{ marginTop: 12 }}><div><strong>{issue.title}</strong><br />{issue.description}</div></div>)}
    </aside>
  );
}
