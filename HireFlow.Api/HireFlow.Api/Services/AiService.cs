using HireFlow.Api.Models;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace HireFlow.Api.Services
{
    public interface IAiService
    {
        Task<AiScreeningResult> ScreenCandidateAsync(Job job, string cvText);

        /// <summary>Returns the generated letter text, or null if generation failed.</summary>
        Task<string?> GenerateOfferLetterAsync(Candidate candidate);
    }

    public class AiService : IAiService
    {
        private const int MaxCvChars = 8000;

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNameCaseInsensitive = true
        };

        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _model;
        private readonly ILogger<AiService> _logger;

        public AiService(IConfiguration configuration, IHttpClientFactory httpClientFactory, ILogger<AiService> logger)
        {
            _logger = logger;

            _apiKey = configuration["Gemini:ApiKey"]
                ?? throw new InvalidOperationException("Gemini:ApiKey is not configured. Set it via `dotnet user-secrets set \"Gemini:ApiKey\" \"<your key>\"`.");

            _model = configuration["Gemini:Model"] ?? "gemini-flash-latest";
            _httpClient = httpClientFactory.CreateClient("Gemini");
        }

        public async Task<AiScreeningResult> ScreenCandidateAsync(Job job, string cvText)
        {
            _logger.LogInformation("Starting AI screening for candidate. Job: {JobTitle}, Threshold: {Threshold}",
                job.Title, job.Threshold);

            var prompt = BuildScreeningPrompt(job, cvText);
            var generationConfig = new
            {
                temperature = 0.2,
                // gemini-flash-latest "thinks" before answering and this model can't
                // have thinking disabled - observed thinking alone consuming 1300-1900+
                // tokens even on short prompts, so budget generously or a longer CV can
                // get truncated mid-JSON.
                maxOutputTokens = 3000,
                responseMimeType = "application/json",
                responseSchema = new
                {
                    type = "OBJECT",
                    properties = new
                    {
                        score = new { type = "INTEGER" },
                        reason = new { type = "STRING" },
                        strengths = new { type = "ARRAY", items = new { type = "STRING" } },
                        gaps = new { type = "ARRAY", items = new { type = "STRING" } }
                    },
                    required = new[] { "score", "reason", "strengths", "gaps" }
                }
            };

            var (success, text, errorMessage) = await CallGeminiAsync(prompt, generationConfig);
            if (!success)
            {
                return Fallback(errorMessage!);
            }

            var result = JsonSerializer.Deserialize<GeminiScreeningPayload>(text!, JsonOptions);
            if (result == null)
            {
                _logger.LogWarning("Failed to parse Gemini response as screening result: {Text}", text);
                return Fallback("Could not parse AI response");
            }

            var screening = new AiScreeningResult
            {
                Score = Math.Clamp(result.Score, 0, 100),
                Reason = result.Reason,
                Strengths = result.Strengths ?? new List<string>(),
                Gaps = result.Gaps ?? new List<string>()
            };

            _logger.LogInformation("AI screening completed. Score: {Score}, Status: {Status}",
                screening.Score, screening.Score >= job.Threshold ? "Shortlisted" : "Rejected");

            return screening;
        }

        public async Task<string?> GenerateOfferLetterAsync(Candidate candidate)
        {
            _logger.LogInformation("Generating offer letter for CandidateId: {CandidateId}", candidate.Id);

            var prompt = BuildOfferLetterPrompt(candidate);
            var generationConfig = new
            {
                temperature = 0.4,
                // Seen this model spend 1300-1900+ tokens on hidden "thinking" alone for
                // this prompt - a 250-350 word letter needs real headroom on top of that.
                maxOutputTokens = 4000
            };

            var (success, text, errorMessage) = await CallGeminiAsync(prompt, generationConfig);
            if (!success)
            {
                _logger.LogError("Offer letter generation failed for CandidateId: {CandidateId}: {Error}", candidate.Id, errorMessage);
                return null;
            }

            return text;
        }

        /// <summary>
        /// Low-level Gemini generateContent call shared by screening and offer-letter
        /// generation. Returns the raw text of the first candidate response.
        /// </summary>
        private async Task<(bool Success, string? Text, string? ErrorMessage)> CallGeminiAsync(string prompt, object generationConfig)
        {
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent?key={_apiKey}";
            var requestBody = new
            {
                contents = new[]
                {
                    new { parts = new[] { new { text = prompt } } }
                },
                generationConfig
            };

            try
            {
                var response = await _httpClient.PostAsJsonAsync(url, requestBody);
                var raw = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Gemini API returned {StatusCode}: {Body}", response.StatusCode, raw);
                    return (false, null, $"AI call failed ({(int)response.StatusCode})");
                }

                using var doc = JsonDocument.Parse(raw);
                var candidate = doc.RootElement.GetProperty("candidates")[0];

                // This model's internal "thinking" consumes a highly variable, sometimes
                // huge share of maxOutputTokens (seen 1377+ tokens on a single request) -
                // if it eats the whole budget, Gemini reports STOP with a complete-looking
                // but actually truncated response, or MAX_TOKENS with a partial one. Either
                // way, a cut-off mid-sentence answer is worse than a clean failure here.
                var finishReason = candidate.TryGetProperty("finishReason", out var fr) ? fr.GetString() : null;
                if (finishReason == "MAX_TOKENS")
                {
                    _logger.LogWarning("Gemini response was truncated (MAX_TOKENS) - thinking likely consumed most of the token budget");
                    return (false, null, "AI response was truncated - please try again");
                }

                var text = candidate
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString();

                if (string.IsNullOrWhiteSpace(text))
                {
                    _logger.LogWarning("Gemini returned an empty response");
                    return (false, null, "AI returned no result");
                }

                return (true, text, null);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Gemini call failed");
                return (false, null, "AI call failed");
            }
        }

        private static string BuildScreeningPrompt(Job job, string cvText)
        {
            var truncatedCv = cvText.Length > MaxCvChars ? cvText[..MaxCvChars] : cvText;

            return $"""
                You are an expert HR screener. Score this CV against the job description on a 0-100 scale.

                JOB TITLE: {job.Title}
                JOB DESCRIPTION: {job.Description}
                REQUIRED SKILLS: {(job.Skills.Count > 0 ? string.Join(", ", job.Skills) : "Not specified")}
                MUST-HAVE QUALIFICATIONS: {(job.Qualifications.Count > 0 ? string.Join(", ", job.Qualifications) : "Not specified")}

                CV CONTENT:
                {truncatedCv}

                Score strictly against the required skills and qualifications above. Keep "reason" to one sentence (max 100 characters).
                """;
        }

        private static string BuildOfferLetterPrompt(Candidate candidate)
        {
            var job = candidate.Job;
            var r1Avg = ParseAverageScore(candidate.R1Score);
            var r2Avg = ParseAverageScore(candidate.R2Score);

            return $"""
                You are an HR director. Write a professional offer letter for this candidate.

                Candidate: {candidate.Name}
                Role: {job.Title}
                Department: {job.Department ?? "the team"}
                Salary: {job.SalaryRange ?? "Competitive, to be discussed"}
                Interview Round 1 Score: {(r1Avg.HasValue ? $"{r1Avg.Value:0}/100" : "N/A")}
                Interview Round 2 Score: {(r2Avg.HasValue ? $"{r2Avg.Value:0}/100" : "N/A")}

                Write a warm, professional offer letter. Include: congratulations, role and department, salary, a start date placeholder, reporting structure placeholder, and an acceptance deadline. End with a positive closing. Use proper letter format with date, subject line, body, and signature. Keep it to 250-350 words.
                """;
        }

        private static double? ParseAverageScore(string? json)
        {
            if (string.IsNullOrWhiteSpace(json)) return null;
            try
            {
                var scores = JsonSerializer.Deserialize<Dictionary<string, int>>(json);
                return scores is { Count: > 0 } ? scores.Values.Average() : null;
            }
            catch (JsonException)
            {
                return null;
            }
        }

        private static AiScreeningResult Fallback(string reason) => new()
        {
            Score = 50,
            Reason = reason
        };

        private class GeminiScreeningPayload
        {
            public int Score { get; set; }
            public string Reason { get; set; } = string.Empty;
            public List<string>? Strengths { get; set; }
            public List<string>? Gaps { get; set; }
        }
    }

    public class AiScreeningResult
    {
        public int Score { get; set; }
        public string Reason { get; set; } = string.Empty;
        public List<string> Strengths { get; set; } = new();
        public List<string> Gaps { get; set; } = new();
    }
}
