import { AlertTriangle, ArrowRight, CheckCircle2, FilePenLine } from "lucide-react";
import type { ReactNode } from "react";
import type { GeneratedSchedule, ScheduleStatus } from "../../../domain/schedule/types";
import type { EmployeeWish } from "../../../domain/wishes/types";
import type { LanguageCode } from "../../components/NavMenu";
import { TopLevelPageLayout } from "../components/PageLayout";
import { controlRoomLocale, overviewCopy } from "../localization";
import { formatPeriod, statusLabel } from "../scheduleUtils";

interface Props {
  language: LanguageCode;
  notification: ReactNode;
  schedules: GeneratedSchedule[];
  wishes: EmployeeWish[];
  onCreate: () => void;
  onOpenSchedule: (id: string, issues?: boolean) => void;
  onOpenWishes: () => void;
}

type RelevantSchedule = { kind: "current" | "next"; schedule: GeneratedSchedule } | { kind: "empty"; schedule: null };

const STATUS_PRIORITY: Record<ScheduleStatus, number> = {
  published: 0,
  ready: 1,
  needs_review: 2,
  generating: 3,
  draft: 4,
  archived: 5,
  failed: 6,
};

function dateInTimeZone(date: Date, timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  } catch {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
}

export function selectRelevantSchedule(schedules: GeneratedSchedule[], now = new Date()): RelevantSchedule {
  const candidates = schedules.filter(schedule => schedule.status !== "archived" && schedule.status !== "failed");
  const current = candidates
    .filter(schedule => {
      const today = dateInTimeZone(now, schedule.period.timezone);
      return schedule.period.start <= today && schedule.period.end >= today;
    })
    .sort((left, right) => STATUS_PRIORITY[left.status] - STATUS_PRIORITY[right.status] || right.updatedAt.localeCompare(left.updatedAt))[0];
  if (current) return { kind: "current", schedule: current };

  const next = candidates
    .filter(schedule => schedule.period.start > dateInTimeZone(now, schedule.period.timezone))
    .sort((left, right) => left.period.start.localeCompare(right.period.start) || STATUS_PRIORITY[left.status] - STATUS_PRIORITY[right.status])[0];
  return next ? { kind: "next", schedule: next } : { kind: "empty", schedule: null };
}

export function OverviewPage({ language, notification, schedules, wishes, onCreate, onOpenSchedule, onOpenWishes }: Props) {
  const locale = controlRoomLocale(language);
  const copy = overviewCopy[locale];
  const relevant = selectRelevantSchedule(schedules);
  const schedule = relevant.schedule;
  const newWishes = wishes
    .filter(item => item.status === "new" || item.status === "needs_review")
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  const issueItems = schedules
    .filter(item => item.status !== "archived" && item.status !== "failed")
    .flatMap(item => item.issues.filter(issue => !issue.resolved).map(issue => ({
      id: `${item.id}-${issue.id}`,
      title: issue.title,
      description: issue.description,
      tone: "warning" as const,
      action: () => onOpenSchedule(item.id, true),
    })))
    .slice(0, 2);
  const unfinishedDraft = schedules
    .filter(item => item.status === "draft" || item.status === "generating")
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
  const reviewWish = newWishes.find(item => item.status === "needs_review");
  const attentionItems = [
    ...issueItems,
    ...(unfinishedDraft ? [{
      id: `draft-${unfinishedDraft.id}`,
      title: copy.unfinishedDraft,
      description: `${unfinishedDraft.name} · ${copy.unfinishedDraftDescription}`,
      tone: "draft" as const,
      action: () => onOpenSchedule(unfinishedDraft.id),
    }] : []),
    ...(reviewWish ? [{
      id: `wish-${reviewWish.id}`,
      title: copy.preferenceNeedsReview,
      description: `${reviewWish.employeeName} · ${reviewWish.text}`,
      tone: "warning" as const,
      action: onOpenWishes,
    }] : []),
  ].slice(0, 3);

  return (
    <TopLevelPageLayout page="overview" language={language} width="default" notification={notification} onCreateSchedule={onCreate}>
      <div className="cr-overview-stack">
        <section className={`cr-panel cr-current-schedule is-${relevant.kind}`} aria-labelledby="current-schedule-title">
          <div className="cr-current-schedule-copy">
            {schedule ? (
              <>
                <span className="cr-current-schedule-kicker">{relevant.kind === "current" ? copy.currentSchedule : copy.nextSchedule}</span>
                <div className="cr-current-schedule-title-row">
                  <h2 id="current-schedule-title">{schedule.name}</h2>
                  <span className={`cr-status ${schedule.status}`}>{statusLabel(schedule.status, locale)}</span>
                </div>
                <p>{formatPeriod(schedule, locale)}</p>
              </>
            ) : (
              <>
                <h2 id="current-schedule-title">{copy.noSchedule}</h2>
                <p>{copy.noScheduleDescription}</p>
              </>
            )}
          </div>
          {schedule && (
            <>
              <dl className="cr-current-schedule-facts">
                <div><dt>{copy.employees}</dt><dd>{schedule.employees.length}</dd></div>
                <div><dt>{copy.coverage}</dt><dd>{schedule.metrics.coveragePercent}%</dd></div>
              </dl>
              <button className="cr-secondary cr-current-schedule-action" onClick={() => onOpenSchedule(schedule.id)}>
                {schedule.status === "draft" || schedule.status === "generating" ? copy.continueSchedule : copy.openSchedule}
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            </>
          )}
        </section>

        <div className="cr-overview-detail-grid">
          <section className="cr-panel cr-overview-section cr-overview-attention" aria-labelledby="overview-attention-title">
            <h2 className="cr-section-title" id="overview-attention-title">{copy.attention}</h2>
            {attentionItems.length ? (
              <div className="cr-attention-list">
                {attentionItems.map(item => (
                  <button className={`cr-attention-item is-${item.tone}`} onClick={item.action} key={item.id}>
                    <span className="cr-attention-icon">{item.tone === "draft" ? <FilePenLine size={14} /> : <AlertTriangle size={14} />}</span>
                    <span className="cr-attention-copy"><strong>{item.title}</strong><span>{item.description}</span></span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="cr-overview-positive"><CheckCircle2 size={18} aria-hidden="true" /><span><strong>{copy.allClear}</strong><small>{copy.allClearDescription}</small></span></div>
            )}
          </section>

          <section className="cr-panel cr-overview-section cr-overview-preferences" aria-labelledby="overview-preferences-title">
            <h2 className="cr-section-title" id="overview-preferences-title">{copy.newPreferences}</h2>
            {newWishes.length ? (
              <div className="cr-overview-preference-list">
                {newWishes.slice(0, 3).map(wish => (
                  <button className="cr-overview-preference-row" key={wish.id} onClick={onOpenWishes}>
                    <span className="cr-avatar" aria-hidden="true">{wish.employeeName[0]}</span>
                    <span className="cr-compact-copy"><strong>{wish.employeeName}</strong><span>{wish.text}</span></span>
                    <span className={`cr-status ${wish.status === "needs_review" ? "needs_review" : "draft"}`}>{wish.status === "needs_review" ? copy.needsReviewWish : copy.newWish}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="cr-overview-positive"><CheckCircle2 size={18} aria-hidden="true" /><span><strong>{copy.noNewPreferences}</strong></span></div>
            )}
            <button className="cr-ghost cr-compact-link" onClick={onOpenWishes}>{copy.openPreferences} <ArrowRight size={13} aria-hidden="true" /></button>
          </section>
        </div>
      </div>
    </TopLevelPageLayout>
  );
}
