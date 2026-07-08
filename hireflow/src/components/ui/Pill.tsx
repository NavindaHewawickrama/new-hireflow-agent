import type { ReactNode } from "react";

type PillTone = "green" | "red" | "amber" | "blue" | "gray" | "accent";

const TONE_CLASSES: Record<PillTone, string> = {
  green: "bg-success/10 text-success",
  red: "bg-danger/10 text-danger",
  amber: "bg-warn/10 text-warn",
  blue: "bg-info/10 text-info",
  gray: "bg-surface3 text-muted",
  accent: "bg-accent/10 text-accent",
};

/** Small uppercase mono-font status badge, e.g. "Shortlisted" / "Rejected". */
export function Pill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm px-[7px] py-[2px] font-mono text-[9px] uppercase tracking-wider ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}
