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
          <div className="cr-page-header-notification">{notification}</div>
          {action && <div className="cr-page-header-action">{action}</div>}
        </header>
        {children}
      </div>
    </main>
  );
}
