import { Mail } from "lucide-react";
import type { Candidate } from "../types";
import { usePipeline } from "../context/PipelineContext";
import { calcAvgScore, SCORE_DIMENSIONS } from "../lib/utils";
import { ScoreBadge } from "./ui/ScoreBadge";
import { Button } from "./ui/Button";

interface InterviewCardProps {
  candidate: Candidate;
  round: "r1" | "r2";
  onEmailClick: (candidate: Candidate, round: "r1" | "r2") => void;
}

/**
 * Card used on both Interview Round 1 and Round 2 pages: shows the
 * candidate's average live score plus 4 adjustable sliders (one per
 * dimension). The `round` prop is what makes this one component work for
 * both pages instead of duplicating near-identical markup twice.
 */
export function InterviewCard({ candidate, round, onEmailClick }: InterviewCardProps) {
  const { dispatch } = usePipeline();
  const scores = round === "r1" ? candidate.r1Scores : candidate.r2Scores;
  const avg = calcAvgScore(scores);

  const advanced =
    round === "r1" ? candidate.status === "r1-advanced" : candidate.status === "r2-advanced";
  const rejected =
    round === "r1" ? candidate.status === "r1-rejected" : candidate.status === "r2-rejected";

  const borderClass = advanced
    ? "border-l-2 border-l-accent"
    : rejected
      ? "border-l-2 border-l-muted2 opacity-60"
      : "";

  return (
    <div className={`rounded border border-border bg-surface p-3 px-3.5 ${borderClass}`}>
      <div className="mb-2.5 flex items-center justify-between">
        <div>
          <div className="mb-0.5 text-[13px] font-medium">{candidate.name}</div>
          <div className="text-[11px] text-muted">
            CV Score: {candidate.score} &nbsp;·&nbsp; {candidate.filename}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ScoreBadge score={avg} size="sm" />
          <Button variant="ghost" size="sm" onClick={() => onEmailClick(candidate, round)}>
            <Mail size={14} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {SCORE_DIMENSIONS.map(({ key, label }) => {
          const value = scores[key] ?? 50;
          return (
            <div key={key} className="rounded bg-surface2 px-3 py-2.5">
              <div className="mb-1.5 flex justify-between font-mono text-[10px] uppercase tracking-wider text-muted">
                {label}
                <span className="font-sans text-xs text-text">{value}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={value}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_INTERVIEW_SCORE",
                    payload: { id: candidate.id, round, dim: key, value: Number(e.target.value) },
                  })
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
