import { AlertTriangle, ArrowRight, CalendarDays, Plus, Sparkles } from "lucide-react";
import type { GeneratedSchedule } from "../../../domain/schedule/types";
import type { EmployeeWish } from "../../../domain/wishes/types";
import { ScheduleMiniPreview } from "../components/ScheduleMiniPreview";
import { formatPeriod, statusLabel } from "../scheduleUtils";

interface Props {
  schedules: GeneratedSchedule[];
  wishes: EmployeeWish[];
  onCreate: () => void;
  onOpenSchedule: (id: string, issues?: boolean) => void;
  onOpenWishes: () => void;
}

export function OverviewPage({ schedules, wishes, onCreate, onOpenSchedule, onOpenWishes }: Props) {
  const active = schedules.find(item => item.status === "needs_review") ?? schedules.find(item => item.status === "ready" || item.status === "published") ?? schedules[0];
  const newWishes = wishes.filter(item => item.status === "new" || item.status === "needs_review");
  if (!active) return <main className="cr-page"><div className="cr-page-limit"><div className="cr-panel cr-empty"><div><div className="cr-block-illustration" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index} />)}</div><h2>Пока нет расписаний</h2><p>Создайте первое расписание — сотрудники, смены и пожелания будут собраны в одном месте.</p><button className="cr-primary" onClick={onCreate}><Plus size={15} /> Создать расписание</button></div></div></div></main>;

  const attention = [
    ...active.issues.filter(item => !item.resolved).slice(0, 2).map(item => ({ id: item.id, title: item.title, description: item.description, action: () => onOpenSchedule(active.id, true) })),
    ...newWishes.slice(0, 1).map(item => ({ id: item.id, title: `Новое пожелание · ${item.employeeName}`, description: item.text, action: onOpenWishes })),
  ];

  return (
    <main className="cr-page">
      <div className="cr-page-limit">
        <div className="cr-heading-row"><div><h1>Добрый день</h1><p>Главное о расписаниях и ситуациях, которые требуют внимания.</p></div><button className="cr-primary" onClick={onCreate}><Plus size={15} /> Создать<span className="cr-desktop-only"> расписание</span></button></div>
        <div className="cr-overview-grid">
          <section className="cr-panel cr-hero">
            <div className="cr-hero-title"><div><span className={`cr-status ${active.status}`}>{statusLabel(active.status)}</span><h2>{active.name}</h2><span className="cr-period">{formatPeriod(active)}</span></div><Sparkles size={20} color="var(--cr-violet)" /></div>
            <div className="cr-health-inline"><span>Покрытие <strong>{active.metrics.coveragePercent}%</strong></span><span>Обязательные условия <strong>{active.metrics.hardConstraintsSatisfied}/{active.metrics.hardConstraintsTotal}</strong></span><span>Пожелания <strong>{active.metrics.wishesSatisfied}/{active.metrics.wishesTotal}</strong></span><span>Вопросы <strong>{active.metrics.unresolvedIssueCount}</strong></span></div>
            <ScheduleMiniPreview schedule={active} />
            <button className="cr-primary" style={{ marginTop: 18 }} onClick={() => onOpenSchedule(active.id)}>Открыть расписание <ArrowRight size={14} /></button>
          </section>
          <section className="cr-panel cr-attention">
            <h2 className="cr-section-title">Требует внимания</h2>
            <div className="cr-attention-list">
              {attention.length ? attention.map(item => <button className="cr-attention-item" onClick={item.action} key={item.id}><span className="cr-attention-icon"><AlertTriangle size={14} /></span><span className="cr-attention-copy"><strong>{item.title}</strong><span>{item.description}</span></span></button>) : <div className="cr-empty" style={{ minHeight: 210, padding: 12 }}><div><Sparkles size={24} color="var(--cr-success)" /><h2>Всё спокойно</h2><p>Нет ситуаций, требующих решения.</p></div></div>}
            </div>
          </section>
        </div>
        <div className="cr-below-grid">
          <section className="cr-panel cr-compact-section"><h2 className="cr-section-title">Последние расписания</h2>{schedules.slice(0, 4).map(schedule => <div className="cr-compact-row" key={schedule.id} role="button" tabIndex={0} onClick={() => onOpenSchedule(schedule.id)} onKeyDown={event => { if (event.key === "Enter") onOpenSchedule(schedule.id); }}><CalendarDays className="cr-row-icon" size={16} color="var(--cr-violet)" /><div className="cr-compact-copy"><strong>{schedule.name}</strong><span>{formatPeriod(schedule)} · {schedule.metrics.coveragePercent}% покрытия</span></div><span className={`cr-status ${schedule.status}`}>{statusLabel(schedule.status)}</span></div>)}</section>
          <section className="cr-panel cr-compact-section"><h2 className="cr-section-title">Новые пожелания</h2>{newWishes.slice(0, 3).map(wish => <div className="cr-compact-row" key={wish.id} role="button" tabIndex={0} onClick={onOpenWishes} onKeyDown={event => { if (event.key === "Enter") onOpenWishes(); }}><div className="cr-avatar">{wish.employeeName[0]}</div><div className="cr-compact-copy"><strong>{wish.employeeName}</strong><span>{wish.text}</span></div></div>)}{!newWishes.length && <p style={{ color: "var(--cr-muted)", fontSize: 12 }}>Новых пожеланий нет.</p>}<button className="cr-ghost cr-compact-link" onClick={onOpenWishes}>Открыть очередь <ArrowRight size={13} /></button></section>
        </div>
      </div>
    </main>
  );
}
