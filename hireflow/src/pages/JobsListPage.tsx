import { useEffect, useState } from "react";
import { Plus, Calendar, Pencil } from "lucide-react";
import { getAllJobs, deleteJobDescription } from "../lib/jobApi";
import type { JobResponse } from "../lib/jobApi";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/Button";
import { usePipeline } from "../context/PipelineContext";
import { EMPTY_JOB } from "../types";

export function JobsListPage() {
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { dispatch } = usePipeline();

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllJobs();
      setJobs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(jobId: number, jobTitle: string) {
    if (!confirm(`Are you sure you want to delete "${jobTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteJobDescription(jobId);
      setJobs(jobs.filter((job) => job.id !== jobId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete job");
    }
  }

  function handleCreateNew() {
    // Clear out whatever job was last loaded (e.g. from editing) - otherwise
    // the new-job form would silently pre-fill with stale data, and worse,
    // saving would PUT-update that old job instead of creating a new one.
    dispatch({ type: "SET_JOB", payload: EMPTY_JOB });
    dispatch({ type: "GO_TO", payload: 1 });
  }

  function handleEdit(job: JobResponse) {
    dispatch({ type: "SET_JOB", payload: job });
    dispatch({ type: "GO_TO", payload: 1 });
  }

  if (loading) {
    return (
      <div>
        <PageHeader stageLabel="Stage 00 / Job Management" title="Job Descriptions" />
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-muted">Loading jobs...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader stageLabel="Stage 00 / Job Management" title="Job Descriptions" />
        <div className="rounded border border-danger bg-danger/10 p-4 text-sm text-danger">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        stageLabel="Stage 00 / Job Management"
        title="Job Descriptions"
        action={
          <Button variant="primary" onClick={handleCreateNew}>
            <Plus size={14} /> Create New Job
          </Button>
        }
      />

      {jobs.length === 0 ? (
        <div className="rounded border border-border2 bg-surface2 p-8 text-center">
          <div className="mb-2 text-lg font-mono text-muted">No jobs found</div>
          <div className="mb-4 text-sm text-muted2">
            Create your first job description to get started
          </div>
          <Button variant="primary" onClick={handleCreateNew}>
            <Plus size={14} /> Create New Job
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="rounded border border-border bg-surface p-4 transition-colors hover:border-accent"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="mb-1 font-mono text-sm font-semibold text-text">
                    {job.title}
                  </h3>
                  <div className="mb-2 flex items-center gap-3 text-xs text-muted">
                    <span className="font-sans">{job.dept}</span>
                    <span className="text-muted2">•</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mb-3 line-clamp-2 text-xs text-muted2">
                    {job.desc}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.skills.slice(0, 5).map((skill, idx) => (
                      <span
                        key={idx}
                        className="rounded bg-surface3 px-2 py-0.5 font-mono text-[10px] text-muted"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.skills.length > 5 && (
                      <span className="px-2 py-0.5 font-mono text-[10px] text-muted">
                        +{job.skills.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
                <div className="ml-4 flex flex-col gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(job)}>
                    <Pencil size={14} /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(job.id, job.title)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}