import { useState } from "react";
import { FileText, FileCheck, Sparkles, Eye } from "lucide-react";
import { usePipeline } from "../context/PipelineContext";
import { useModal } from "../context/ModalContext";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/Button";
import { Pill } from "../components/ui/Pill";
import { EmptyState } from "../components/ui/EmptyState";
import { OfferLetterView } from "../components/modals/OfferLetterView";
import { generateOfferLetter } from "../lib/claudeApi";
import { calcAvgScore } from "../lib/utils";
import type { Candidate } from "../types";

/**
 * Page 5 — Offer Letters.
 *
 * `generatingId` tracks which single candidate's letter is currently being
 * requested from the API — local state, since it's purely a transient UI
 * flag ("show a disabled/loading state on this one row") rather than data
 * any other page needs.
 */
export function OfferLettersPage() {
  const { state, dispatch } = usePipeline();
  const { openModal } = useModal();
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const finalists = state.candidates.filter((c) => c.status === "r2-advanced");

  async function generateOne(candidate: Candidate) {
    dispatch({ type: "ADD_LOG", payload: { level: "info", message: `Generating offer for ${candidate.name}...` } });
    setGeneratingId(candidate.id);
    try {
      const letter = await generateOfferLetter({
        candidateName: candidate.name,
        jobTitle: state.job.title,
        dept: state.job.dept,
        salary: state.job.salary,
        r1Score: calcAvgScore(candidate.r1Scores),
        r2Score: calcAvgScore(candidate.r2Scores),
      });
      dispatch({ type: "SET_OFFER_LETTER", payload: { id: candidate.id, letter } });
      dispatch({ type: "ADD_LOG", payload: { level: "ok", message: `Offer letter generated for ${candidate.name}` } });
    } catch (err) {
      dispatch({
        type: "ADD_LOG",
        payload: { level: "err", message: `Failed to generate offer for ${candidate.name}: ${(err as Error).message}` },
      });
    } finally {
      setGeneratingId(null);
    }
  }

  async function generateAll() {
    const pending = finalists.filter((c) => !c.offerLetter);
    if (pending.length === 0) {
      dispatch({ type: "ADD_LOG", payload: { level: "info", message: "All offers already generated." } });
      return;
    }
    setIsBulkGenerating(true);
    for (const candidate of pending) {
      await generateOne(candidate);
    }
    setIsBulkGenerating(false);
    dispatch({ type: "MARK_STEP_DONE", payload: 5 });
  }

  function viewOffer(candidate: Candidate) {
    if (!candidate.offerLetter) return;
    openModal(<OfferLetterView candidateName={candidate.name} letter={candidate.offerLetter} />);
  }

  return (
    <div>
      <PageHeader
        stageLabel="Stage 05 / Offers"
        title="Offer Letters"
        action={
          <Button variant="primary" disabled={isBulkGenerating} onClick={generateAll}>
            <FileText size={14} /> Generate All Offers
          </Button>
        }
      />

      {finalists.length === 0 ? (
        <EmptyState icon={FileCheck} message="No finalists yet. Complete Round 2 first." />
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {finalists.map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-[1fr_auto] items-center gap-2 rounded border border-border bg-surface p-3 px-3.5 border-l-2 border-l-accent"
            >
              <div>
                <div className="mb-0.5 text-[13px] font-medium">{c.name}</div>
                <div className="text-[11px] text-muted">
                  R1: {calcAvgScore(c.r1Scores)} · R2: {calcAvgScore(c.r2Scores)}
                </div>
                <div className="mt-1.5">
                  {c.offerLetter ? (
                    <Pill tone="green">
                      <FileCheck size={10} /> Letter generated
                    </Pill>
                  ) : (
                    <Pill tone="amber">Pending generation</Pill>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                {c.offerLetter ? (
                  <Button variant="ghost" size="sm" onClick={() => viewOffer(c)}>
                    <Eye size={14} /> View
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={generatingId === c.id}
                    onClick={() => generateOne(c)}
                  >
                    <Sparkles size={14} /> Generate
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
