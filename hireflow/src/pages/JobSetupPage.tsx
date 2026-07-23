import { useState } from "react";
import { Check } from "lucide-react";
import { usePipeline } from "../context/PipelineContext";
import { createJobDescription, updateJobDescription } from "../lib/jobApi";
import { PageHeader } from "../components/PageHeader";
import { TagInput } from "../components/ui/TagInput";
import { Button } from "../components/ui/Button";
import { EMPTY_JOB } from "../types";

/**
 * Page 1 — Job Description Setup.
 *
 * Form fields are kept in *local* component state (useState) rather than
 * dispatched to the global pipeline context on every keystroke. Only
 * `job.threshold` needs to be "live" elsewhere (nothing else reads it while
 * this page is open), and none of the other pages need to see job details
 * mid-edit — they only need the *saved* result. Committing to global state
 * only on "Save & Continue" avoids re-rendering the sidebar/other pages on
 * every keystroke and matches the original app's behavior (which only
 * wrote to `state.job` inside saveJobSetup()).
 */
export function JobSetupPage() {
  const { state, dispatch } = usePipeline();

  // Captured once per render, before any save happens - if the page was
  // opened via "Edit" this is already set, so handleSave below know whether
  // to PUT (update) or POST (create) without depending on state that might
  // change mid-save.
  const editingJobId = state.job.id;

  const [title, setTitle] = useState(state.job.title);
  const [dept, setDept] = useState(state.job.dept);
  const [desc, setDesc] = useState(state.job.desc);
  const [salary, setSalary] = useState(state.job.salary);
  const [threshold, setThreshold] = useState(state.job.threshold);
  const [skills, setSkills] = useState<string[]>(state.job.skills);
  const [quals, setQuals] = useState<string[]>(state.job.quals);

  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim() || !desc.trim()) {
      alert("Please fill in Job Title and Description.");
      return;
    }

    setSaving(true);
    try {
      const jobData = {
        title: title.trim(),
        dept: dept.trim(),
        desc: desc.trim(),
        salary: salary.trim(),
        threshold,
        skills,
        quals,
      };

      if (editingJobId) {
        const updatedJob = await updateJobDescription(editingJobId, jobData);
        dispatch({ type: "SET_JOB", payload: { ...EMPTY_JOB, ...updatedJob } });
        dispatch({
          type: "ADD_LOG",
          payload: { level: "ok", message: `Updated job: ${updatedJob.title}` },
        });
        dispatch({ type: "GO_TO", payload: 0 });
      } else {
        const createdJob = await createJobDescription(jobData);
        dispatch({ type: "SET_JOB", payload: { ...EMPTY_JOB, ...createdJob } });
        dispatch({ type: "MARK_STEP_DONE", payload: 1 });
        dispatch({ type: "GO_TO", payload: 2 });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save job. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        stageLabel="Stage 01 / Job Configuration"
        title={editingJobId ? "Edit Job" : "Job Description Setup"}
        action={
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            <Check size={14} />{" "}
            {saving ? "Saving..." : editingJobId ? "Update Job" : "Save & Continue"}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Job Title">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Senior Backend Engineer"
            className={INPUT_CLASSES}
          />
        </Field>
        <Field label="Department">
          <input
            type="text"
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            placeholder="e.g. Engineering"
            className={INPUT_CLASSES}
          />
        </Field>
      </div>

      <Field label="Job Description">
        <textarea
          rows={7}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Paste the full job description here. This will be used by AI to score CVs..."
          className={INPUT_CLASSES}
        />
      </Field>

      <Field label="Required Skills" hint="(press Enter to add)">
        <TagInput tags={skills} onChange={setSkills} placeholder="e.g. Python" />
      </Field>

      <Field label="Must-Have Qualifications" hint="(press Enter to add)">
        <TagInput tags={quals} onChange={setQuals} placeholder="e.g. 5+ years experience" />
      </Field>

      <Field label="Salary Range">
        <input
          type="text"
          value={salary}
          onChange={(e) => setSalary(e.target.value)}
          placeholder="e.g. $90,000 – $120,000"
          className={INPUT_CLASSES}
        />
      </Field>

      <Field label="Screening threshold" hint="(minimum score to shortlist)">
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={30}
            max={90}
            step={5}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="flex-1"
          />
          <span className="min-w-[30px] font-mono text-sm text-accent">{threshold}</span>
        </div>
      </Field>
    </div>
  );
}

const INPUT_CLASSES =
  "w-full rounded border border-border2 bg-surface2 px-3 py-2.5 text-xs text-text outline-none transition-colors focus:border-accent resize-y";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-muted">
        {label}
        {hint && <span className="ml-1 font-sans text-[11px] normal-case tracking-normal text-muted2">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
