import { useRef, useState, type DragEvent } from "react";
import { Cpu, FileUp } from "lucide-react";
import { usePipeline } from "../context/PipelineContext";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/Button";
import { CandidateCard } from "../components/CandidateCard";
import { LogPanel } from "../components/LogPanel";
import { screenCandidateCV } from "../lib/claudeApi";
import { generateId, guessName } from "../lib/utils";
import type { Candidate } from "../types";

/**
 * Page 2 — CV Upload & Screening.
 *
 * `isScreening` / `screeningStatus` / `screeningProgress` are local state
 * because they describe an in-flight *process on this page only* — no
 * other page needs to know "screening candidate 3 of 7 right now". Once
 * screening finishes, the *results* (candidate.score, status, etc.) are
 * dispatched into global state because Round 1 and the sidebar stats do
 * need to see them.
 */
export function CvScreeningPage() {
  const { state, dispatch } = usePipeline();
  const { candidates, job } = state;

  const [isDragOver, setIsDragOver] = useState(false);
  const [isScreening, setIsScreening] = useState(false);
  const [screeningStatus, setScreeningStatus] = useState("");
  const [screeningProgress, setScreeningProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadedOrScreened = candidates.filter((c) => c.status === "uploaded" || c.score !== null);
  const canScreen = uploadedOrScreened.length > 0 && !isScreening;

  function addLog(level: "ok" | "err" | "info", message: string) {
    dispatch({ type: "ADD_LOG", payload: { level, message } });
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = String(e.target?.result ?? "");
        const alreadyExists = candidates.some((c) => c.filename === file.name);
        if (alreadyExists) {
          addLog("err", `Duplicate: ${file.name}`);
          return;
        }
        const candidate: Candidate = {
          id: generateId(),
          filename: file.name,
          name: guessName(file.name, content),
          cv: content,
          score: null,
          reason: "",
          strengths: [],
          gaps: [],
          status: "uploaded",
          r1Scores: {},
          r2Scores: {},
          offerLetter: "",
        };
        dispatch({ type: "ADD_CANDIDATE", payload: candidate });
        addLog("ok", `Loaded: ${file.name}`);
      };
      reader.readAsText(file);
    });
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  async function screenAllCVs() {
    if (!job.title) {
      alert("Please complete Job Setup first.");
      return;
    }
    const unscreened = candidates.filter((c) => c.score === null);
    if (unscreened.length === 0) {
      addLog("info", "All CVs already screened.");
      return;
    }

    setIsScreening(true);

    for (let i = 0; i < unscreened.length; i++) {
      const candidate = unscreened[i];
      setScreeningStatus(`Screening ${i + 1}/${unscreened.length}: ${candidate.name}`);
      setScreeningProgress(Math.round(((i + 1) / unscreened.length) * 100));

      try {
        const result = await screenCandidateCV({
          jobTitle: job.title,
          jobDesc: job.desc,
          skills: job.skills,
          quals: job.quals,
          cvText: candidate.cv,
        });

        dispatch({
          type: "SET_SCREENING_RESULT",
          payload: {
            id: candidate.id,
            score: result.score,
            reason: result.reason ?? "",
            strengths: result.strengths ?? [],
            gaps: result.gaps ?? [],
            status: result.score >= job.threshold ? "shortlisted" : "rejected",
          },
        });
        addLog(
          "ok",
          `${candidate.name}: score ${result.score} → ${result.score >= job.threshold ? "shortlisted" : "rejected"}`
        );
      } catch (err) {
        dispatch({ type: "SET_SCREENING_ERROR", payload: { id: candidate.id } });
        addLog("err", `Error screening ${candidate.name}: ${(err as Error).message}`);
      }
    }

    setIsScreening(false);
    dispatch({ type: "MARK_STEP_DONE", payload: 2 });
    addLog(
      "ok",
      `Screening complete. ${candidates.filter((c) => c.status === "shortlisted").length} shortlisted.`
    );
  }

  return (
    <div>
      <PageHeader
        stageLabel="Stage 02 / AI Screening"
        title="CV Upload & Screening"
        action={
          <Button variant="primary" disabled={!canScreen} onClick={screenAllCVs}>
            <Cpu size={14} /> Screen CVs with AI
          </Button>
        }
      />

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`cursor-pointer rounded border border-dashed px-6 py-8 text-center text-muted transition-all ${
          isDragOver
            ? "border-accent bg-accent/[0.04] text-text"
            : "border-border2 hover:border-accent hover:bg-accent/[0.04] hover:text-text"
        }`}
      >
        <FileUp size={28} className="mx-auto mb-2 text-muted2" />
        Drop CV files here or click to upload
        <div className="mt-1 text-[11px] text-muted2">Supports .txt files · Multiple files at once</div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.md"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <LogPanel entries={state.log} />

      {isScreening && (
        <div className="mt-3">
          <div className="mb-1.5 flex items-center gap-1.5">
            <BouncingLoader />
            <span className="text-[11px] text-muted">{screeningStatus}</span>
          </div>
          <div className="h-[3px] overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-accent transition-all duration-300"
              style={{ width: `${screeningProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {uploadedOrScreened.map((c) => (
          <CandidateCard key={c.id} candidate={c} />
        ))}
      </div>
    </div>
  );
}

function BouncingLoader() {
  return (
    <span className="inline-flex items-center gap-[3px]">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-[5px] w-[5px] animate-bounce2 rounded-full bg-accent"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}
