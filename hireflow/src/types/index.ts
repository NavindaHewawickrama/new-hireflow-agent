// Central domain types. Keeping these in one file (instead of scattering
// inline object shapes across components) is what lets TypeScript catch
// mistakes like a typo'd status string at compile time instead of runtime.

/** The lifecycle a candidate moves through as they progress down the pipeline. */
export type CandidateStatus =
  | "uploaded"
  | "shortlisted"
  | "rejected"
  | "r1-advanced"
  | "r1-rejected"
  | "r2-advanced"
  | "r2-rejected";

/** The four dimensions scored during live interview rounds. */
export type ScoreDimension =
  | "technical"
  | "communication"
  | "problemSolving"
  | "culturalFit";

export type InterviewScores = Partial<Record<ScoreDimension, number>>;

export interface Candidate {
  id: string;
  /** Backend-assigned Candidate.Id, set once the CV is persisted via POST /api/candidates. */
  backendId?: number;
  filename: string;
  name: string;
  cv: string;
  score: number | null;
  reason: string;
  strengths: string[];
  gaps: string[];
  status: CandidateStatus;
  r1Scores: InterviewScores;
  r2Scores: InterviewScores;
  offerLetter: string;
}

export interface JobConfig {
  /** Backend-assigned Job.Id, set once the job is saved via POST /api/jobs. */
  id?: number;
  title: string;
  dept: string;
  desc: string;
  skills: string[];
  quals: string[];
  salary: string;
  threshold: number;
}

export type LogLevel = "ok" | "err" | "info";

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: string;
}

export interface PipelineState {
  job: JobConfig;
  candidates: Candidate[];
  log: LogEntry[];
  completedSteps: Set<number>;
  currentPage: number;
}

export const EMPTY_JOB: JobConfig = {
  title: "",
  dept: "",
  desc: "",
  skills: [],
  quals: [],
  salary: "",
  threshold: 60,
};

/** User profile returned by the auth API. */
export interface User {
  email: string;
  name: string;
}
