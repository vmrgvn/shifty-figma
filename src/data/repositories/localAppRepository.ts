import { createGenerationRequest, legacyWizardToDraft, scheduleDraftToLegacyWizard } from "../../domain/schedule/adapters";
import type { GeneratedSchedule, LegacyWizardSnapshot, ScheduleDraft } from "../../domain/schedule/types";
import type { EmployeeWish } from "../../domain/wishes/types";
import { scheduleEngine } from "../engine/MockScheduleEngine";
import { createDemoSchedules, demoWishes } from "../fixtures/shiftyDemo";

const ROOT_KEY = "shifty.app.v1";
const LEGACY_DRAFT_KEY = "shifty-wizard-draft";
const LEGACY_SCHEDULES_KEY = "shifty-schedules";

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  target: string;
  createdAt: string;
  read: boolean;
  tone: "info" | "warning" | "success";
}

export type DesktopNavigationPreference = "compact" | "pinned";

export interface AppPreferences {
  theme: "system" | "dark" | "light";
  language: "ru";
  timezone: string;
  weekStartsOn: 1;
  desktopNavigation: DesktopNavigationPreference;
  notifications: { wishes: boolean; generation: boolean; issues: boolean; publication: boolean };
}

interface PendingPublicSchedule {
  sourceDraftId: string;
  draft: ScheduleDraft;
  schedule: GeneratedSchedule;
  importedScheduleId?: string;
}

interface AppState {
  schemaVersion: 1;
  drafts: ScheduleDraft[];
  schedules: GeneratedSchedule[];
  wishes: EmployeeWish[];
  notifications: AppNotification[];
  preferences: AppPreferences;
  pendingPublic?: PendingPublicSchedule;
  demoSeeded: boolean;
}

const defaultPreferences: AppPreferences = {
  theme: "system",
  language: "ru",
  timezone: "Asia/Yekaterinburg",
  weekStartsOn: 1,
  desktopNavigation: "compact",
  notifications: { wishes: true, generation: true, issues: true, publication: true },
};

function defaultState(): AppState {
  const legacyTheme = localStorage.getItem("shifty-theme");
  return {
    schemaVersion: 1,
    drafts: [], schedules: [], wishes: [], notifications: [], demoSeeded: false,
    preferences: { ...defaultPreferences, theme: legacyTheme === "dark" || legacyTheme === "light" ? legacyTheme : "system" },
  };
}

function normalizeState(value: unknown): AppState {
  const fallback = defaultState();
  if (!value || typeof value !== "object") return fallback;
  const input = value as Partial<AppState>;
  if (input.schemaVersion !== 1) return fallback;
  return {
    ...fallback,
    ...input,
    drafts: Array.isArray(input.drafts) ? input.drafts : [],
    schedules: Array.isArray(input.schedules) ? input.schedules.filter(item => item?.schemaVersion === 1) : [],
    wishes: Array.isArray(input.wishes) ? input.wishes : [],
    notifications: Array.isArray(input.notifications) ? input.notifications : [],
    preferences: {
      ...fallback.preferences,
      ...(input.preferences ?? {}),
      language: "ru",
      desktopNavigation: input.preferences?.desktopNavigation === "pinned" ? "pinned" : "compact",
      notifications: { ...fallback.preferences.notifications, ...(input.preferences?.notifications ?? {}) },
    },
  };
}

function readState(): AppState {
  try { return normalizeState(JSON.parse(localStorage.getItem(ROOT_KEY) ?? "null")); }
  catch { return defaultState(); }
}

function writeState(state: AppState): void {
  localStorage.setItem(ROOT_KEY, JSON.stringify(state));
}

export const legacyWizardDraftStore = {
  read(): Record<string, unknown> {
    try { return JSON.parse(localStorage.getItem(LEGACY_DRAFT_KEY) ?? "null") ?? {}; }
    catch { return {}; }
  },
  write(value: Record<string, unknown>): void { localStorage.setItem(LEGACY_DRAFT_KEY, JSON.stringify(value)); },
  remove(): void { localStorage.removeItem(LEGACY_DRAFT_KEY); },
};

export const scheduleRepository = {
  async list(): Promise<GeneratedSchedule[]> { return readState().schedules.filter(item => item.status !== "archived").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); },
  async get(id: string): Promise<GeneratedSchedule | null> { return readState().schedules.find(item => item.id === id) ?? null; },
  async save(schedule: GeneratedSchedule): Promise<void> {
    const state = readState();
    state.schedules = state.schedules.some(item => item.id === schedule.id) ? state.schedules.map(item => item.id === schedule.id ? schedule : item) : [schedule, ...state.schedules];
    writeState(state);
  },
  async remove(id: string): Promise<void> { const state = readState(); state.schedules = state.schedules.filter(item => item.id !== id); writeState(state); },
};

export const draftRepository = {
  async list(): Promise<ScheduleDraft[]> { return readState().drafts; },
  async get(id: string): Promise<ScheduleDraft | null> { return readState().drafts.find(item => item.id === id) ?? null; },
  async save(draft: ScheduleDraft): Promise<void> {
    const state = readState();
    state.drafts = state.drafts.some(item => item.id === draft.id) ? state.drafts.map(item => item.id === draft.id ? draft : item) : [draft, ...state.drafts];
    writeState(state);
  },
};

export const wishRepository = {
  async list(): Promise<EmployeeWish[]> { return readState().wishes; },
  async save(wish: EmployeeWish): Promise<void> {
    const state = readState();
    state.wishes = state.wishes.some(item => item.id === wish.id) ? state.wishes.map(item => item.id === wish.id ? wish : item) : [wish, ...state.wishes];
    writeState(state);
  },
};

export const notificationRepository = {
  async list(): Promise<AppNotification[]> { return readState().notifications; },
  async markRead(id?: string): Promise<void> { const state = readState(); state.notifications = state.notifications.map(item => !id || item.id === id ? { ...item, read: true } : item); writeState(state); },
  async add(notification: AppNotification): Promise<void> { const state = readState(); state.notifications = [notification, ...state.notifications.filter(item => item.id !== notification.id)]; writeState(state); },
};

export const preferencesRepository = {
  get(): AppPreferences { return readState().preferences; },
  save(patch: Partial<AppPreferences>): AppPreferences {
    const state = readState();
    state.preferences = { ...state.preferences, ...patch, language: "ru", notifications: { ...state.preferences.notifications, ...(patch.notifications ?? {}) } };
    writeState(state);
    return state.preferences;
  },
};

export async function bootstrapApplicationData(): Promise<void> {
  const state = readState();
  if (state.demoSeeded) return;
  let migrated = false;
  try {
    const legacySchedules = JSON.parse(localStorage.getItem(LEGACY_SCHEDULES_KEY) ?? "[]") as Array<Record<string, unknown>>;
    for (const legacy of Array.isArray(legacySchedules) ? legacySchedules : []) {
      const raw = { scheduleName: legacy.name, employees: legacy.employees, globalRoles: legacy.globalRoles, step3Data: legacy.step3Data, step5Data: legacy.step5Data };
      const draft = legacyWizardToDraft(raw, "dashboard");
      const schedule = await scheduleEngine.generate(createGenerationRequest(draft));
      schedule.id = String(legacy.id || schedule.id);
      schedule.createdAt = String(legacy.createdAt || schedule.createdAt);
      schedule.updatedAt = String(legacy.updatedAt || schedule.updatedAt);
      state.drafts.push(draft); state.schedules.push(schedule); migrated = true;
    }
  } catch { /* corrupted legacy data is ignored safely */ }

  if (!migrated && state.schedules.length === 0) {
    const demo = await createDemoSchedules();
    state.drafts = demo.drafts;
    state.schedules = demo.schedules;
  }
  state.wishes = state.wishes.length ? state.wishes : demoWishes;
  state.notifications = state.notifications.length ? state.notifications : [
    { id: "notification-ready", title: "Расписание готово к проверке", description: "Основное расписание · 6–12 июля", target: "/app/schedules/schedule-demo-main", createdAt: "2026-07-05T14:31:00.000Z", read: false, tone: "success" },
    { id: "notification-open", title: "Две ситуации требуют решения", description: "Проверьте открытые смены и нагрузку", target: "/app/schedules/schedule-demo-main?issues=1", createdAt: "2026-07-05T14:32:00.000Z", read: false, tone: "warning" },
    { id: "notification-wish", title: "Новое пожелание от Елены Новиковой", description: "Фиксированный график 09:00–18:00", target: "/app/wishes", createdAt: "2026-07-04T11:00:00.000Z", read: true, tone: "info" },
  ];
  state.demoSeeded = true;
  writeState(state);
}

export async function preparePendingPublicSchedule(): Promise<GeneratedSchedule | null> {
  const raw = legacyWizardDraftStore.read();
  if (!Array.isArray(raw.employees) || raw.employees.length === 0) return null;
  const draft = legacyWizardToDraft(raw, "public_wizard");
  const schedule = await scheduleEngine.generate(createGenerationRequest(draft));
  const state = readState();
  state.pendingPublic = { sourceDraftId: draft.sourceDraftId!, draft, schedule };
  writeState(state);
  return schedule;
}

export async function importPendingPublicSchedule(): Promise<GeneratedSchedule | null> {
  const state = readState();
  const pending = state.pendingPublic;
  if (!pending) return null;
  const existing = state.schedules.find(item => item.sourceDraftId === pending.sourceDraftId);
  if (existing) {
    pending.importedScheduleId = existing.id;
    writeState(state);
    return existing;
  }
  state.drafts = [pending.draft, ...state.drafts.filter(item => item.id !== pending.draft.id)];
  state.schedules = [pending.schedule, ...state.schedules];
  pending.importedScheduleId = pending.schedule.id;
  state.notifications = [{ id: `notification-import-${pending.sourceDraftId}`, title: "Расписание добавлено в кабинет", description: pending.schedule.name, target: `/app/schedules/${pending.schedule.id}`, createdAt: new Date().toISOString(), read: false, tone: "success" }, ...state.notifications];
  writeState(state);
  return pending.schedule;
}

export async function generateAndSaveLegacyDraft(existingScheduleId?: string): Promise<GeneratedSchedule | null> {
  const raw = legacyWizardDraftStore.read();
  if (!Array.isArray(raw.employees) || raw.employees.length === 0) return null;
  const state = readState();
  const existing = existingScheduleId ? state.schedules.find(item => item.id === existingScheduleId) : undefined;
  const previousDraft = existing ? state.drafts.find(item => item.id === existing.draftId) : undefined;
  const draft = legacyWizardToDraft(raw, "dashboard");
  if (existing) {
    draft.id = existing.draftId;
    draft.sourceDraftId = existing.sourceDraftId;
    draft.revision = existing.revision + 1;
    draft.createdAt = previousDraft?.createdAt ?? existing.createdAt;
  }
  const schedule = await scheduleEngine.generate(createGenerationRequest(draft));
  if (existing) {
    schedule.id = existing.id;
    schedule.createdAt = existing.createdAt;
    schedule.revision = existing.revision + 1;
  }
  state.drafts = state.drafts.some(item => item.id === draft.id) ? state.drafts.map(item => item.id === draft.id ? draft : item) : [draft, ...state.drafts];
  state.schedules = state.schedules.some(item => item.id === schedule.id) ? state.schedules.map(item => item.id === schedule.id ? schedule : item) : [schedule, ...state.schedules];
  state.notifications = [{ id: `notification-generated-${schedule.id}-${schedule.revision}`, title: "Расписание готово к проверке", description: schedule.name, target: `/app/schedules/${schedule.id}`, createdAt: new Date().toISOString(), read: false, tone: "success" }, ...state.notifications];
  writeState(state);
  return schedule;
}

export async function prepareLegacyDraftForEdit(scheduleId: string): Promise<boolean> {
  const state = readState();
  const schedule = state.schedules.find(item => item.id === scheduleId);
  const draft = schedule ? state.drafts.find(item => item.id === schedule.draftId) : undefined;
  if (!draft) return false;
  legacyWizardDraftStore.write(draft.legacySnapshot
    ? draft.legacySnapshot as Record<string, unknown>
    : scheduleDraftToLegacyWizard(draft));
  return true;
}

export async function publishSchedule(scheduleId: string): Promise<GeneratedSchedule | null> {
  const state = readState();
  const schedule = state.schedules.find(item => item.id === scheduleId);
  if (!schedule) return null;
  const updated: GeneratedSchedule = { ...schedule, status: "published", publishedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  state.schedules = state.schedules.map(item => item.id === scheduleId ? updated : item);
  state.notifications = [{ id: `notification-published-${scheduleId}`, title: "Расписание опубликовано", description: updated.name, target: `/app/schedules/${scheduleId}`, createdAt: updated.updatedAt, read: false, tone: "success" }, ...state.notifications];
  writeState(state);
  return updated;
}
