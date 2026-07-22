import { Bell, CalendarDays, Gauge, LogOut, Settings, SlidersHorizontal, UsersRound, X } from "lucide-react";
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

interface Props {
  dark: boolean;
  language: LanguageCode;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onLanguageChange: (language: LanguageCode) => void;
  onLogout: () => void;
}

type ToastState = { id: number; message: string } | null;

function Logo() {
  return <div className="cr-logo"><span className="cr-logo-mark" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <span key={i} />)}</span><span>Shifty</span></div>;
}

export function ControlRoom({ dark, language, theme, onThemeChange, onLogout }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<GeneratedSchedule[]>([]);
  const [wishes, setWishes] = useState<EmployeeWish[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [preferences, setPreferences] = useState<AppPreferences>(() => preferencesRepository.get());
  const [loading, setLoading] = useState(true);
  const [notificationOpen, setNotificationOpen] = useState(false);
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
  const section = path === "/app" ? "overview" : path.startsWith("/app/schedules") ? "schedules" : path.startsWith("/app/wishes") ? "wishes" : path.startsWith("/app/settings") ? "settings" : "overview";
  const unread = notifications.filter(item => !item.read).length;
  const workspaceMatch = path.match(/^\/app\/schedules\/([^/]+)$/);
  const printMatch = path.match(/^\/print\/([^/]+)$/);
  const selectedSchedule = schedules.find(item => item.id === (workspaceMatch?.[1] ?? printMatch?.[1]));
  const creating = path === "/app/schedules/new";

  const navItems = [
    { id: "overview", path: "/app", label: "Обзор", Icon: Gauge },
    { id: "schedules", path: "/app/schedules", label: "Расписания", Icon: CalendarDays },
    { id: "wishes", path: "/app/wishes", label: "Пожелания", Icon: UsersRound, count: wishes.filter(item => item.status === "new" || item.status === "needs_review").length },
    { id: "settings", path: "/app/settings", label: "Настройки", Icon: Settings },
  ];

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
  const openNotification = async (notification: AppNotification) => { await notificationRepository.markRead(notification.id); setNotificationOpen(false); await reload(); navigate(notification.target); };
  const markAllRead = async () => { await notificationRepository.markRead(); await reload(); };

  if (loading) return <div className="cr-root cr-empty"><div><div className="cr-block-illustration" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index} />)}</div><h2>Готовим рабочее пространство</h2><p>Загружаем расписания и пожелания.</p></div></div>;
  if (printMatch) return selectedSchedule ? <PrintSchedulePage schedule={selectedSchedule} onBack={() => navigate(`/app/schedules/${selectedSchedule.id}`)} /> : <div className="cr-root cr-empty"><div><h2>Расписание не найдено</h2><button className="cr-primary" onClick={() => navigate("/app/schedules")}>К расписаниям</button></div></div>;
  if (creating) return <Wizard dark={dark} language={language} theme={theme} onThemeChange={onThemeChange} onLanguageChange={() => {}} onBack={() => navigate("/app/schedules")} onSignUp={saveWizard} signUpLabel="Сохранить и открыть" />;

  const pageTitle = section === "overview" ? "Обзор" : section === "schedules" ? selectedSchedule?.name ?? "Расписания" : section === "wishes" ? "Пожелания" : "Настройки";
  const content = selectedSchedule && workspaceMatch ? <ScheduleWorkspacePage schedule={selectedSchedule} openIssuesInitially={new URLSearchParams(location.search).has("issues")} onBack={() => navigate("/app/schedules")} onEdit={() => void editSchedule(selectedSchedule.id)} onPrint={() => navigate(`/print/${selectedSchedule.id}`)} onPublish={() => void publish(selectedSchedule.id)} />
    : section === "overview" ? <OverviewPage schedules={schedules} wishes={wishes} onCreate={createSchedule} onOpenSchedule={(id, issues) => navigate(`/app/schedules/${id}${issues ? "?issues=1" : ""}`)} onOpenWishes={() => navigate("/app/wishes")} />
    : section === "schedules" ? <SchedulesPage schedules={schedules} onCreate={createSchedule} onOpen={id => navigate(`/app/schedules/${id}`)} onEdit={id => void editSchedule(id)} onPrint={id => navigate(`/print/${id}`)} onDuplicate={schedule => void duplicateSchedule(schedule)} onArchive={schedule => void archiveSchedule(schedule)} onRemove={schedule => void removeSchedule(schedule)} />
    : section === "wishes" ? <WishesPage wishes={wishes} onSave={wish => void saveWish(wish)} onOpenSchedule={id => navigate(`/app/schedules/${id}`)} />
    : <SettingsPage theme={theme} preferences={preferences} onTheme={onThemeChange} onPreferences={updatePreferences} onLogout={onLogout} />;

  return <div className="cr-root"><div className="cr-shell"><aside className="cr-sidebar"><Logo /><div className="cr-capability"><SlidersHorizontal size={13} /> Управление расписаниями</div><nav className="cr-nav" aria-label="Основная навигация">{navItems.map(item => <button key={item.id} className={`cr-nav-button ${section === item.id ? "is-active" : ""}`} onClick={() => navigate(item.path)} title={item.label}><item.Icon size={17} /><span>{item.label}</span>{!!item.count && <span className="cr-count">{item.count}</span>}</button>)}</nav><div className="cr-account"><div className="cr-account-row"><div className="cr-avatar">МК</div><div className="cr-account-copy"><strong>Менеджер команды</strong><span>Общий кабинет</span></div><button className="cr-icon-button" onClick={onLogout} title="Выйти" aria-label="Выйти"><LogOut size={15} /></button></div></div></aside><div className="cr-main"><header className="cr-topbar"><div className="cr-topbar-title"><strong>{pageTitle}</strong><span>Shifty Control Room</span></div><div className="cr-notification-wrap"><button className="cr-icon-button" onClick={() => setNotificationOpen(value => !value)} aria-label={`Уведомления${unread ? `: ${unread} непрочитанных` : ""}`}><Bell size={16} />{unread > 0 && <i className="cr-notification-dot" />}</button>{notificationOpen && <div className="cr-notification-panel"><div className="cr-notification-head"><strong>Уведомления</strong><div><button className="cr-ghost" onClick={() => void markAllRead()}>Прочитать все</button><button className="cr-icon-button" onClick={() => setNotificationOpen(false)} aria-label="Закрыть уведомления"><X size={14} /></button></div></div>{notifications.length ? notifications.map(item => <button className={`cr-notification-item ${item.read ? "" : "is-unread"}`} key={item.id} onClick={() => void openNotification(item)}><i className={`cr-tone-dot ${item.tone}`} /><span><strong style={{ display: "block", fontSize: 12 }}>{item.title}</strong><span style={{ color: "var(--cr-muted)", display: "block", fontSize: 11, marginTop: 3 }}>{item.description}</span></span></button>) : <div className="cr-empty" style={{ minHeight: 180 }}><p>Уведомлений пока нет.</p></div>}</div>}</div></header>{content}</div></div><nav className="cr-mobile-nav" aria-label="Мобильная навигация">{navItems.map(item => <button key={item.id} className={section === item.id ? "is-active" : ""} onClick={() => navigate(item.path)}><item.Icon size={18} /><span>{item.label}</span></button>)}</nav>{toast && <div role="status" style={{ position: "fixed", right: 18, bottom: 84, zIndex: 130, padding: "11px 14px", borderRadius: 10, background: "var(--cr-text)", color: "var(--cr-canvas)", boxShadow: "var(--cr-shadow)", fontSize: 12 }}>{toast.message}</div>}</div>;
}
