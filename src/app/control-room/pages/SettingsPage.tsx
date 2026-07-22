import { Bell, Check, Globe2, LockKeyhole, MessageSquareText, ShieldCheck, Smartphone } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { AppPreferences } from "../../../data/repositories/localAppRepository";
import type { ThemeMode } from "../../components/NavMenu";
import { TopLevelPageLayout } from "../components/PageLayout";

interface Props {
  notification: ReactNode;
  onCreate: () => void;
  theme: ThemeMode;
  preferences: AppPreferences;
  onTheme: (theme: ThemeMode) => void;
  onPreferences: (patch: Partial<AppPreferences>) => void;
  onLogout: () => void;
}

export function SettingsPage({ notification, onCreate, theme, preferences, onTheme, onPreferences, onLogout }: Props) {
  const [saved, setSaved] = useState(false);
  const showSaved = () => { setSaved(true); window.setTimeout(() => setSaved(false), 1300); };
  const savePreferences = (patch: Partial<AppPreferences>) => { onPreferences(patch); showSaved(); };
  const themes: Array<{ id: ThemeMode; label: string }> = [{ id: "dark", label: "Тёмная" }, { id: "light", label: "Светлая" }, { id: "system", label: "Как в системе" }];
  const notificationRows: Array<[keyof AppPreferences["notifications"], string, string]> = [
    ["wishes", "Новые пожелания", "Сообщать о новых просьбах сотрудников"],
    ["generation", "Расписание готово", "Показывать результат генерации"],
    ["issues", "Нерешённые ситуации", "Напоминать о конфликтах и открытых сменах"],
    ["publication", "Публикация", "Напоминать о готовом расписании"],
  ];

  return (
    <TopLevelPageLayout width="default" title="Настройки" description="Оформление, уведомления и параметры локального MVP." notification={notification} onCreateSchedule={onCreate}>
      {saved && <div className="cr-save-feedback" role="status"><Check size={13} aria-hidden="true" /> Сохранено</div>}
      <div className="cr-settings-content">
          <section id="appearance" className="cr-panel cr-setting-section">
            <h2>Оформление</h2>
            <p>Тема применяется ко всему приложению и сохраняется на этом устройстве.</p>
            <div className="cr-theme-grid">
              {themes.map(item => (
                <button className={`cr-theme-card ${theme === item.id ? "is-active" : ""}`} key={item.id} onClick={() => { onTheme(item.id); showSaved(); }}>
                  <div className={`cr-theme-preview ${item.id === "dark" ? "dark" : ""}`}><i /><i /></div>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </section>
          <section id="locale" className="cr-panel cr-setting-section">
            <h2>Язык и регион</h2>
            <p>Интерфейс кабинета сейчас доступен на русском языке.</p>
            <div className="cr-setting-row"><span><strong><Globe2 size={14} /> Язык</strong><br /><small>Другие языки появятся после выверки переводов</small></span><b>Русский</b></div>
            <div className="cr-setting-row"><span><strong>Часовой пояс</strong><br /><small>Используется в расписаниях и печати</small></span><b>Екатеринбург · UTC+5</b></div>
            <div className="cr-setting-row"><span><strong>Первый день недели</strong></span><b>Понедельник</b></div>
          </section>
          <section id="notifications" className="cr-panel cr-setting-section">
            <h2>Уведомления</h2>
            <p>Локальные настройки будущих событий приложения.</p>
            {notificationRows.map(([key, label, description]) => (
              <div className="cr-setting-row" key={key}>
                <span><strong><Bell size={13} /> {label}</strong><br /><small>{description}</small></span>
                <button className={`cr-switch ${preferences.notifications[key] ? "is-on" : ""}`} aria-label={`${label}: ${preferences.notifications[key] ? "включено" : "выключено"}`} onClick={() => savePreferences({ notifications: { ...preferences.notifications, [key]: !preferences.notifications[key] } })} />
              </div>
            ))}
          </section>
          <section id="security" className="cr-panel cr-setting-section">
            <h2>Безопасность</h2>
            <p>В MVP используется демонстрационный вход по номеру телефона и коду.</p>
            <div className="cr-setting-row"><span><strong><MessageSquareText size={14} /> SMS-код</strong><br /><small>Текущий способ подтверждения</small></span><span className="cr-status ready">Выбрано</span></div>
            <div className="cr-setting-row"><span><strong><Smartphone size={14} /> Приложение-аутентификатор</strong><br /><small>Станет доступно вместе с реальным backend auth</small></span><span className="cr-status">Недоступно в MVP</span></div>
          </section>
          <section id="account" className="cr-panel cr-setting-section">
            <h2>Аккаунт</h2>
            <p>Данные аккаунта пока демонстрационные и не отправляются на сервер.</p>
            <div className="cr-setting-row"><span><strong><ShieldCheck size={14} /> Номер телефона</strong></span><b>•••• •••• ••44</b></div>
            <div className="cr-setting-row"><span><strong><LockKeyhole size={14} /> Сеанс</strong><br /><small>Вход не сохраняется после перезагрузки страницы</small></span><button className="cr-secondary" onClick={onLogout}>Выйти</button></div>
          </section>
      </div>
    </TopLevelPageLayout>
  );
}
