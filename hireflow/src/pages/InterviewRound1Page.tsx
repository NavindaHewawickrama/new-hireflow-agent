import { ArrowRight, UsersRound } from "lucide-react";
import { usePipeline } from "../context/PipelineContext";
import { useModal } from "../context/ModalContext";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/Button";
import { InterviewCard } from "../components/InterviewCard";
import { EmptyState } from "../components/ui/EmptyState";
import { EmailPreview } from "../components/modals/EmailPreview";
import { calcAvgScore } from "../lib/utils";
import type { Candidate } from "../types";

const ELIGIBLE_STATUSES: Candidate["status"][] = ["shortlisted", "r1-advanced", "r1-rejected"];

export function InterviewRound1Page() {
  const { state, dispatch } = usePipeline();
  const { openModal } = useModal();
  const shortlisted = state.candidates.filter((c) => ELIGIBLE_STATUSES.includes(c.status));

  function handleAdvance() {
    // Compute the advanced count locally (rather than reading state right
    // after dispatch) since state updates aren't reflected synchronously —
    // this keeps the log message accurate to what ADVANCE_R1 will produce.
    const advancedCount = shortlisted.filter((c) => calcAvgScore(c.r1Scores) >= 60).length;
    dispatch({ type: "ADVANCE_R1" });
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
          <Button variant="primary" onClick={handleAdvance}>
            <ArrowRight size={14} /> Advance Top Candidates
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
