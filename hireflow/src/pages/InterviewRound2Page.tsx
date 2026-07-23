import { useState } from "react";
import { Trophy, Award } from "lucide-react";
import { usePipeline } from "../context/PipelineContext";
import { useModal } from "../context/ModalContext";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/Button";
import { InterviewCard } from "../components/InterviewCard";
import { EmptyState } from "../components/ui/EmptyState";
import { EmailPreview } from "../components/modals/EmailPreview";
import { submitR2Score } from "../lib/candidateApi";
import { SCORE_DIMENSIONS } from "../lib/utils";
import type { Candidate } from "../types";

const ELIGIBLE_STATUSES: Candidate["status"][] = ["r1-advanced", "r2-advanced", "r2-rejected"];

export function InterviewRound2Page() {
  const { state, dispatch } = usePipeline();
  const { openModal } = useModal();
  const [isFinalizing, setIsFinalizing] = useState(false);
  const r1Passed = state.candidates.filter((c) => ELIGIBLE_STATUSES.includes(c.status));

  async function handleFinalize() {
    setIsFinalizing(true);
    let finalistCount = 0;

    for (const candidate of r1Passed) {
      if (!candidate.backendId) {
        dispatch({
          type: "ADD_LOG",
          payload: { level: "err", message: `${candidate.name}: not linked to a saved candidate record, skipped.` },
        });
        continue;
      }

      try {
        const normalizedScores = Object.fromEntries(
          SCORE_DIMENSIONS.map(({ key }) => [key, candidate.r2Scores[key] ?? 50])
        );
        const result = await submitR2Score(candidate.backendId, normalizedScores);
        dispatch({ type: "SET_INTERVIEW_STATUS", payload: { id: candidate.id, status: result.status } });
        if (result.status === "r2-advanced") finalistCount++;
      } catch (err) {
        dispatch({
          type: "ADD_LOG",
          payload: { level: "err", message: `Failed to submit R2 score for ${candidate.name}: ${(err as Error).message}` },
        });
      }
    }

    setIsFinalizing(false);
    dispatch({ type: "MARK_STEP_DONE", payload: 4 });
    dispatch({
      type: "ADD_LOG",
      payload: { level: "ok", message: `R2 complete. ${finalistCount} finalists.` },
    });
    dispatch({ type: "GO_TO", payload: 5 });
  }

  function handleEmailClick(candidate: Candidate) {
    openModal(<EmailPreview candidateName={candidate.name} jobTitle={state.job.title} round="r2" />);
  }

  return (
    <div>
      <PageHeader
        stageLabel="Stage 04 / Final Round"
        title="Interview Round 2"
        action={
          <Button variant="primary" onClick={handleFinalize} disabled={isFinalizing || r1Passed.length === 0}>
            <Trophy size={14} /> {isFinalizing ? "Submitting..." : "Finalize Offers"}
          </Button>
        }
      />

      {r1Passed.length === 0 ? (
        <EmptyState icon={Award} message="No candidates from Round 1 yet." />
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {r1Passed.map((c) => (
            <InterviewCard key={c.id} candidate={c} round="r2" onEmailClick={() => handleEmailClick(c)} />
          ))}
        </div>
      )}
    </div>
  );
}
