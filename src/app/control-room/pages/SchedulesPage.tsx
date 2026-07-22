import { Archive, Copy, MoreHorizontal, Printer, Search, Settings2, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { GeneratedSchedule, ScheduleStatus } from "../../../domain/schedule/types";
import type { LanguageCode } from "../../components/NavMenu";
import { TopLevelPageLayout } from "../components/PageLayout";
import { ScheduleMiniPreview } from "../components/ScheduleMiniPreview";
import { formatPeriod, statusLabel } from "../scheduleUtils";

interface Props {
  language: LanguageCode;
  notification: ReactNode;
  schedules: GeneratedSchedule[];
  onCreate: () => void;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onPrint: (id: string) => void;
  onDuplicate: (schedule: GeneratedSchedule) => void;
  onArchive: (schedule: GeneratedSchedule) => void;
  onRemove: (schedule: GeneratedSchedule) => void;
}

type Filter = "all" | ScheduleStatus;

export function SchedulesPage({ language, notification, schedules, onCreate, onOpen, onEdit, onPrint, onDuplicate, onArchive, onRemove }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const visible = schedules.filter(item => (filter === "all" || item.status === filter) && item.name.toLocaleLowerCase("ru").includes(query.trim().toLocaleLowerCase("ru")));
  const filters: Array<[Filter, string]> = [["all", "Все"], ["needs_review", "На проверке"], ["published", "Опубликовано"], ["draft", "Черновики"]];
  return (
    <TopLevelPageLayout page="schedules" language={language} width="list" notification={notification} onCreateSchedule={onCreate}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div className="cr-filter-row" style={{ marginBottom: 0 }}>{filters.map(([value, label]) => <button key={value} className={`cr-filter ${filter === value ? "is-active" : ""}`} onClick={() => setFilter(value)}>{label}</button>)}</div>
        <label style={{ position: "relative" }}><Search size={14} style={{ position: "absolute", left: 11, top: 13, color: "var(--cr-muted)" }} /><input className="cr-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Найти по названию" style={{ paddingLeft: 32 }} /></label>
      </div>
      {visible.length ? <div className="cr-schedule-list">{visible.map(schedule => <article className="cr-panel cr-schedule-card" key={schedule.id}><div className="cr-card-head"><div><h2>{schedule.name}</h2><p>{formatPeriod(schedule)}</p></div><span className={`cr-status ${schedule.status}`}>{statusLabel(schedule.status)}</span></div><ScheduleMiniPreview schedule={schedule} /><div className="cr-card-metrics"><span><strong>{schedule.employees.length}</strong> сотрудников</span><span><strong>{schedule.assignments.length}</strong> назначений</span><span><strong>{schedule.metrics.coveragePercent}%</strong> покрытия</span><span><strong>{schedule.metrics.unresolvedIssueCount}</strong> вопросов</span></div><div className="cr-card-actions"><button className="cr-primary" onClick={() => onOpen(schedule.id)}>Открыть</button><div className="cr-menu-wrap"><button className="cr-icon-button" onClick={() => setMenuId(menuId === schedule.id ? null : schedule.id)} aria-label={`Действия с расписанием ${schedule.name}`}><MoreHorizontal size={17} /></button>{menuId === schedule.id && <div className="cr-menu"><button onClick={() => { setMenuId(null); onEdit(schedule.id); }}><Settings2 size={13} /> Редактировать параметры</button><button onClick={() => { setMenuId(null); onDuplicate(schedule); }}><Copy size={13} /> Дублировать</button><button onClick={() => { setMenuId(null); onPrint(schedule.id); }}><Printer size={13} /> Печать</button><button onClick={() => { setMenuId(null); onArchive(schedule); }}><Archive size={13} /> Архивировать</button><button className="danger" onClick={() => { setMenuId(null); if (window.confirm(`Удалить расписание «${schedule.name}»?`)) onRemove(schedule); }}><Trash2 size={13} /> Удалить</button></div>}</div></div></article>)}</div> : <div className="cr-panel cr-empty"><div><div className="cr-block-illustration" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index} />)}</div><h2>{schedules.length ? "Ничего не найдено" : "Пока нет расписаний"}</h2><p>{schedules.length ? "Измените фильтр или запрос поиска." : "Создайте первое расписание — сотрудники, смены и пожелания будут собраны в одном месте."}</p></div></div>}
    </TopLevelPageLayout>
  );
}
