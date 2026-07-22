import { createGenerationRequest } from "../../domain/schedule/adapters";
import type { GeneratedSchedule, ScheduleDraft } from "../../domain/schedule/types";
import type { EmployeeWish } from "../../domain/wishes/types";
import { scheduleEngine } from "../engine/MockScheduleEngine";

const period = { start: "2026-07-06", end: "2026-07-12", timezone: "Asia/Yekaterinburg" };

export const demoWishes: EmployeeWish[] = [
  {
    id: "wish-anna-morning", employeeId: "employee-1", employeeName: "Анна Смирнова",
    text: "Предпочитаю утренние смены с понедельника по среду", type: "preferred_time", status: "included",
    createdAt: "2026-07-02T09:20:00.000Z", appliesFrom: period.start, appliesTo: period.end,
    parsedInterpretation: { summary: "Утренние смены · Пн–Ср", strength: "soft", weekdays: [0, 1, 2], timeFrom: "08:00", timeTo: "14:00" },
    outcome: { summary: "Учтено", explanation: "Анне назначены утренние смены 6 и 7 июля." }, relatedScheduleIds: ["schedule-demo-main"],
  },
  {
    id: "wish-ivan-saturday", employeeId: "employee-2", employeeName: "Иван Петров",
    text: "Не могу работать в субботу — плановые занятия", type: "unavailability", status: "included",
    createdAt: "2026-07-01T13:10:00.000Z", appliesFrom: "2026-07-11", appliesTo: "2026-07-11",
    parsedInterpretation: { summary: "Не работать · Сб", strength: "hard", weekdays: [5] },
    outcome: { summary: "Учтено", explanation: "На 11 июля Ивану не назначены смены." }, relatedScheduleIds: ["schedule-demo-main"],
  },
  {
    id: "wish-maria-with-anna", employeeId: "employee-3", employeeName: "Мария Козлова",
    text: "Прошу ставить меня в пару с Анной Смирновой", type: "work_with", status: "partially_included",
    createdAt: "2026-06-30T08:45:00.000Z", parsedInterpretation: { summary: "Работать вместе с Анной", strength: "soft", targetEmployeeId: "employee-1" },
    outcome: { summary: "Учтено частично", explanation: "Совместная смена назначена 9 июля, но 11 июля Анна недоступна." }, relatedScheduleIds: ["schedule-demo-main"],
  },
  {
    id: "wish-dmitry-night", employeeId: "employee-4", employeeName: "Дмитрий Волков",
    text: "Хочу избегать ночных смен после пятницы", type: "avoid_shift", status: "needs_review",
    createdAt: "2026-06-29T16:30:00.000Z", parsedInterpretation: { summary: "Избегать ночных смен · после Пт", strength: "soft", weekdays: [5, 6], timeFrom: "22:00", timeTo: "06:00" },
    outcome: { summary: "Нужно проверить", explanation: "Одна ночная смена осталась из-за обязательного покрытия." }, relatedScheduleIds: ["schedule-demo-main"],
  },
  {
    id: "wish-elena-stable", employeeId: "employee-5", employeeName: "Елена Новикова",
    text: "Предпочитаю фиксированный график 09:00–18:00", type: "preferred_time", status: "new",
    createdAt: "2026-06-28T11:00:00.000Z", parsedInterpretation: { summary: "Фиксированное время · 09:00–18:00", strength: "soft", timeFrom: "09:00", timeTo: "18:00" },
    relatedScheduleIds: [],
  },
];

export function createDemoDraft(): ScheduleDraft {
  const roles = [
    { id: "role-operator", name: "Оператор", color: "#8b5cf6" },
    { id: "role-senior", name: "Старший смены", color: "#ec4899" },
    { id: "role-admin", name: "Администратор", color: "#0ea5e9" },
  ];
  const employees = [
    { id: "employee-1", name: "Анна Смирнова", roleIds: ["role-operator"], absences: [], timePreferences: [{ id: "wish-anna-morning", preference: "prefer" as const, recurrence: "weekly" as const, weekdays: [0,1,2], timeFrom: "08:00", timeTo: "14:00", strength: "soft" as const }], teammatePreferences: [] },
    { id: "employee-2", name: "Иван Петров", roleIds: ["role-senior"], absences: [{ id: "absence-ivan-sat", type: "other" as const, recurrence: "once" as const, onceDate: "2026-07-11" }], timePreferences: [], teammatePreferences: [] },
    { id: "employee-3", name: "Мария Козлова", roleIds: ["role-operator"], absences: [{ id: "absence-maria", type: "vacation" as const, dateFrom: "2026-07-10", dateTo: "2026-07-11" }], timePreferences: [], teammatePreferences: [{ id: "wish-maria-with-anna", targetEmployeeId: "employee-1", targetName: "Анна Смирнова", preference: "with" as const, strength: "soft" as const }] },
    { id: "employee-4", name: "Дмитрий Волков", roleIds: ["role-admin"], absences: [], timePreferences: [{ id: "wish-dmitry-night", preference: "avoid" as const, recurrence: "weekly" as const, weekdays: [5,6], timeFrom: "22:00", timeTo: "06:00", strength: "soft" as const }], teammatePreferences: [] },
    { id: "employee-5", name: "Елена Новикова", roleIds: ["role-operator"], absences: [], timePreferences: [{ id: "wish-elena-stable", preference: "prefer" as const, recurrence: "daily" as const, timeFrom: "09:00", timeTo: "18:00", strength: "soft" as const }], teammatePreferences: [] },
  ];
  return {
    schemaVersion: 1, id: "draft-demo-main", source: "dashboard", sourceDraftId: "demo-main", revision: 1,
    name: "Основное расписание", period, workPattern: { type: "daily" }, roles, employees,
    shiftTemplates: [
      { id: "shift-morning", name: "Утро", startTime: "08:00", endTime: "16:00", requiredRoleId: "role-operator" },
      { id: "shift-day", name: "День", startTime: "10:00", endTime: "19:00", requiredRoleId: null },
      { id: "shift-evening", name: "Вечер", startTime: "14:00", endTime: "22:00", requiredRoleId: "role-senior" },
      { id: "shift-night", name: "Ночь", startTime: "22:00", endTime: "06:00", requiredRoleId: "role-admin" },
    ],
    rules: { breaks: [{ id: "break-lunch", from: "13:00", to: "14:00" }], nonWorkingDates: [], minimumRestHours: 10, preferStableShiftTimes: true },
    createdAt: "2026-06-25T10:00:00.000Z", updatedAt: "2026-07-05T14:30:00.000Z",
  };
}

export async function createDemoSchedules(): Promise<{ drafts: ScheduleDraft[]; schedules: GeneratedSchedule[] }> {
  const mainDraft = createDemoDraft();
  const main = await scheduleEngine.generate(createGenerationRequest(mainDraft));
  main.id = "schedule-demo-main";
  main.status = "needs_review";
  main.createdAt = mainDraft.createdAt;
  main.updatedAt = mainDraft.updatedAt;
  main.issues = main.issues.slice(0, 2);
  main.metrics.unresolvedIssueCount = 2;
  main.metrics.coveragePercent = 96;
  main.metrics.qualityScore = 94;
  main.metrics.wishesSatisfied = 8;
  main.metrics.wishesTotal = 10;

  const publishedDraft: ScheduleDraft = { ...mainDraft, id: "draft-demo-published", sourceDraftId: "demo-published", name: "Расписание за июнь", period: { ...period, start: "2026-06-22", end: "2026-06-28" }, createdAt: "2026-06-15T08:00:00.000Z", updatedAt: "2026-06-21T12:00:00.000Z" };
  const published = await scheduleEngine.generate(createGenerationRequest(publishedDraft));
  published.id = "schedule-demo-published";
  published.status = "published";
  published.issues = [];
  published.metrics.unresolvedIssueCount = 0;
  published.metrics.coveragePercent = 100;
  published.publishedAt = "2026-06-21T12:00:00.000Z";

  const draftInput: ScheduleDraft = { ...mainDraft, id: "draft-demo-next", sourceDraftId: "demo-next", name: "Черновик на август", period: { ...period, start: "2026-08-03", end: "2026-08-09" }, shiftTemplates: mainDraft.shiftTemplates.slice(0, 2), createdAt: "2026-07-20T09:00:00.000Z", updatedAt: "2026-07-21T15:40:00.000Z" };
  const draftSchedule = await scheduleEngine.generate(createGenerationRequest(draftInput));
  draftSchedule.id = "schedule-demo-next";
  draftSchedule.status = "draft";
  draftSchedule.assignments = [];
  draftSchedule.metrics = { ...draftSchedule.metrics, coveragePercent: 0, coveredSlots: 0, totalSlots: 14, unresolvedIssueCount: 0 };

  return { drafts: [mainDraft, publishedDraft, draftInput], schedules: [main, published, draftSchedule] };
}
