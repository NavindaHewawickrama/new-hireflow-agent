// Thin wrapper around the Anthropic Messages API used by both the CV
// screening step and the offer-letter generation step. Isolating the fetch
// call here (rather than inlining it in components) means:
//   1. Components stay focused on rendering/state, not networking.
//   2. If the endpoint/model ever changes, there's exactly one place to edit.
//   3. It's independently testable/mockable.

const ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

interface ContentBlock {
  type: string;
  text?: string;
}

interface MessagesResponse {
  content: ContentBlock[];
}

async function callClaude(prompt: string, maxTokens = 1000): Promise<string> {
  const response = await fetch(ANTHROPIC_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API request failed with status ${response.status}`);
  }

  const data: MessagesResponse = await response.json();
  return data.content.map((block) => block.text ?? "").join("");
}

export interface ScreeningResult {
  score: number;
  reason: string;
  strengths: string[];
  gaps: string[];
}

/** Scores a single CV against the job description using the AI model. */
export async function screenCandidateCV(params: {
  jobTitle: string;
  jobDesc: string;
  skills: string[];
  quals: string[];
  cvText: string;
}): Promise<ScreeningResult> {
  const { jobTitle, jobDesc, skills, quals, cvText } = params;

  const prompt = `You are an expert HR screener. Score this CV against the job description.

JOB TITLE: ${jobTitle}
JOB DESCRIPTION: ${jobDesc}
REQUIRED SKILLS: ${skills.join(", ") || "Not specified"}
MUST-HAVE QUALIFICATIONS: ${quals.join(", ") || "Not specified"}

CV CONTENT:
${cvText.substring(0, 3000)}

Return ONLY valid JSON (no markdown, no explanation):
{"score": <0-100 integer>, "reason": "<one sentence max 100 chars>", "strengths": ["strength1","strength2"], "gaps": ["gap1"]}`;

  const raw = await callClaude(prompt);
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned) as ScreeningResult;
  return parsed;
}

/** Generates a formatted offer letter for a finalist candidate. */
export async function generateOfferLetter(params: {
  candidateName: string;
  jobTitle: string;
  dept: string;
  salary: string;
  r1Score: number;
  r2Score: number;
}): Promise<string> {
  const { candidateName, jobTitle, dept, salary, r1Score, r2Score } = params;

  const prompt = `You are an HR director. Write a professional offer letter for this candidate.

Candidate: ${candidateName}
Role: ${jobTitle}
Department: ${dept || "the team"}
Salary: ${salary || "Competitive, to be discussed"}
R1 Interview Score: ${r1Score}/100
R2 Interview Score: ${r2Score}/100
Company: Acme Corp

Write a warm, professional offer letter. Include: congratulations, role and department, salary, start date placeholder, reporting structure placeholder, acceptance deadline. End with a positive closing. Use proper letter format with date, address header, subject line, body, and signature. Keep it to 250-350 words.`;

  return callClaude(prompt);
}
