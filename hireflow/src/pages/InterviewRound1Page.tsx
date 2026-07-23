import { useState } from "react";
import { ArrowRight, UsersRound } from "lucide-react";
import { usePipeline } from "../context/PipelineContext";
import { useModal } from "../context/ModalContext";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/Button";
import { InterviewCard } from "../components/InterviewCard";
import { EmptyState } from "../components/ui/EmptyState";
import { EmailPreview } from "../components/modals/EmailPreview";
import { submitR1Score } from "../lib/candidateApi";
import { SCORE_DIMENSIONS } from "../lib/utils";
import type { Candidate } from "../types";

const ELIGIBLE_STATUSES: Candidate["status"][] = ["shortlisted", "r1-advanced", "r1-rejected"];

export function InterviewRound1Page() {
  const { state, dispatch } = usePipeline();
  const { openModal } = useModal();
  const [isAdvancing, setIsAdvancing] = useState(false);
  const shortlisted = state.candidates.filter((c) => ELIGIBLE_STATUSES.includes(c.status));

  async function handleAdvance() {
    setIsAdvancing(true);
    let advancedCount = 0;

    for (const candidate of shortlisted) {
      if (!candidate.backendId) {
        dispatch({
          type: "ADD_LOG",
          payload: { level: "err", message: `${candidate.name}: not linked to a saved candidate record, skipped.` },
        });
        continue;
      }

      try {
        // Untouched sliders visually show 50 (InterviewCard's display default)
        // but aren't recorded in r1Scores until dragged - fill them in so what
        // gets submitted always matches what's on screen.
        const normalizedScores = Object.fromEntries(
          SCORE_DIMENSIONS.map(({ key }) => [key, candidate.r1Scores[key] ?? 50])
        );
        const result = await submitR1Score(candidate.backendId, normalizedScores);
        dispatch({ type: "SET_INTERVIEW_STATUS", payload: { id: candidate.id, status: result.status } });
        if (result.status === "r1-advanced") advancedCount++;
      } catch (err) {
        dispatch({
          type: "ADD_LOG",
          payload: { level: "err", message: `Failed to submit R1 score for ${candidate.name}: ${(err as Error).message}` },
        });
      }
    }

    setIsAdvancing(false);
    dispatch({ type: "MARK_STEP_DONE", payload: 3 });
    dispatch({
      type: "ADD_LOG",
      payload: { level: "ok", message: `R1 complete. ${advancedCount} advanced to R2.` },
    });
    dispatch({ type: "GO_TO", payload: 4 });
  }

  function handleEmailClick(candidate: Candidate) {
    openModal(<EmailPreview candidateName={candidate.name} jobTitle={state.job.title} round="r1" />);
  }

  return (
    <div>
      <PageHeader
        stageLabel="Stage 03 / First Round"
        title="Interview Round 1"
        action={
          <Button variant="primary" onClick={handleAdvance} disabled={isAdvancing || shortlisted.length === 0}>
            <ArrowRight size={14} /> {isAdvancing ? "Submitting..." : "Advance Top Candidates"}
          </Button>
        }
      />

      {shortlisted.length === 0 ? (
        <EmptyState icon={UsersRound} message="No shortlisted candidates yet. Complete CV screening first." />
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {shortlisted.map((c) => (
            <InterviewCard key={c.id} candidate={c} round="r1" onEmailClick={() => handleEmailClick(c)} />
          ))}
        </div>
      )}
    </div>
  );
}
