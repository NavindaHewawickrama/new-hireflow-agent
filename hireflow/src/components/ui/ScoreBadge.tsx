import { scoreClass } from "../../lib/utils";

const CLASS_MAP = {
  "score-high": "bg-success/[0.12] text-success",
  "score-mid": "bg-warn/[0.12] text-warn",
  "score-low": "bg-danger/[0.12] text-danger",
};

interface ScoreBadgeProps {
  score: number | null;
  size?: "md" | "sm";
}

/** Colored square showing a 0-100 score, or a neutral dash when unscored. */
export function ScoreBadge({ score, size = "md" }: ScoreBadgeProps) {
  const dims = size === "md" ? "h-11 w-11 text-sm" : "h-9 w-9 text-xs";

  if (score === null) {
    return (
      <div
        className={`flex ${dims} flex-shrink-0 items-center justify-center rounded-sm bg-surface3 font-mono text-[10px] text-muted2`}
      >
        —
      </div>
    );
  }

  return (
    <div
      className={`flex ${dims} flex-shrink-0 items-center justify-center rounded-sm font-mono font-medium ${CLASS_MAP[scoreClass(score)]}`}
    >
      {score}
    </div>
  );
}
