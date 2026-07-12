using HireFlow.Api.Models;
using System.Text.Json;

namespace HireFlow.Api.Services
{
    public interface IAiService
    {
        Task<AiScreeningResult> ScreenCandidateAsync(Job job, string cvText);
    }

    // Main Service - This is what we inject
    public class AiService : IAiService
    {
        private readonly IAiProvider _provider;

        public AiService(IAiProvider provider)
        {
            _provider = provider;
        }

        public Task<AiScreeningResult> ScreenCandidateAsync(Job job, string cvText)
        {
            return _provider.ScreenCandidateAsync(job, cvText);
        }
    }

    // Interface for different AI providers
    public interface IAiProvider
    {
        Task<AiScreeningResult> ScreenCandidateAsync(Job job, string cvText);
    }

    // Gemini Provider (Current)
    public class GeminiAiProvider : IAiProvider
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        public GeminiAiProvider(IConfiguration configuration)
        {
            _apiKey = configuration["Gemini:ApiKey"]
                ?? throw new Exception("Gemini API Key not configured.");
            _httpClient = new HttpClient();
        }

        public async Task<AiScreeningResult> ScreenCandidateAsync(Job job, string cvText)
        {
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={_apiKey}";

            var prompt = GeneratePrompt(job, cvText);

            var requestBody = new
            {
                contents = new[] { new { parts = new[] { new { text = prompt } } } }
            };

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(url, content);
            var responseString = await response.Content.ReadAsStringAsync();

            try
            {
                using var doc = JsonDocument.Parse(responseString);
                var text = doc.RootElement
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString() ?? "";

                var result = JsonSerializer.Deserialize<AiScreeningResult>(text);
                return result ?? new AiScreeningResult { Score = 50, Reason = "Parse failed" };
            }
            catch
            {
                return new AiScreeningResult { Score = 50, Reason = "AI call failed" };
            }
        }

        private string GeneratePrompt(Job job, string cvText)
        {
            return $@"
You are an expert HR screener. Score this CV.

JOB TITLE: {job.Title}
DESCRIPTION: {job.Description}
SKILLS: {string.Join(", ", job.Skills)}
QUALIFICATIONS: {string.Join(", ", job.Qualifications)}
THRESHOLD: {job.Threshold}

CV:
{cvText.Substring(0, Math.Min(7000, cvText.Length))}

Return ONLY valid JSON:
{{
  ""score"": <0-100>,
  ""reason"": ""short reason"",
  ""strengths"": [""item1""],
  ""gaps"": [""item1""]
}}";
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