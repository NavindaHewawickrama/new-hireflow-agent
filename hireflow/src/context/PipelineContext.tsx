import { createContext, useContext, useReducer, type ReactNode } from "react";
import type {
  Candidate,
  CandidateStatus,
  InterviewScores,
  JobConfig,
  LogLevel,
  PipelineState,
  ScoreDimension,
} from "../types";
import { EMPTY_JOB } from "../types";
import { calcAvgScore, generateId } from "../lib/utils";

/*
 * WHY useReducer + Context instead of alternatives:
 *
 * - Prop-drilling would work for 2-3 levels, but this app has 5 sibling
 *   pages that all read/write the *same* candidates array (screening writes
 *   it, R1 reads+writes it, R2 reads+writes it, offers reads it). Passing
 *   that + its setters down through <App> -> <Main> -> <Page> for every
 *   page is exactly the kind of "prop drilling through components that
 *   don't care about the data" that Context exists to avoid.
 *
 * - A external state library (Redux/Zustand) would be overkill for a single
 *   page-tree app like this. React ships Context + useReducer for free, and
 *   the state shape here is simple enough (one flat-ish object, no complex
 *   async middleware needs) that a reducer captures all the transitions
 *   clearly in one place instead of scattering setState calls everywhere.
 *
 * - useReducer specifically (over several useState calls) because many
 *   updates here are *transitions* that depend on the previous state in a
 *   non-trivial way (e.g. "advance R1" reads every candidate's r1Scores and
 *   derives a new status for each). Expressing each transition as a named
 *   action makes the state machine explicit and easy to trace/debug — you
 *   can log every action and see exactly what happened, in order.
 */

// ---- Actions -----------------------------------------------------------

type Action =
  | { type: "SET_JOB"; payload: JobConfig }
  | { type: "GO_TO"; payload: number }
  | { type: "MARK_STEP_DONE"; payload: number }
  | { type: "ADD_LOG"; payload: { level: LogLevel; message: string } }
  | { type: "ADD_CANDIDATE"; payload: Candidate }
  | { type: "SET_CANDIDATE_BACKEND_ID"; payload: { id: string; backendId: number } }
  | {
      type: "SET_SCREENING_RESULT";
      payload: {
        id: string;
        score: number;
        reason: string;
        strengths: string[];
        gaps: string[];
        status: CandidateStatus;
      };
    }
  | { type: "SET_SCREENING_ERROR"; payload: { id: string } }
  | {
      type: "UPDATE_INTERVIEW_SCORE";
      payload: { id: string; round: "r1" | "r2"; dim: ScoreDimension; value: number };
    }
  | { type: "ADVANCE_R1" }
  | { type: "FINALIZE_R2" }
  | { type: "SET_OFFER_LETTER"; payload: { id: string; letter: string } }
  | { type: "RESET" };

// ---- Initial state -------------------------------------------------------

const initialState: PipelineState = {
  job: EMPTY_JOB,
  candidates: [],
  log: [],
  completedSteps: new Set(),
  currentPage: 1,
};

// ---- Reducer -------------------------------------------------------------

function reducer(state: PipelineState, action: Action): PipelineState {
  switch (action.type) {
    case "SET_JOB":
      return { ...state, job: action.payload };

    case "GO_TO":
      return { ...state, currentPage: action.payload };

    case "MARK_STEP_DONE": {
      const next = new Set(state.completedSteps);
      next.add(action.payload);
      return { ...state, completedSteps: next };
    }

    case "ADD_LOG":
      return {
        ...state,
        log: [
          ...state.log,
          {
            id: generateId(),
            level: action.payload.level,
            message: action.payload.message,
            timestamp: new Date().toLocaleTimeString(),
          },
        ],
      };

    case "ADD_CANDIDATE":
      return { ...state, candidates: [...state.candidates, action.payload] };

    case "SET_CANDIDATE_BACKEND_ID":
      return {
        ...state,
        candidates: state.candidates.map((c) =>
          c.id === action.payload.id ? { ...c, backendId: action.payload.backendId } : c
        ),
      };

    case "SET_SCREENING_RESULT":
      return {
        ...state,
        candidates: state.candidates.map((c) =>
          c.id === action.payload.id
            ? {
                ...c,
                score: action.payload.score,
                reason: action.payload.reason,
                strengths: action.payload.strengths,
                gaps: action.payload.gaps,
                status: action.payload.status,
              }
            : c
        ),
      };

    case "SET_SCREENING_ERROR":
      return {
        ...state,
        candidates: state.candidates.map((c) =>
          c.id === action.payload.id
            ? { ...c, score: 0, reason: "Screening error", status: "rejected" }
            : c
        ),
      };

    case "UPDATE_INTERVIEW_SCORE": {
      const { id, round, dim, value } = action.payload;
      const key = round === "r1" ? "r1Scores" : "r2Scores";
      return {
        ...state,
        candidates: state.candidates.map((c) =>
          c.id === id
            ? { ...c, [key]: { ...c[key], [dim]: value } as InterviewScores }
            : c
        ),
      };
    }

    case "ADVANCE_R1":
      return {
        ...state,
        candidates: state.candidates.map((c) => {
          const eligible =
            c.status === "shortlisted" ||
            c.status === "r1-advanced" ||
            c.status === "r1-rejected";
          if (!eligible) return c;
          const avg = calcAvgScore(c.r1Scores);
          return { ...c, status: avg >= 60 ? "r1-advanced" : "r1-rejected" };
        }),
      };

    case "FINALIZE_R2":
      return {
        ...state,
        candidates: state.candidates.map((c) => {
          const eligible =
            c.status === "r1-advanced" ||
            c.status === "r2-advanced" ||
            c.status === "r2-rejected";
          if (!eligible) return c;
          const avg = calcAvgScore(c.r2Scores);
          return { ...c, status: avg >= 60 ? "r2-advanced" : "r2-rejected" };
        }),
      };

    case "SET_OFFER_LETTER":
      return {
        ...state,
        candidates: state.candidates.map((c) =>
          c.id === action.payload.id ? { ...c, offerLetter: action.payload.letter } : c
        ),
      };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

// ---- Context plumbing ------------------------------------------------

interface PipelineContextValue {
  state: PipelineState;
  dispatch: React.Dispatch<Action>;
}

const PipelineContext = createContext<PipelineContextValue | undefined>(undefined);

export function PipelineProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <PipelineContext.Provider value={{ state, dispatch }}>
      {children}
    </PipelineContext.Provider>
  );
}

/** Typed hook for consuming pipeline state/dispatch. Throwing when used
 * outside the provider surfaces integration mistakes immediately instead of
 * silently returning `undefined` and crashing somewhere confusing later. */
export function usePipeline() {
  const ctx = useContext(PipelineContext);
  if (!ctx) throw new Error("usePipeline must be used within a PipelineProvider");
  return ctx;
}
