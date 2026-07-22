import { Plus } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import type { LanguageCode } from "../../components/NavMenu";
import { controlRoomLocale, topLevelPageCopy, type TopLevelPageId } from "../localization";

export type PageWidthMode = "narrow" | "default" | "list" | "wide";

interface Props {
  width?: PageWidthMode;
  title: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
  notification: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  collapsibleHeader?: boolean;
}

interface TopLevelPageLayoutProps {
  width?: Exclude<PageWidthMode, "wide">;
  page: TopLevelPageId;
  language: LanguageCode;
  notification: ReactNode;
  onCreateSchedule: () => void;
  children: ReactNode;
}

export function PageLayout({ width = "default", title, description, eyebrow, notification, action, children, className = "", collapsibleHeader = false }: Props) {
  const [headerCompact, setHeaderCompact] = useState(false);

  useEffect(() => {
    if (!collapsibleHeader) {
      setHeaderCompact(false);
      return;
    }
    const updateHeader = () => setHeaderCompact(window.scrollY > 48);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, [collapsibleHeader]);

  return (
    <main className={`cr-page cr-page--${width} ${className}`.trim()} data-page-width={width}>
      <div className="cr-page-canvas">
        <div className={`cr-page-header-sticky ${headerCompact ? "is-compact" : ""}`.trim()}>
          <header className="cr-page-header">
            <div className="cr-page-header-title">
              {eyebrow && <div className="cr-page-header-eyebrow">{eyebrow}</div>}
              <h1>{title}</h1>
            </div>
            {description && <div className="cr-page-header-description">{description}</div>}
            <div className="cr-page-header-notification">{notification}</div>
            {action && <div className="cr-page-header-action">{action}</div>}
          </header>
        </div>
        {children}
      </div>
    </main>
  );
}

export function TopLevelPageLayout({ width = "default", page, language, notification, onCreateSchedule, children }: TopLevelPageLayoutProps) {
  const locale = controlRoomLocale(language);
  const copy = topLevelPageCopy[locale];
  const pageCopy = copy.pages[page];
  return (
    <PageLayout
      width={width}
      title={pageCopy.title}
      description={pageCopy.description}
      notification={notification}
      action={<button className="cr-primary cr-page-create-button" onClick={onCreateSchedule}><Plus size={15} aria-hidden="true" /> {copy.createSchedule}</button>}
      className="cr-page--top-level"
      collapsibleHeader
    >
      {children}
    </PageLayout>
  );
}
