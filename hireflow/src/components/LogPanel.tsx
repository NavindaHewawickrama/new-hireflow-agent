import { useEffect, useRef } from "react";
import type { LogEntry } from "../types";

const LEVEL_CLASSES: Record<LogEntry["level"], string> = {
  ok: "text-success",
  err: "text-danger",
  info: "text-info",
};

/** Auto-scrolling log feed, ported from #cv-log / addLog(). */
export function LogPanel({ entries }: { entries: LogEntry[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep the panel pinned to the latest entry, same as the original's
  // `logEl.scrollTop = logEl.scrollHeight` after every addLog() call.
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="mt-3 max-h-[100px] overflow-y-auto scrollbar-thin rounded border border-border bg-surface2 px-3 py-2.5 font-mono text-[10px] leading-relaxed text-muted"
    >
      {entries.map((entry) => (
        <div key={entry.id} className={`mb-0.5 ${LEVEL_CLASSES[entry.level]}`}>
          [{entry.timestamp}] {entry.message}
        </div>
      ))}
    </div>
  );
}
