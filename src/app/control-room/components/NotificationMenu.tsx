import { Bell, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AppNotification } from "../../../data/repositories/localAppRepository";

interface Props {
  notifications: AppNotification[];
  pathname: string;
  onOpen: (notification: AppNotification) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
}

export function NotificationMenu({ notifications, pathname, onOpen, onMarkAllRead }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const unread = notifications.filter(item => !item.read).length;

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="cr-notification-wrap" ref={rootRef}>
      <button
        ref={triggerRef}
        className="cr-icon-button"
        onClick={() => setOpen(value => !value)}
        aria-label={`Уведомления${unread ? `: ${unread} непрочитанных` : ""}`}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Bell size={16} aria-hidden="true" />
        {unread > 0 && <i className="cr-notification-dot" />}
      </button>
      {open && (
        <div className="cr-notification-panel" role="dialog" aria-label="Уведомления">
          <div className="cr-notification-head">
            <strong>Уведомления</strong>
            <div>
              <button className="cr-ghost" onClick={() => void onMarkAllRead()}>Прочитать все</button>
              <button className="cr-icon-button" onClick={() => setOpen(false)} aria-label="Закрыть уведомления"><X size={14} aria-hidden="true" /></button>
            </div>
          </div>
          {notifications.length ? notifications.map(item => (
            <button className={`cr-notification-item ${item.read ? "" : "is-unread"}`} key={item.id} onClick={() => { setOpen(false); void onOpen(item); }}>
              <i className={`cr-tone-dot ${item.tone}`} />
              <span>
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </span>
            </button>
          )) : <div className="cr-empty cr-notification-empty"><p>Уведомлений пока нет.</p></div>}
        </div>
      )}
    </div>
  );
}
