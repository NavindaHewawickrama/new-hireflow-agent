// Candidate API service
// Handles CV persistence and AI screening calls to the backend. Screening
// itself runs server-side (Gemini call lives in HireFlow.Api) - the frontend
// never talks to an AI provider directly.

import { apiFetch } from "./api";

export interface CreateCandidateRequest {
  jobId: number;
  name: string;
  fileName: string;
  cvText: string;
}

interface CandidateWire {
  id: number;
  jobId: number;
  fileName: string;
  name: string;
  cvText: string;
}

/** Persists an uploaded CV as a Candidate row tied to the given job. */
export async function createCandidate(req: CreateCandidateRequest): Promise<{ id: number }> {
  const result = await apiFetch<{ message: string; candidate: CandidateWire }>("/candidates", {
    method: "POST",
    body: JSON.stringify({
      jobId: req.jobId,
      name: req.name,
      fileName: req.fileName,
      cvText: req.cvText,
    }),
  });
  return { id: result.candidate.id };
}

export interface ScreeningResponse {
  score: number;
  status: "shortlisted" | "rejected";
  reason: string;
  strengths: string[];
  gaps: string[];
}

/** Runs AI screening for an already-persisted candidate. Scoring happens server-side. */
export async function screenCandidate(candidateId: number): Promise<ScreeningResponse> {
  return apiFetch<ScreeningResponse>(`/ai/screen/${candidateId}`, {
    method: "POST",
  });
}
