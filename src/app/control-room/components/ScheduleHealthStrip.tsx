import { AlertTriangle, CheckCircle2, Clock3, HeartHandshake, PieChart } from "lucide-react";
import type { GeneratedSchedule } from "../../../domain/schedule/types";

export function ScheduleHealthStrip({ schedule, onIssues }: { schedule: GeneratedSchedule; onIssues: () => void }) {
  const totalHours = Math.round(schedule.metrics.employeeWorkload.reduce((sum, item) => sum + item.totalHours, 0));
  const values = [
    { label: "Покрытие", value: `${schedule.metrics.coveragePercent}%`, Icon: PieChart },
    { label: "Обязательные условия", value: `${schedule.metrics.hardConstraintsSatisfied}/${schedule.metrics.hardConstraintsTotal}`, Icon: CheckCircle2 },
    { label: "Пожелания", value: `${schedule.metrics.wishesSatisfied}/${schedule.metrics.wishesTotal}`, Icon: HeartHandshake },
    { label: "Часов", value: `${totalHours} ч`, Icon: Clock3 },
    { label: "Требует решения", value: String(schedule.metrics.unresolvedIssueCount), Icon: AlertTriangle, action: onIssues },
  ];
  return (
    <div className="cr-health-strip" aria-label="Состояние расписания">
      {values.map(({ label, value, Icon, action }) => (
        <button className="cr-health-metric" key={label} type="button" onClick={action} aria-label={`${label}: ${value}`}>
          <span>{label}</span><strong><Icon size={13} aria-hidden="true" /> {value}</strong>
        </button>
      ))}
    </div>
  );
}
