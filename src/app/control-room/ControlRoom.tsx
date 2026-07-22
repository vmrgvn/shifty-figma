import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import type { GeneratedSchedule, ScheduleDraft } from "../../domain/schedule/types";
import type { EmployeeWish } from "../../domain/wishes/types";
import {
  bootstrapApplicationData,
  draftRepository,
  generateAndSaveLegacyDraft,
  legacyWizardDraftStore,
  notificationRepository,
  preferencesRepository,
  prepareLegacyDraftForEdit,
  publishSchedule,
  scheduleRepository,
  wishRepository,
  type AppNotification,
  type AppPreferences,
} from "../../data/repositories/localAppRepository";
import { Wizard } from "../components/Wizard";
import type { LanguageCode, ThemeMode } from "../components/NavMenu";
import { OverviewPage } from "./pages/OverviewPage";
import { PrintSchedulePage } from "./pages/PrintSchedulePage";
import { ScheduleWorkspacePage } from "./pages/ScheduleWorkspacePage";
import { SchedulesPage } from "./pages/SchedulesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { WishesPage } from "./pages/WishesPage";
import { AdaptiveNavigation } from "./navigation/AdaptiveNavigation";
import { activeNavigationItem } from "./navigation/navigationModel";
import { NotificationMenu } from "./components/NotificationMenu";

interface Props {
  dark: boolean;
  language: LanguageCode;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onLanguageChange: (language: LanguageCode) => void;
  onLogout: () => void;
}

type ToastState = { id: number; message: string } | null;

export function ControlRoom({ dark, language, theme, onThemeChange, onLogout }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<GeneratedSchedule[]>([]);
  const [wishes, setWishes] = useState<EmployeeWish[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [preferences, setPreferences] = useState<AppPreferences>(() => preferencesRepository.get());
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);
  const toastId = useRef(0);

  const showToast = useCallback((message: string) => {
    const id = ++toastId.current;
    setToast({ id, message });
    window.setTimeout(() => setToast(current => current?.id === id ? null : current), 2300);
  }, []);

  const reload = useCallback(async () => {
    const [nextSchedules, nextWishes, nextNotifications] = await Promise.all([scheduleRepository.list(), wishRepository.list(), notificationRepository.list()]);
    setSchedules(nextSchedules); setWishes(nextWishes); setNotifications(nextNotifications); setPreferences(preferencesRepository.get());
  }, []);

  useEffect(() => { void (async () => { await bootstrapApplicationData(); await reload(); setLoading(false); })(); }, [reload]);

  const path = location.pathname;
  const section = activeNavigationItem(path).id;
  const workspaceMatch = path.match(/^\/app\/schedules\/([^/]+)$/);
  const printMatch = path.match(/^\/print\/([^/]+)$/);
  const selectedSchedule = schedules.find(item => item.id === (workspaceMatch?.[1] ?? printMatch?.[1]));
  const creating = path === "/app/schedules/new";

  const newWishesCount = wishes.filter(item => item.status === "new" || item.status === "needs_review").length;

  const createSchedule = () => { legacyWizardDraftStore.remove(); navigate("/app/schedules/new"); };
  const editSchedule = async (id: string) => {
    const ready = await prepareLegacyDraftForEdit(id);
    if (!ready) { showToast("Параметры старого расписания недоступны"); return; }
    navigate(`/app/schedules/new?editing=${encodeURIComponent(id)}`);
  };
  const saveWizard = async () => {
    const editingId = new URLSearchParams(location.search).get("editing") ?? undefined;
    const schedule = await generateAndSaveLegacyDraft(editingId);
    await reload();
    if (schedule) navigate(`/app/schedules/${schedule.id}`); else navigate("/app/schedules");
  };
  const duplicateSchedule = async (schedule: GeneratedSchedule) => {
    const sourceDraft = await draftRepository.get(schedule.draftId);
    const suffix = Date.now().toString(36);
    const copy: GeneratedSchedule = { ...structuredClone(schedule), id: `schedule-copy-${suffix}`, draftId: `draft-copy-${suffix}`, sourceDraftId: `copy-${suffix}`, name: `${schedule.name} — копия`, status: "draft", publishedAt: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), revision: 1 };
    if (sourceDraft) {
      const draft: ScheduleDraft = { ...structuredClone(sourceDraft), id: copy.draftId, sourceDraftId: copy.sourceDraftId, name: copy.name, source: "dashboard", revision: 1, createdAt: copy.createdAt, updatedAt: copy.updatedAt };
      await draftRepository.save(draft);
    }
    await scheduleRepository.save(copy); await reload(); showToast("Расписание продублировано");
  };
  const archiveSchedule = async (schedule: GeneratedSchedule) => { await scheduleRepository.save({ ...schedule, status: "archived", updatedAt: new Date().toISOString() }); await reload(); showToast("Расписание перемещено в архив"); };
  const removeSchedule = async (schedule: GeneratedSchedule) => { await scheduleRepository.remove(schedule.id); await reload(); showToast("Расписание удалено"); };
  const saveWish = async (wish: EmployeeWish) => { await wishRepository.save(wish); await reload(); showToast("Пожелание обновлено"); };
  const publish = async (id: string) => { await publishSchedule(id); await reload(); showToast("Расписание опубликовано"); };
  const updatePreferences = (patch: Partial<AppPreferences>) => { setPreferences(preferencesRepository.save(patch)); };
  const openNotification = async (notification: AppNotification) => { await notificationRepository.markRead(notification.id); await reload(); navigate(notification.target); };
  const markAllRead = async () => { await notificationRepository.markRead(); await reload(); };

  if (loading) return <div className="cr-root cr-empty"><div><div className="cr-block-illustration" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index} />)}</div><h2>Готовим рабочее пространство</h2><p>Загружаем расписания и пожелания.</p></div></div>;
  if (printMatch) return selectedSchedule ? <PrintSchedulePage schedule={selectedSchedule} onBack={() => navigate(`/app/schedules/${selectedSchedule.id}`)} /> : <div className="cr-root cr-empty"><div><h2>Расписание не найдено</h2><button className="cr-primary" onClick={() => navigate("/app/schedules")}>К расписаниям</button></div></div>;
  if (creating) return <Wizard dark={dark} language={language} theme={theme} onThemeChange={onThemeChange} onLanguageChange={() => {}} onBack={() => navigate("/app/schedules")} onSignUp={saveWizard} signUpLabel="Сохранить и открыть" />;

  const notificationMenu = <NotificationMenu notifications={notifications} pathname={path} onOpen={openNotification} onMarkAllRead={markAllRead} />;
  const content = selectedSchedule && workspaceMatch ? <ScheduleWorkspacePage notification={notificationMenu} schedule={selectedSchedule} openIssuesInitially={new URLSearchParams(location.search).has("issues")} onBack={() => navigate("/app/schedules")} onEdit={() => void editSchedule(selectedSchedule.id)} onPrint={() => navigate(`/print/${selectedSchedule.id}`)} onPublish={() => void publish(selectedSchedule.id)} />
    : section === "overview" ? <OverviewPage notification={notificationMenu} schedules={schedules} wishes={wishes} onCreate={createSchedule} onOpenSchedule={(id, issues) => navigate(`/app/schedules/${id}${issues ? "?issues=1" : ""}`)} onOpenWishes={() => navigate("/app/wishes")} />
    : section === "schedules" ? <SchedulesPage notification={notificationMenu} schedules={schedules} onCreate={createSchedule} onOpen={id => navigate(`/app/schedules/${id}`)} onEdit={id => void editSchedule(id)} onPrint={id => navigate(`/print/${id}`)} onDuplicate={schedule => void duplicateSchedule(schedule)} onArchive={schedule => void archiveSchedule(schedule)} onRemove={schedule => void removeSchedule(schedule)} />
    : section === "wishes" ? <WishesPage notification={notificationMenu} wishes={wishes} onCreate={createSchedule} onSave={wish => void saveWish(wish)} onOpenSchedule={id => navigate(`/app/schedules/${id}`)} />
    : <SettingsPage notification={notificationMenu} onCreate={createSchedule} theme={theme} preferences={preferences} onTheme={onThemeChange} onPreferences={updatePreferences} onLogout={onLogout} />;

  return (
    <div className={`cr-root ${preferences.desktopNavigation === "pinned" ? "cr-nav-prefers-pinned" : ""}`}>
      <AdaptiveNavigation
        pathname={path}
        wishesCount={newWishesCount}
        desktopPreference={preferences.desktopNavigation}
        onDesktopPreferenceChange={desktopNavigation => updatePreferences({ desktopNavigation })}
        onLogout={onLogout}
      />
      <div className="cr-shell">
        <div className="cr-main">{content}</div>
      </div>
      {toast && <div className="cr-toast" role="status">{toast.message}</div>}
    </div>
  );
}
