using HireFlow.Api.Models;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace HireFlow.Api.Services
{
    public interface IAiService
    {
        Task<AiScreeningResult> ScreenCandidateAsync(Job job, string cvText);
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

            var prompt = BuildPrompt(job, cvText);
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent?key={_apiKey}";

            var requestBody = new
            {
                contents = new[]
                {
                    new { parts = new[] { new { text = prompt } } }
                },
                generationConfig = new
                {
                    temperature = 0.2,
                    // gemini-flash-latest "thinks" before answering and this model
                    // can't have thinking disabled - budget for ~500 thinking tokens
                    // plus the JSON answer, or a longer CV can get truncated mid-JSON.
                    maxOutputTokens = 2000,
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
                }
            };

            try
            {
                var response = await _httpClient.PostAsJsonAsync(url, requestBody);
                var raw = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Gemini API returned {StatusCode}: {Body}", response.StatusCode, raw);
                    return Fallback($"AI screening unavailable ({(int)response.StatusCode})");
                }

                using var doc = JsonDocument.Parse(raw);
                var text = doc.RootElement
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString();

                if (string.IsNullOrWhiteSpace(text))
                {
                    _logger.LogWarning("Gemini returned an empty response for job {JobTitle}", job.Title);
                    return Fallback("AI returned no result");
                }

                var result = JsonSerializer.Deserialize<GeminiScreeningPayload>(text, JsonOptions);
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
            catch (Exception ex)
            {
                _logger.LogError(ex, "Gemini screening call failed for job {JobTitle}", job.Title);
                return Fallback("AI call failed");
            }
        }

        private static string BuildPrompt(Job job, string cvText)
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
