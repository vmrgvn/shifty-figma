import { ArrowLeft, CalendarRange, ChevronLeft, ChevronRight, FileText, Printer, RefreshCw, Send, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import type { GeneratedSchedule, ScheduleAssignment, ScheduleIssue } from "../../../domain/schedule/types";
import { IssuesPanel } from "../components/IssuesPanel";
import { ScheduleDayAgenda } from "../components/ScheduleDayAgenda";
import { ScheduleGrid } from "../components/ScheduleGrid";
import { ScheduleHealthStrip } from "../components/ScheduleHealthStrip";
import { ShiftInspector } from "../components/ShiftInspector";
import { addDays, datesBetween, formatDate, formatPeriod, statusLabel, weekdayLabel } from "../scheduleUtils";

type ViewMode = "day" | "week" | "two_weeks" | "month";

interface Props {
  schedule: GeneratedSchedule;
  openIssuesInitially?: boolean;
  onBack: () => void;
  onEdit: () => void;
  onPrint: () => void;
  onPublish: () => void;
}

function MonthView({ schedule, onDay }: { schedule: GeneratedSchedule; onDay: (date: string) => void }) {
  const dates = datesBetween(schedule.period.start, schedule.period.end);
  return <div style={{ overflowX: "auto" }}><div className="cr-month">{dates.map(date => { const assignments = schedule.assignments.filter(item => item.date === date); const issues = schedule.issues.filter(item => !item.resolved && item.date === date); return <button className="cr-month-day" key={date} onClick={() => onDay(date)}><strong>{weekdayLabel(date)} · {formatDate(date)}</strong><span>{assignments.length} назначений</span><span>{issues.length ? `${issues.length} требует внимания` : "Без вопросов"}</span></button>; })}</div></div>;
}

export function ScheduleWorkspacePage({ schedule, openIssuesInitially, onBack, onEdit, onPrint, onPublish }: Props) {
  const allDates = useMemo(() => datesBetween(schedule.period.start, schedule.period.end), [schedule.period.start, schedule.period.end]);
  const [view, setView] = useState<ViewMode>(window.innerWidth < 768 ? "day" : "week");
  const [selectedDate, setSelectedDate] = useState(allDates[0]);
  const [selected, setSelected] = useState<ScheduleAssignment | null>(null);
  const [issuesOpen, setIssuesOpen] = useState(!!openIssuesInitially);
  const visibleDates = view === "two_weeks" ? allDates.slice(0, 14) : allDates.slice(0, 7);

  const selectIssue = (issue: ScheduleIssue) => {
    const assignment = schedule.assignments.find(item => issue.assignmentIds.includes(item.id));
    if (issue.date) setSelectedDate(issue.date);
    if (assignment) setSelected(assignment);
    setIssuesOpen(false);
  };
  const changeDay = (amount: number) => {
    const next = addDays(selectedDate, amount);
    if (next >= schedule.period.start && next <= schedule.period.end) setSelectedDate(next);
  };

  return (
    <main className="cr-page is-wide">
      <div className="cr-workspace-header">
        <div><button className="cr-breadcrumb" onClick={onBack}><ArrowLeft size={12} /> Расписания</button><h1>{schedule.name}</h1><div style={{ display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap" }}><span className={`cr-status ${schedule.status}`}>{statusLabel(schedule.status)}</span><span className="cr-period">{formatPeriod(schedule)} · обновлено {new Date(schedule.updatedAt).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span></div></div>
        <div className="cr-workspace-actions"><button className="cr-secondary cr-desktop-only" onClick={onEdit}><RefreshCw size={14} /> Изменить параметры</button><button className="cr-secondary" onClick={onPrint}><Printer size={14} /><span className="cr-desktop-only">Печать</span></button>{schedule.status !== "published" && schedule.status !== "failed" && <button className="cr-primary" onClick={onPublish}><Send size={14} /> Опубликовать</button>}</div>
      </div>
      {schedule.isDemoResult && <div className="cr-banner"><Sparkles size={16} color="var(--cr-info)" /><div><strong>Демонстрационное распределение</strong><br />Интерфейс показывает, как будет выглядеть результат будущего движка. Текущее распределение создано простым локальным алгоритмом и не считается оптимальным.</div></div>}
      {schedule.status === "failed" && <div className="cr-banner warning"><FileText size={16} /><div><strong>Не удалось составить расписание</strong><br />Откройте ситуации ниже и исправьте параметры в визарде.</div></div>}
      <div className="cr-panel cr-toolbar">
        <div className="cr-toolbar-group"><button className="cr-icon-button" onClick={() => changeDay(-1)} aria-label="Предыдущий день"><ChevronLeft size={15} /></button><button className="cr-secondary" onClick={() => setSelectedDate(allDates[0])}>К началу</button><button className="cr-icon-button" onClick={() => changeDay(1)} aria-label="Следующий день"><ChevronRight size={15} /></button></div>
        <div className="cr-date-label">{view === "day" ? formatDate(selectedDate, { day: "numeric", month: "long", weekday: "long" }) : formatPeriod(schedule)}</div>
        <div className="cr-filter-row"><button className={`cr-filter ${view === "day" ? "is-active" : ""}`} onClick={() => setView("day")}>День</button><button className={`cr-filter ${view === "week" ? "is-active" : ""}`} onClick={() => setView("week")}>Неделя</button>{allDates.length > 7 && <button className={`cr-filter ${view === "two_weeks" ? "is-active" : ""}`} onClick={() => setView("two_weeks")}>2 недели</button>}<button className={`cr-filter ${view === "month" ? "is-active" : ""}`} onClick={() => setView("month")}>Месяц</button></div>
      </div>
      <ScheduleHealthStrip schedule={schedule} onIssues={() => setIssuesOpen(true)} />
      <div className="cr-mobile-only"><div className="cr-day-strip">{allDates.map(date => { const hasIssue = schedule.issues.some(item => !item.resolved && item.date === date); return <button className={`cr-day-button ${selectedDate === date ? "is-active" : ""}`} key={date} onClick={() => { setSelectedDate(date); setView("day"); }}><span>{weekdayLabel(date)}</span><strong>{Number(date.slice(-2))}</strong>{hasIssue && <i />}</button>; })}</div></div>
      <div className={`cr-workspace-layout ${selected ? "has-inspector" : ""}`}>
        <div>
          {view === "day" ? <ScheduleDayAgenda schedule={schedule} date={selectedDate} onSelect={setSelected} /> : view === "month" ? <MonthView schedule={schedule} onDay={date => { setSelectedDate(date); setView("day"); }} /> : <ScheduleGrid schedule={schedule} visibleDates={visibleDates} selectedId={selected?.id} onSelect={setSelected} />}
        </div>
        {selected && <><button className="cr-scrim cr-mobile-only" onClick={() => setSelected(null)} aria-label="Закрыть детали" /><ShiftInspector schedule={schedule} assignment={selected} onClose={() => setSelected(null)} /></>}
      </div>
      {issuesOpen && <IssuesPanel schedule={schedule} onClose={() => setIssuesOpen(false)} onShow={selectIssue} />}
    </main>
  );
}
