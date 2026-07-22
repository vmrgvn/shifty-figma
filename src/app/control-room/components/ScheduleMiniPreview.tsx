import type { GeneratedSchedule } from "../../../domain/schedule/types";
import { datesBetween, weekdayLabel } from "../scheduleUtils";

export function ScheduleMiniPreview({ schedule }: { schedule: GeneratedSchedule }) {
  const dates = datesBetween(schedule.period.start, schedule.period.end).slice(0, 7);
  return (
    <div className="cr-mini-grid" aria-label="Предпросмотр недели">
      {dates.map(date => {
        const assignments = schedule.assignments.filter(item => item.date === date);
        const hasIssue = schedule.issues.some(item => !item.resolved && item.date === date);
        return (
          <div className="cr-mini-day" key={date} title={`${assignments.length} назначений${hasIssue ? ", есть вопросы" : ""}`}>
            <span>{weekdayLabel(date)}</span>
            <strong>{Number(date.slice(-2))}</strong>
            <div className="cr-mini-bars">
              {assignments.slice(0, 3).map(item => <i key={item.id} style={{ opacity: item.state === "open" ? .28 : 1 }} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
