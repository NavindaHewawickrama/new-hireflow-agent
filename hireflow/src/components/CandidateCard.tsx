import type { Candidate } from "../types";
import { ScoreBadge } from "./ui/ScoreBadge";
import { Pill } from "./ui/Pill";

const BORDER_BY_STATUS: Partial<Record<Candidate["status"], string>> = {
  shortlisted: "border-l-2 border-l-success",
  rejected: "border-l-2 border-l-muted2 opacity-60",
};

/** Single row in the "Uploaded / Screened" candidate list on page 2. */
export function CandidateCard({ candidate }: { candidate: Candidate }) {
  const scored = candidate.score !== null;
  const borderClass = BORDER_BY_STATUS[candidate.status] ?? "";

  return (
    <div
      className={`grid grid-cols-[1fr_auto] items-center gap-2 rounded border border-border bg-surface p-3 px-3.5 transition-colors hover:border-border2 ${borderClass}`}
    >
      <div>
        <div className="mb-0.5 text-[13px] font-medium">{candidate.name}</div>
        <div className="text-[11px] text-muted">{candidate.filename}</div>
        {scored && (
          <div className="mt-2 flex items-center gap-1">
            {candidate.status === "shortlisted" && <Pill tone="green">Shortlisted</Pill>}
            {candidate.status === "rejected" && <Pill tone="red">Not selected</Pill>}
            {candidate.reason && (
              <span className="ml-1 text-[10px] text-muted">
                {candidate.reason.substring(0, 80)}
                {candidate.reason.length > 80 ? "…" : ""}
              </span>
            )}
          </div>
        )}
      </div>
      <ScoreBadge score={candidate.score} />
    </div>
  );
}
