import { LogOut, Pin, PinOff, Settings } from "lucide-react";
import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent, type PointerEvent } from "react";
import { Link } from "react-router";
import type { DesktopNavigationPreference } from "../../../data/repositories/localAppRepository";
import { activeNavigationItem, primaryNavigation, type NavigationItemDefinition, type NavigationItemId } from "./navigationModel";
import { useDesktopNavigationMode, type DesktopNavigationPresentation } from "./useDesktopNavigationMode";
import { useMobileKeyboardState } from "./useMobileKeyboardState";

interface Props {
  pathname: string;
  wishesCount: number;
  desktopPreference: DesktopNavigationPreference;
  onDesktopPreferenceChange: (preference: DesktopNavigationPreference) => void;
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
  return count > 99 ? "99+" : String(count);
}

function itemAccessibleLabel(item: NavigationItemDefinition, count: number): string {
  if (item.id !== "wishes" || count <= 0) return item.accessibleLabel;
  return `${item.accessibleLabel}, ${count > 99 ? "больше девяноста девяти" : count} новых`;
}

interface ItemProps {
  item: NavigationItemDefinition;
  active: boolean;
  count: number;
  variant: "rail" | "dock";
  fullPanel?: boolean;
  capsuleOpen?: boolean;
  onNavigate?: () => void;
  onFocus?: () => void;
  onBlur?: (event: FocusEvent<HTMLAnchorElement>) => void;
}

function NavigationItem({ item, active, count, variant, fullPanel = false, capsuleOpen = false, onNavigate, onFocus, onBlur }: ItemProps) {
  const visibleCount = item.id === "wishes" ? count : 0;
  const { Icon } = item;

  return (
    <Link
      to={item.path}
      className={`cr-live-nav-item cr-live-nav-item--${variant} ${active ? "is-active" : ""} ${fullPanel ? "is-full-panel" : ""} ${capsuleOpen ? "is-capsule-open" : ""}`}
      aria-current={active ? "page" : undefined}
      aria-label={itemAccessibleLabel(item, visibleCount)}
      onClick={onNavigate}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <span className="cr-live-nav-icon" aria-hidden="true">
        <Icon size={21} strokeWidth={2} />
        {visibleCount > 0 && <span className="cr-live-nav-badge">{badgeValue(visibleCount)}</span>}
      </span>
      <span className="cr-live-nav-label">{item.label}</span>
    </Link>
  );
}

interface DesktopProps extends Props {
  presentation: Exclude<DesktopNavigationPresentation, "dock">;
  pinnedLayoutAllowed: boolean;
  previewOpen: boolean;
  onTogglePreview: () => void;
  onClosePreview: () => void;
}

interface NavigationPinToggleProps {
  pinned: boolean;
  pinAllowed: boolean;
  onPin: () => void;
  onUnpin: () => void;
}

function NavigationPinToggle({ pinned, pinAllowed, onPin, onUnpin }: NavigationPinToggleProps) {
  const pinDisabled = !pinned && !pinAllowed;
  const accessibleLabel = pinned
    ? "Открепить меню"
    : pinDisabled
      ? "Закрепление доступно на экранах от 1200 пикселей"
      : "Закрепить меню";
  const tooltip = pinned ? "Открепить меню" : pinDisabled ? "Доступно от 1200 px" : "Закрепить меню";

  return (
    <div className="cr-live-pin-wrap">
      <button
        type="button"
        className="cr-live-pin-button"
        aria-label={accessibleLabel}
        aria-pressed={pinned}
        aria-disabled={pinDisabled}
        onClick={() => {
          if (pinned) onUnpin();
          else if (pinAllowed) onPin();
        }}
      >
        {pinned ? <PinOff size={17} aria-hidden="true" /> : <Pin size={17} aria-hidden="true" />}
      </button>
      <span className="cr-pin-tooltip" role="tooltip">{tooltip}</span>
    </div>
  );
}

function DesktopLiveRail({
  pathname,
  wishesCount,
  presentation,
  pinnedLayoutAllowed,
  previewOpen,
  onTogglePreview,
  onClosePreview,
  onDesktopPreferenceChange,
  onNavigate,
  onLogout,
}: DesktopProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoPulse, setLogoPulse] = useState(false);
  const [capsuleId, setCapsuleId] = useState<NavigationItemId | null>(null);
  const capsuleOpenTimer = useRef<number | null>(null);
  const capsuleCloseTimer = useRef<number | null>(null);
  const railRef = useRef<HTMLElement>(null);
  const brandRef = useRef<HTMLButtonElement>(null);
  const activeItem = activeNavigationItem(pathname);
  const fullPanel = presentation === "preview" || presentation === "pinned";

  const clearCapsuleTimers = () => {
    if (capsuleOpenTimer.current !== null) window.clearTimeout(capsuleOpenTimer.current);
    if (capsuleCloseTimer.current !== null) window.clearTimeout(capsuleCloseTimer.current);
    capsuleOpenTimer.current = null;
    capsuleCloseTimer.current = null;
  };

  const openCapsuleWithIntent = (id: NavigationItemId, event: PointerEvent<HTMLDivElement>) => {
    if (fullPanel || event.pointerType !== "mouse" || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    clearCapsuleTimers();
    capsuleOpenTimer.current = window.setTimeout(() => setCapsuleId(id), 80);
  };

  const closeCapsuleWithIntent = () => {
    if (fullPanel) return;
    clearCapsuleTimers();
    capsuleCloseTimer.current = window.setTimeout(() => setCapsuleId(null), 150);
  };

  useEffect(() => () => clearCapsuleTimers(), []);
  useEffect(() => { setProfileOpen(false); setCapsuleId(null); }, [pathname]);
  useEffect(() => { if (fullPanel) setCapsuleId(null); }, [fullPanel]);

  useEffect(() => {
    if (!previewOpen && !profileOpen) return;
    const closeOnOutsidePointer = (event: globalThis.PointerEvent) => {
      if (railRef.current?.contains(event.target as Node)) return;
      setProfileOpen(false);
      if (previewOpen) onClosePreview();
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [onClosePreview, previewOpen, profileOpen]);

  useEffect(() => {
    setLogoPulse(false);
    const frame = window.requestAnimationFrame(() => setLogoPulse(true));
    const timer = window.setTimeout(() => setLogoPulse(false), 520);
    return () => { window.cancelAnimationFrame(frame); window.clearTimeout(timer); };
  }, [pathname]);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Escape") return;
    if (profileOpen) {
      setProfileOpen(false);
      return;
    }
    if (previewOpen) {
      onClosePreview();
      window.requestAnimationFrame(() => brandRef.current?.focus());
    }
  };

  const closeAfterNavigate = () => {
    clearCapsuleTimers();
    setCapsuleId(null);
    setProfileOpen(false);
    if (previewOpen) onClosePreview();
    onNavigate?.();
  };

  const pinMenu = () => {
    onDesktopPreferenceChange("pinned");
    onClosePreview();
  };

  const unpinMenu = () => {
    onDesktopPreferenceChange("compact");
    window.requestAnimationFrame(() => brandRef.current?.focus());
  };

  return (
    <aside
      ref={railRef}
      className={`cr-live-rail-wrap is-${presentation} ${fullPanel ? "is-full" : ""}`}
      aria-label="Панель Shifty"
      data-navigation-presentation={presentation}
      onKeyDown={handleKeyDown}
    >
      <div className="cr-live-rail-surface">
        {presentation === "pinned" ? (
          <div className="cr-live-brand" aria-label="Shifty">
            <span className="cr-live-logo-icon"><ShiftyMark pulse={logoPulse} /></span>
            <span className="cr-live-wordmark">Shifty</span>
          </div>
        ) : (
          <button
            ref={brandRef}
            type="button"
            className="cr-live-brand cr-live-brand-trigger"
            aria-label={previewOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={previewOpen}
            onClick={onTogglePreview}
          >
            <span className="cr-live-logo-icon"><ShiftyMark pulse={logoPulse} /></span>
            <span className="cr-live-wordmark">Shifty</span>
          </button>
        )}

        {fullPanel && (
          <NavigationPinToggle
            pinned={presentation === "pinned"}
            pinAllowed={pinnedLayoutAllowed}
            onPin={pinMenu}
            onUnpin={unpinMenu}
          />
        )}

        <div className="cr-live-nav-region">
          <nav className="cr-live-nav-list" aria-label="Основная навигация">
            {primaryNavigation.map(item => (
              <div
                className="cr-live-nav-slot"
                key={item.id}
                onPointerEnter={event => openCapsuleWithIntent(item.id, event)}
                onPointerLeave={closeCapsuleWithIntent}
              >
                <NavigationItem
                  item={item}
                  active={item.id === activeItem.id}
                  count={wishesCount}
                  variant="rail"
                  fullPanel={fullPanel}
                  capsuleOpen={capsuleId === item.id}
                  onNavigate={closeAfterNavigate}
                  onFocus={() => { clearCapsuleTimers(); if (!fullPanel) setCapsuleId(item.id); }}
                  onBlur={event => { if (!event.currentTarget.parentElement?.contains(event.relatedTarget)) setCapsuleId(null); }}
                />
              </div>
            ))}
          </nav>
        </div>

        <div className="cr-live-footer">
          <div className="cr-live-profile-wrap">
            <button
              type="button"
              className="cr-live-profile"
              aria-label="Открыть меню профиля"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              onClick={() => setProfileOpen(value => !value)}
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
  const mode = useDesktopNavigationMode(props.desktopPreference, props.pathname);

  if (mode.presentation === "dock") return <MobileShiftyDock {...props} />;

  return (
    <DesktopLiveRail
      {...props}
      presentation={mode.presentation}
      pinnedLayoutAllowed={mode.pinnedLayoutAllowed}
      previewOpen={mode.previewOpen}
      onTogglePreview={mode.togglePreview}
      onClosePreview={mode.closePreview}
    />
  );
}
