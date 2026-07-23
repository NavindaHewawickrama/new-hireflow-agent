// Candidate API service
// Handles CV persistence and AI screening calls to the backend. Screening
// itself runs server-side (Gemini call lives in HireFlow.Api) - the frontend
// never talks to an AI provider directly.

import { apiFetch } from "./api";
import type { Candidate, CandidateStatus, InterviewScores } from "../types";

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
  score: number | null;
  reason: string | null;
  strengths: string[];
  gaps: string[];
  status: string;
  r1Score: string | null;
  r2Score: string | null;
  offerLetter: string | null;
}

/** R1Score/R2Score are stored server-side as a serialized JSON object
 * (e.g. `{"technical":80,...}`) - parse defensively since malformed or
 * absent data shouldn't break loading the rest of the candidate. */
function parseInterviewScores(json: string | null): InterviewScores {
  if (!json) return {};
  try {
    return JSON.parse(json) as InterviewScores;
  } catch {
    return {};
  }
}

function fromWire(c: CandidateWire): Candidate {
  return {
    id: String(c.id),
    backendId: c.id,
    filename: c.fileName,
    name: c.name,
    cv: c.cvText,
    score: c.score,
    reason: c.reason ?? "",
    strengths: c.strengths ?? [],
    gaps: c.gaps ?? [],
    status: c.status as CandidateStatus,
    r1Scores: parseInterviewScores(c.r1Score),
    r2Scores: parseInterviewScores(c.r2Score),
    offerLetter: c.offerLetter ?? "",
  };
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

export interface InterviewScoringResponse {
  averageScore: number;
  status: "r1-advanced" | "r1-rejected" | "r2-advanced" | "r2-rejected";
}

/** Persists a candidate's Round 1 interview scores and returns the computed status. */
export async function submitR1Score(
  candidateId: number,
  scores: Record<string, number>
): Promise<InterviewScoringResponse> {
  return apiFetch<InterviewScoringResponse>(`/interviews/r1/${candidateId}`, {
    method: "POST",
    body: JSON.stringify(scores),
  });
}

/** Persists a candidate's Round 2 interview scores and returns the computed status. */
export async function submitR2Score(
  candidateId: number,
  scores: Record<string, number>
): Promise<InterviewScoringResponse> {
  return apiFetch<InterviewScoringResponse>(`/interviews/r2/${candidateId}`, {
    method: "POST",
    body: JSON.stringify(scores),
  });
}

/** Generates (server-side, via Gemini) and persists an offer letter for an r2-advanced candidate. */
export async function generateOffer(candidateId: number): Promise<string> {
  const result = await apiFetch<{ message: string; offerLetter: string }>(`/offers/${candidateId}`, {
    method: "POST",
  });
  return result.offerLetter;
}

/** Loads every previously-saved candidate for a job - used when resuming work
 * on a job created in an earlier session instead of the just-created one. */
export async function getCandidatesByJob(jobId: number): Promise<Candidate[]> {
  const result = await apiFetch<{ message: string; count: number; candidates: CandidateWire[] }>(
    `/candidates/by-job?jobId=${jobId}`
  );
  return result.candidates.map(fromWire);
}
