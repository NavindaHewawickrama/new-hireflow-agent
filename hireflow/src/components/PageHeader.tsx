import type { ReactNode } from "react";

interface PageHeaderProps {
  stageLabel: string;
  title: string;
  action?: ReactNode;
}

/** The "Stage 0X / ..." eyebrow + big title + right-aligned action button,
 * repeated at the top of every page. */
export function PageHeader({ stageLabel, title, action }: PageHeaderProps) {
  return (
    <div className="mb-5 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-muted">
          {stageLabel}
        </div>
        <div className="text-lg font-medium tracking-tight text-text">{title}</div>
      </div>
      {action}
    </div>
  );
}
