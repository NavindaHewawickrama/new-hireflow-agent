# HireFlow

**AI-powered CV screening and recruitment pipeline.**

HireFlow takes a job description and a stack of CVs and runs them through the whole hiring pipeline: AI screening and scoring, two rounds of interview scoring, and AI-generated offer letters — all scoped per recruiter, so each user only ever sees their own jobs and candidates.

The repo has two projects:

- **[`hireflow/`](./hireflow)** — React + TypeScript frontend
- **[`HireFlow.Api/`](./HireFlow.Api)** — .NET 8 Web API backend

---

## How it works

1. **Job Setup** — create (or edit) a job: title, department, description, required skills, must-have qualifications, salary range, and a screening threshold.
2. **CV Screening** — upload CVs (`.txt`/`.md`), each one is persisted and scored 0–100 against the job by an AI call, with a reason, strengths, and gaps. Candidates at or above the job's threshold are shortlisted.
3. **Interview Round 1 / Round 2** — score shortlisted candidates across four dimensions (technical, communication, problem solving, cultural fit). A candidate advances if their average is ≥ 60.
4. **Offer Letters** — for every round-2-advanced candidate, generate a full offer letter (AI-written, using the candidate's name, role, department, salary, and interview scores).

You can also come back to an old job later — the **Open** button on the Jobs list reloads that job plus every candidate already linked to it, so you can keep adding CVs to a job you set up in a previous session.

---

## Architecture

| Layer | Stack |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Backend | .NET 8 (ASP.NET Core Minimal APIs) |
| Database | SQL Server, via Entity Framework Core |
| Auth | JWT (email/password with BCrypt hashing) + optional Google OAuth |
| AI | Google Gemini (`gemini-flash-latest` by default), called server-side over plain REST — no SDK dependency |
| Logging | Serilog (console + rolling daily file under `HireFlow.Api/HireFlow.Api/logs/`) |

**The AI provider is Gemini, not Anthropic/Claude**, despite a file named `AiService.cs` — Gemini has a genuinely free tier, which is why it was chosen over paid-only providers. All AI calls happen **server-side only**; the frontend never talks to an AI provider directly, and never sees an API key.

Every job, candidate, and AI call is scoped to the authenticated user via `Job.CreatedByUserId` — one user can never see, edit, or screen another user's jobs or candidates.

### Repo structure

```
HireFlow/
├── HireFlow.Api/HireFlow.Api/     # Backend (.NET 8 minimal API)
│   ├── Auth/                      # JWT + BCrypt auth service
│   ├── Data/                      # EF Core DbContext
│   ├── DTOs/                      # Request/response records
│   ├── Endpoints/                 # Job / Candidate / AI / Interview / Offer / Auth endpoints
│   ├── Migrations/                # EF Core migrations
│   ├── Models/                    # Job, Candidate, User
│   ├── Services/                  # AiService (Gemini integration)
│   ├── Dockerfile
│   └── Program.cs
├── hireflow/                      # Frontend (React + Vite)
│   └── src/
│       ├── components/            # Reusable UI (cards, modals, buttons)
│       ├── context/                # PipelineContext (useReducer) + AuthContext + ModalContext
│       ├── lib/                    # API clients (jobApi, candidateApi, authApi) + utils
│       ├── pages/                  # One page per pipeline stage
│       └── types/                  # Shared TypeScript types
├── docker-compose.yml              # SQL Server + API + frontend, all containerized
└── .env.example                    # Template for docker-compose secrets
```

---

## Getting started (local, without Docker)

### Prerequisites

- .NET 8 SDK
- Node.js 18+
- SQL Server (e.g. SSMS / SQL Server Developer Edition) running locally
- A free [Google Gemini API key](https://aistudio.google.com/apikey) (no credit card required)

### Backend

```bash
cd HireFlow.Api/HireFlow.Api
dotnet user-secrets set "Gemini:ApiKey" "<your-gemini-api-key>"
dotnet ef database update
dotnet run
```

The default connection string (`appsettings.json`) uses Windows Trusted Connection against a local SQL Server instance — no password needed if SQL Server is running as your own user. Swagger UI is at `/swagger` when running in Development.

### Frontend

```bash
cd hireflow
cp .env.example .env   # defaults to https://localhost:7102/api, adjust if needed
npm install
npm run dev
```

Opens at `http://localhost:5173`.

---

## Getting started (Docker)

```bash
cp .env.example .env   # fill in MSSQL_SA_PASSWORD, JWT_KEY, GEMINI_API_KEY
docker compose up -d
```

This brings up three containers: `sqlserver` (SQL Server 2022), `api` (applies pending EF Core migrations automatically on startup), and `frontend` (built and served via nginx). Frontend on `:5173`, API on `:8080`.

---

## Configuration reference

All secrets are read from `dotnet user-secrets` locally, or from environment variables in Docker (`docker-compose.yml` / `.env`). **Never commit real values to `appsettings.json`.**

| Key | Purpose | Required |
|---|---|---|
| `Gemini:ApiKey` | Google Gemini API key — powers CV screening and offer letter generation | Yes |
| `Gemini:Model` | Gemini model ID (default: `gemini-flash-latest`) | No |
| `Authentication:Jwt:Key` | Signing key for issued JWTs | Yes |
| `Authentication:Google:ClientId` / `ClientSecret` | Google OAuth login | No — app runs fine without it, "Sign in with Google" is just unavailable |
| `ConnectionStrings:DefaultConnection` | SQL Server connection string | Yes |

---

## API overview

All endpoints except `/api/auth/*` require a `Bearer` JWT and are scoped to the authenticated user.

| Group | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `/login`, `/logout`, `/google-login`, `/google-callback` |
| Jobs | `GET/POST /api/jobs`, `GET /api/jobs/by-id`, `PUT/DELETE /api/jobs/{id}` |
| Candidates | `GET/POST /api/candidates`, `GET /api/candidates/by-job`, `GET/DELETE /api/candidates/{id}` |
| AI Screening | `POST /api/ai/screen/{candidateId}` |
| Interviews | `POST /api/interviews/r1/{candidateId}`, `POST /api/interviews/r2/{candidateId}` |
| Offers | `POST /api/offers/{candidateId}` (requires candidate status `r2-advanced`) |

---

## Known limitations

- **CV upload is plain text only** — `.txt`/`.md` files, no PDF/DOCX parsing. Only the extracted text is stored; the original file isn't kept anywhere.
- **No real email sending.** Offer letters and interview "email preview" are generated/rendered in-app only — nothing is actually sent to a candidate's inbox.
- **No automated test suite** — everything has been verified manually against a running instance.
- **CORS is wide open** (`AllowAll`) — fine for local development, should be locked down before any real deployment.
- **No refresh tokens** — JWTs simply expire (60 min default); logout clears local storage but doesn't invalidate the token server-side.
- **No pagination** on job or candidate listings.
- `Npgsql.EntityFrameworkCore.PostgreSQL` is still referenced in the `.csproj` but unused — the app runs on SQL Server only; this is leftover from an earlier iteration.

---

## License

Private and proprietary.
