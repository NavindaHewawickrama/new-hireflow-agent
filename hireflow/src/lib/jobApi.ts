// Job API service
// Handles job description creation and related API calls

import { apiFetch } from "./api";

export interface CreateJobRequest {
  title: string;
  dept: string;
  desc: string;
  skills: string[];
  quals: string[];
  salary: string;
  threshold: number;
}

export interface JobResponse {
  id: number;
  title: string;
  dept: string;
  desc: string;
  skills: string[];
  quals: string[];
  salary: string;
  threshold: number;
  createdAt: string;
  updatedAt: string;
}

/** Wire shape returned by the API (matches HireFlow.Api.Models.Job, camelCased). */
interface JobWire {
  id: number;
  title: string;
  department: string | null;
  description: string;
  skills: string[];
  qualifications: string[];
  salaryRange: string | null;
  threshold: number;
  createdAt: string;
  updatedAt: string;
}

function toWirePayload(jobData: Partial<CreateJobRequest>) {
  return {
    title: jobData.title,
    department: jobData.dept,
    description: jobData.desc,
    skills: jobData.skills,
    qualifications: jobData.quals,
    salaryRange: jobData.salary,
    threshold: jobData.threshold,
  };
}

function fromWire(job: JobWire): JobResponse {
  return {
    id: job.id,
    title: job.title,
    dept: job.department ?? "",
    desc: job.description,
    skills: job.skills,
    quals: job.qualifications,
    salary: job.salaryRange ?? "",
    threshold: job.threshold,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

/**
 * Create a new job description
 * @param jobData - Job configuration data
 * @returns Created job data on success
 * @throws ApiError on failure
 */
export async function createJobDescription(
  jobData: CreateJobRequest
): Promise<JobResponse> {
  const result = await apiFetch<{ message: string; job: JobWire }>("/jobs", {
    method: "POST",
    body: JSON.stringify(toWirePayload(jobData)),
  });
  return fromWire(result.job);
}

/**
 * Get job description by ID
 * @param jobId - Job ID
 * @returns Job data on success
 * @throws ApiError on failure
 */
export async function getJobDescription(jobId: number): Promise<JobResponse> {
  const result = await apiFetch<{ message: string; job: JobWire }>(
    `/jobs/by-id?jobId=${jobId}`
  );
  return fromWire(result.job);
}

/**
 * Update an existing job description
 * @param jobId - Job ID
 * @param jobData - Updated job configuration data
 * @returns Updated job data on success
 * @throws ApiError on failure
 */
export async function updateJobDescription(
  jobId: number,
  jobData: Partial<CreateJobRequest>
): Promise<JobResponse> {
  const result = await apiFetch<{ message: string; job: JobWire }>(`/jobs/${jobId}`, {
    method: "PUT",
    body: JSON.stringify(toWirePayload(jobData)),
  });
  return fromWire(result.job);
}

/**
 * Delete a job description
 * @param jobId - Job ID
 * @throws ApiError on failure
 */
export async function deleteJobDescription(jobId: number): Promise<void> {
  await apiFetch<{ message: string }>(`/jobs/${jobId}`, {
    method: "DELETE",
  });
}

/**
 * Get all job descriptions
 * @returns Array of job data on success
 * @throws ApiError on failure
 */
export async function getAllJobs(): Promise<JobResponse[]> {
  const result = await apiFetch<{ message: string; count: number; jobs: JobWire[] }>(
    "/jobs"
  );
  return result.jobs.map(fromWire);
}
