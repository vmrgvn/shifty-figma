import { LogOut, Settings } from "lucide-react";
import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent, type PointerEvent } from "react";
import { Link } from "react-router";
import { activeNavigationItem, primaryNavigation, type NavigationItemDefinition } from "./navigationModel";
import { useMobileKeyboardState } from "./useMobileKeyboardState";

interface Props {
  pathname: string;
  wishesCount: number;
  onNavigate?: () => void;
  onLogout: () => void;
}

function ShiftyMark({ pulse = false }: { pulse?: boolean }) {
  return (
    <span className={`cr-live-logo-mark ${pulse ? "is-pulsing" : ""}`} aria-hidden="true">
      {Array.from({ length: 9 }, (_, index) => <span key={index} />)}
    </span>
  );
}

function badgeValue(count: number): string {
  return count > 9 ? "9+" : String(count);
}

function itemAccessibleLabel(item: NavigationItemDefinition, count: number): string {
  if (item.id !== "wishes" || count <= 0) return item.accessibleLabel;
  return `${item.accessibleLabel}, ${count > 9 ? "больше девяти" : count} новых`;
}

interface ItemProps {
  item: NavigationItemDefinition;
  active: boolean;
  count: number;
  variant: "rail" | "dock";
  onNavigate?: () => void;
}

function NavigationItem({ item, active, count, variant, onNavigate }: ItemProps) {
  const visibleCount = item.id === "wishes" ? count : 0;
  const tooltipId = `cr-nav-tooltip-${item.id}`;
  const { Icon } = item;

  return (
    <Link
      to={item.path}
      className={`cr-live-nav-item cr-live-nav-item--${variant} ${active ? "is-active" : ""}`}
      aria-current={active ? "page" : undefined}
      aria-label={itemAccessibleLabel(item, visibleCount)}
      aria-describedby={variant === "rail" ? tooltipId : undefined}
      onClick={onNavigate}
    >
      <span className="cr-live-nav-icon" aria-hidden="true"><Icon size={21} strokeWidth={2} /></span>
      <span className="cr-live-nav-label">{item.label}</span>
      {visibleCount > 0 && <span className="cr-live-nav-badge" aria-hidden="true">{badgeValue(visibleCount)}</span>}
      {variant === "rail" && <span className="cr-live-tooltip" id={tooltipId} role="tooltip">{item.label}</span>}
    </Link>
  );
}

function DesktopLiveRail({ pathname, wishesCount, onNavigate, onLogout }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoPulse, setLogoPulse] = useState(false);
  const collapseTimer = useRef<number | null>(null);
  const railRef = useRef<HTMLElement>(null);
  const activeItem = activeNavigationItem(pathname);

  const cancelCollapse = () => {
    if (collapseTimer.current !== null) window.clearTimeout(collapseTimer.current);
    collapseTimer.current = null;
  };

  const scheduleCollapse = () => {
    cancelCollapse();
    if (profileOpen) return;
    collapseTimer.current = window.setTimeout(() => setExpanded(false), 170);
  };

  useEffect(() => () => cancelCollapse(), []);

  useEffect(() => {
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!profileOpen) return;
    const closeOnOutsidePointer = (event: globalThis.PointerEvent) => {
      if (!railRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
        setExpanded(false);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [profileOpen]);

  useEffect(() => {
    setLogoPulse(false);
    const frame = window.requestAnimationFrame(() => setLogoPulse(true));
    const timer = window.setTimeout(() => setLogoPulse(false), 520);
    return () => { window.cancelAnimationFrame(frame); window.clearTimeout(timer); };
  }, [pathname]);

  const handlePointerEnter = (event: PointerEvent<HTMLElement>) => {
    cancelCollapse();
    if (event.pointerType === "mouse" && window.matchMedia("(hover: hover) and (pointer: fine)").matches) setExpanded(true);
  };

  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) scheduleCollapse();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Escape") return;
    setProfileOpen(false);
    if (!railRef.current?.contains(document.activeElement)) setExpanded(false);
  };

  const closeAfterNavigate = () => {
    setProfileOpen(false);
    onNavigate?.();
  };

  return (
    <aside
      ref={railRef}
      className={`cr-live-rail-wrap ${expanded || profileOpen ? "is-expanded" : ""}`}
      aria-label="Панель Shifty"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={scheduleCollapse}
      onFocusCapture={() => { cancelCollapse(); setExpanded(true); }}
      onBlurCapture={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <div className="cr-live-rail-surface">
        <div className="cr-live-logo" aria-label="Shifty">
          <span className="cr-live-logo-icon"><ShiftyMark pulse={logoPulse} /></span>
          <span className="cr-live-wordmark">Shifty</span>
        </div>

        <div className="cr-live-nav-region">
          <nav className="cr-live-nav-list" aria-label="Основная навигация">
            {primaryNavigation.map(item => (
              <NavigationItem key={item.id} item={item} active={item.id === activeItem.id} count={wishesCount} variant="rail" onNavigate={closeAfterNavigate} />
            ))}
          </nav>
        </div>

        <div className="cr-live-profile-wrap">
          <button
            type="button"
            className="cr-live-profile"
            aria-label="Открыть меню профиля"
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            onClick={() => { setProfileOpen(value => !value); setExpanded(true); }}
          >
            <span className="cr-live-avatar" aria-hidden="true">МК</span>
            <span className="cr-live-profile-copy"><strong>Менеджер команды</strong><span>Общий кабинет</span></span>
          </button>
          {profileOpen && (
            <div className="cr-profile-menu" role="menu" aria-label="Меню профиля">
              <div className="cr-profile-menu-head"><strong>Менеджер команды</strong><span>Демо-аккаунт</span></div>
              <Link to="/app/settings#account" role="menuitem" onClick={closeAfterNavigate}><Settings size={17} aria-hidden="true" /><span>Настройки аккаунта</span></Link>
              <button type="button" role="menuitem" onClick={onLogout}><LogOut size={17} aria-hidden="true" /><span>Выйти</span></button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function MobileShiftyDock({ pathname, wishesCount, onNavigate }: Props) {
  const keyboardOpen = useMobileKeyboardState();
  const activeItem = activeNavigationItem(pathname);

  return (
    <div className={`cr-shifty-dock-wrap ${keyboardOpen ? "is-keyboard-hidden" : ""}`}>
      <nav className="cr-shifty-dock" aria-label="Основная навигация">
        {primaryNavigation.map(item => (
          <NavigationItem key={item.id} item={item} active={item.id === activeItem.id} count={wishesCount} variant="dock" onNavigate={onNavigate} />
        ))}
      </nav>
    </div>
  );
}

export function AdaptiveNavigation(props: Props) {
  return (
    <>
      <DesktopLiveRail {...props} />
      <MobileShiftyDock {...props} />
    </>
  );
}
