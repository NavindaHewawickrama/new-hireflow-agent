import { Trophy, Award } from "lucide-react";
import { usePipeline } from "../context/PipelineContext";
import { useModal } from "../context/ModalContext";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/Button";
import { InterviewCard } from "../components/InterviewCard";
import { EmptyState } from "../components/ui/EmptyState";
import { EmailPreview } from "../components/modals/EmailPreview";
import { calcAvgScore } from "../lib/utils";
import type { Candidate } from "../types";

const ELIGIBLE_STATUSES: Candidate["status"][] = ["r1-advanced", "r2-advanced", "r2-rejected"];

export function InterviewRound2Page() {
  const { state, dispatch } = usePipeline();
  const { openModal } = useModal();
  const r1Passed = state.candidates.filter((c) => ELIGIBLE_STATUSES.includes(c.status));

  function handleFinalize() {
    const finalistCount = r1Passed.filter((c) => calcAvgScore(c.r2Scores) >= 60).length;
    dispatch({ type: "FINALIZE_R2" });
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
          <Button variant="primary" onClick={handleFinalize}>
            <Trophy size={14} /> Finalize Offers
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
