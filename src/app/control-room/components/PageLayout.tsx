import { Plus } from "lucide-react";
import type { ReactNode } from "react";

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
}

interface TopLevelPageLayoutProps {
  width?: Exclude<PageWidthMode, "wide">;
  title: string;
  description: ReactNode;
  notification: ReactNode;
  onCreateSchedule: () => void;
  children: ReactNode;
}

export function PageLayout({ width = "default", title, description, eyebrow, notification, action, children, className = "" }: Props) {
  return (
    <main className={`cr-page cr-page--${width} ${className}`.trim()} data-page-width={width}>
      <div className="cr-page-canvas">
        <header className="cr-page-header">
          <div className="cr-page-header-copy">
            {eyebrow && <div className="cr-page-header-eyebrow">{eyebrow}</div>}
            <h1>{title}</h1>
            {description && <div className="cr-page-header-description">{description}</div>}
          </div>
          <div className="cr-page-header-controls">
            <div className="cr-page-header-notification">{notification}</div>
            {action && <div className="cr-page-header-action">{action}</div>}
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}

export function TopLevelPageLayout({ width = "default", title, description, notification, onCreateSchedule, children }: TopLevelPageLayoutProps) {
  return (
    <PageLayout
      width={width}
      title={title}
      description={description}
      notification={notification}
      action={<button className="cr-primary cr-page-create-button" onClick={onCreateSchedule}><Plus size={15} aria-hidden="true" /> Создать расписание</button>}
      className="cr-page--top-level"
    >
      {children}
    </PageLayout>
  );
}
