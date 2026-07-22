import type { GeneratedSchedule, ScheduleStatus } from "../../domain/schedule/types";
import type { ControlRoomLocale } from "./localization";

export const WEEKDAY_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function addDays(value: string, amount: number): string {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function datesBetween(start: string, end: string): string[] {
  const values: string[] = [];
  let cursor = start;
  while (cursor <= end && values.length < 62) { values.push(cursor); cursor = addDays(cursor, 1); }
  return values;
}

export function formatDate(value: string, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }, locale: ControlRoomLocale = "ru"): string {
  return new Date(`${value}T12:00:00`).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", options).replace(" г.", "");
}

export function formatPeriod(schedule: Pick<GeneratedSchedule, "period">, locale: ControlRoomLocale = "ru"): string {
  const start = new Date(`${schedule.period.start}T12:00:00`);
  const end = new Date(`${schedule.period.end}T12:00:00`);
  const intlLocale = locale === "ru" ? "ru-RU" : "en-US";
  if (start.getMonth() === end.getMonth()) {
    if (locale === "en") return `${start.toLocaleDateString(intlLocale, { month: "long" })} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`;
    return `${start.getDate()}–${end.toLocaleDateString(intlLocale, { day: "numeric", month: "long", year: "numeric" }).replace(" г.", "")}`;
  }
  return `${formatDate(schedule.period.start, { day: "numeric", month: "short" }, locale)} — ${formatDate(schedule.period.end, { day: "numeric", month: "short", year: "numeric" }, locale)}`;
}

export function weekdayLabel(value: string): string {
  return new Date(`${value}T12:00:00`).toLocaleDateString("ru-RU", { weekday: "short" }).replace(".", "");
}

export function statusLabel(status: ScheduleStatus, locale: ControlRoomLocale = "ru"): string {
  const labels: Record<ControlRoomLocale, Record<ScheduleStatus, string>> = {
    ru: { draft: "Черновик", generating: "Создаётся", needs_review: "На проверке", ready: "Готово", published: "Опубликовано", archived: "В архиве", failed: "Ошибка" },
    en: { draft: "Draft", generating: "Generating", needs_review: "Needs review", ready: "Ready", published: "Published", archived: "Archived", failed: "Failed" },
  };
  return labels[locale][status];
}

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(item => item[0]).join("").toUpperCase();
}

export function assignmentHours(schedule: GeneratedSchedule, employeeId: string): number {
  return schedule.metrics.employeeWorkload.find(item => item.employeeId === employeeId)?.totalHours ?? 0;
}

export function roleFor(schedule: GeneratedSchedule, roleId?: string | null) {
  return schedule.roles.find(item => item.id === roleId);
}

export function shiftFor(schedule: GeneratedSchedule, shiftId: string) {
  return schedule.shiftTemplates.find(item => item.id === shiftId);
}
