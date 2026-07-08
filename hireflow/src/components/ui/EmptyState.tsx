import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
}

/** Centered placeholder shown when a candidate list has nothing to display yet. */
export function EmptyState({ icon: Icon, message }: EmptyStateProps) {
  return (
    <div className="px-5 py-10 text-center text-xs text-muted">
      <Icon size={32} className="mx-auto mb-2 text-muted2" />
      {message}
    </div>
  );
}
