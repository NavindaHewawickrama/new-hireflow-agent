import type { InterviewScores, ScoreDimension } from "../types";

/** The 4 interview dimensions, in display order. Defined once so every
 * component that renders score sliders/labels stays in sync. */
export const SCORE_DIMENSIONS: { key: ScoreDimension; label: string }[] = [
  { key: "technical", label: "Technical" },
  { key: "communication", label: "Communication" },
  { key: "problemSolving", label: "Problem Solving" },
  { key: "culturalFit", label: "Cultural Fit" },
];

/** Averages the 4 interview dimensions, defaulting unset ones to 50 (the
 * slider's neutral midpoint) — mirrors the original calcAvgScore(). */
export function calcAvgScore(scores: InterviewScores): number {
  const total = SCORE_DIMENSIONS.reduce(
    (sum, { key }) => sum + (scores[key] ?? 50),
    0
  );
  return Math.round(total / SCORE_DIMENSIONS.length);
}

/** Maps a 0-100 score to the traffic-light color band used everywhere. */
export function scoreClass(score: number): "score-high" | "score-mid" | "score-low" {
  if (score >= 70) return "score-high";
  if (score >= 50) return "score-mid";
  return "score-low";
}

/** Attempts to pull a candidate's name out of free-text CV content, falling
 * back to a cleaned-up filename. Mirrors the original guessName(). */
export function guessName(filename: string, content: string): string {
  const labeledMatch = content.match(/^Name[:\s]+(.+)/im);
  if (labeledMatch) return labeledMatch[1].trim();

  const capitalizedMatch = content.match(/^([A-Z][a-z]+ [A-Z][a-z]+)/m);
  if (capitalizedMatch) return capitalizedMatch[1].trim();

  return filename.replace(/\.(txt|md)$/i, "").replace(/[_-]/g, " ");
}

/** Generates a reasonably unique id without pulling in a uuid dependency. */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
