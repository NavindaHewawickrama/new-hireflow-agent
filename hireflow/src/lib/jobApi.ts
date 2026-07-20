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
  id: string;
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

/**
 * Create a new job description
 * @param jobData - Job configuration data
 * @returns Created job data on success
 * @throws ApiError on failure
 */
export async function createJobDescription(
  jobData: CreateJobRequest
): Promise<JobResponse> {
  return apiFetch<JobResponse>("/jobs", {
    method: "POST",
    body: JSON.stringify(jobData),
  });
}

/**
 * Get job description by ID
 * @param jobId - Job ID
 * @returns Job data on success
 * @throws ApiError on failure
 */
export async function getJobDescription(jobId: string): Promise<JobResponse> {
  return apiFetch<JobResponse>(`/jobs/${jobId}`);
}

/**
 * Update an existing job description
 * @param jobId - Job ID
 * @param jobData - Updated job configuration data
 * @returns Updated job data on success
 * @throws ApiError on failure
 */
export async function updateJobDescription(
  jobId: string,
  jobData: Partial<CreateJobRequest>
): Promise<JobResponse> {
  return apiFetch<JobResponse>(`/jobs/${jobId}`, {
    method: "PUT",
    body: JSON.stringify(jobData),
  });
}

/**
 * Delete a job description
 * @param jobId - Job ID
 * @throws ApiError on failure
 */
export async function deleteJobDescription(jobId: string): Promise<void> {
  return apiFetch<void>(`/jobs/${jobId}`, {
    method: "DELETE",
  });
}

/**
 * Get all job descriptions
 * @returns Array of job data on success
 * @throws ApiError on failure
 */
export async function getAllJobs(): Promise<JobResponse[]> {
  return apiFetch<JobResponse[]>("/jobs");
}