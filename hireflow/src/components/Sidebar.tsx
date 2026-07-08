import { Download, Trash2 } from "lucide-react";
import { usePipeline } from "../context/PipelineContext";
import { Button } from "./ui/Button";

const NAV_ITEMS = [
  { page: 1, label: "Job Setup" },
  { page: 2, label: "CV Screening" },
  { page: 3, label: "Interview R1" },
  { page: 4, label: "Interview R2" },
  { page: 5, label: "Offer Letters" },
];

/**
 * Left navigation rail: brand, 5 stage links (with active/done indicators),
 * and a pinned stats + actions footer. All data comes straight out of
 * pipeline context — this component has no local state of its own.
 */
export function Sidebar() {
  const { state, dispatch } = usePipeline();
  const { candidates, currentPage, completedSteps } = state;

  const stats = {
    uploaded: candidates.length,
    screened: candidates.filter((c) => c.score !== null).length,
    shortlisted: candidates.filter((c) =>
      ["shortlisted", "r1-advanced", "r1-rejected", "r2-advanced", "r2-rejected"].includes(
        c.status
      )
    ).length,
    r1: candidates.filter((c) => ["r1-advanced", "r2-advanced", "r2-rejected"].includes(c.status))
      .length,
    r2: candidates.filter((c) => c.status === "r2-advanced").length,
  };

  function downloadJSON() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "hireflow-state.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function resetAll() {
    if (!confirm("Reset all data? This cannot be undone.")) return;
    dispatch({ type: "RESET" });
  }

  return (
    <nav className="flex h-full flex-col border-r border-border bg-surface md:sticky md:top-0 md:h-screen">
      <div className="border-b border-border p-4 font-mono text-[11px] uppercase tracking-[0.12em] text-accent">
        HireFlow
        <span className="mt-0.5 block font-sans text-[9px] normal-case tracking-normal text-muted2">
          AI Recruitment Pipeline
        </span>
      </div>

      {NAV_ITEMS.map((item) => {
        const isActive = currentPage === item.page;
        const isDone = completedSteps.has(item.page);
        return (
          <div
            key={item.page}
            onClick={() => dispatch({ type: "GO_TO", payload: item.page })}
            className={`relative flex cursor-pointer items-center gap-2.5 border-b border-border px-4 py-2.5 text-xs transition-colors ${
              isActive ? "bg-surface2 text-text" : "text-muted hover:bg-surface2 hover:text-text"
            }`}
          >
            {isActive && <span className="absolute inset-y-0 left-0 w-0.5 bg-accent" />}
            <div
              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-sm font-mono text-[10px] ${
                isActive
                  ? "bg-accent text-black"
                  : isDone
                    ? "bg-success text-black"
                    : "bg-surface3 text-muted2"
              }`}
            >
              {item.page}
            </div>
            {item.label}
          </div>
        );
      })}

      <div className="mt-auto border-t border-border p-4">
        <StatRow label="Uploaded" value={stats.uploaded} />
        <StatRow label="Screened" value={stats.screened} />
        <StatRow label="Shortlisted" value={stats.shortlisted} />
        <StatRow label="R1 Advanced" value={stats.r1} />
        <StatRow label="R2 Advanced" value={stats.r2} />

        <div className="mt-2.5 flex flex-col gap-1.5">
          <Button variant="ghost" size="sm" className="w-full justify-center" onClick={downloadJSON}>
            <Download size={14} /> Export JSON
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center border-muted2 text-danger"
            onClick={resetAll}
          >
            <Trash2 size={14} /> Reset
          </Button>
        </div>
      </div>
    </nav>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-1 flex justify-between text-[11px]">
      <span className="text-muted">{label}</span>
      <span className="font-mono text-accent">{value}</span>
    </div>
  );
}
