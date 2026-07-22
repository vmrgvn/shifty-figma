import type { LanguageCode } from "../components/NavMenu";

export type ControlRoomLocale = "ru" | "en";
export type TopLevelPageId = "overview" | "schedules" | "preferences" | "settings";

export function controlRoomLocale(language: LanguageCode): ControlRoomLocale {
  return language === "ru" ? "ru" : "en";
}

export const topLevelPageCopy: Record<ControlRoomLocale, {
  createSchedule: string;
  pages: Record<TopLevelPageId, { title: string; description: string }>;
}> = {
  ru: {
    createSchedule: "Создать расписание",
    pages: {
      overview: { title: "Обзор", description: "Главное по команде и расписаниям" },
      schedules: { title: "Расписания", description: "Создавайте, проверяйте и публикуйте расписания смен" },
      preferences: { title: "Пожелания", description: "Собирайте пожелания команды и учитывайте их в расписании" },
      settings: { title: "Настройки", description: "Управляйте командой, правилами расписания и приложением" },
    },
  },
  en: {
    createSchedule: "Create schedule",
    pages: {
      overview: { title: "Overview", description: "A clear view of your team and schedules" },
      schedules: { title: "Schedules", description: "Create, review, and publish shift schedules" },
      preferences: { title: "Preferences", description: "Collect team preferences and account for them in schedules" },
      settings: { title: "Settings", description: "Manage your team, scheduling rules, and app preferences" },
    },
  },
};

export const overviewCopy = {
  ru: {
    currentSchedule: "Текущее расписание",
    nextSchedule: "Следующее расписание",
    noSchedule: "Расписание не создано",
    noScheduleDescription: "На текущий или будущий период расписаний пока нет.",
    employees: "Сотрудников",
    coverage: "Покрытие",
    openSchedule: "Открыть расписание",
    continueSchedule: "Продолжить",
    attention: "Требует внимания",
    allClear: "Всё спокойно",
    allClearDescription: "Нет ситуаций, требующих решения.",
    unfinishedDraft: "Незавершённый черновик",
    unfinishedDraftDescription: "Расписание ещё не готово к публикации.",
    preferenceNeedsReview: "Пожелание требует проверки",
    newPreferences: "Новые пожелания",
    noNewPreferences: "Новых пожеланий нет.",
    openPreferences: "Все пожелания",
    newWish: "Новое",
    needsReviewWish: "Нужно проверить",
  },
  en: {
    currentSchedule: "Current schedule",
    nextSchedule: "Next schedule",
    noSchedule: "No schedule yet",
    noScheduleDescription: "There is no schedule for the current or an upcoming period.",
    employees: "Employees",
    coverage: "Coverage",
    openSchedule: "Open schedule",
    continueSchedule: "Continue",
    attention: "Requires attention",
    allClear: "All clear",
    allClearDescription: "There are no situations that need a decision.",
    unfinishedDraft: "Unfinished draft",
    unfinishedDraftDescription: "This schedule is not ready to publish yet.",
    preferenceNeedsReview: "Preference needs review",
    newPreferences: "New preferences",
    noNewPreferences: "No new preferences.",
    openPreferences: "View all preferences",
    newWish: "New",
    needsReviewWish: "Needs review",
  },
} satisfies Record<ControlRoomLocale, Record<string, string>>;
