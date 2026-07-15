using HireFlow.Api.Models;
using System.Text.Json;

namespace HireFlow.Api.Services
{
    public interface IAiService
    {
        Task<AiScreeningResult> ScreenCandidateAsync(Job job, string cvText);
    }

    public class AiService : IAiService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        public AiService(IConfiguration configuration)
        {
            _apiKey = configuration["Groq:ApiKey"]
                ?? throw new Exception("Groq API Key not configured.");

            _httpClient = new HttpClient();
        }

        public async Task<AiScreeningResult> ScreenCandidateAsync(Job job, string cvText)
        {
            var url = "https://api.groq.com/openai/v1/chat/completions";

            var prompt = $@"
You are an expert HR screener. Score this CV against the job description.

JOB TITLE: {job.Title}
DESCRIPTION: {job.Description}
REQUIRED SKILLS: {string.Join(", ", job.Skills)}
MUST-HAVE QUALIFICATIONS: {string.Join(", ", job.Qualifications)}

CV:
{cvText.Substring(0, Math.Min(6000, cvText.Length))}

**IMPORTANT**: Respond with **ONLY** valid JSON. No extra text, no markdown.
{{
  ""score"": 75,
  ""reason"": ""Strong technical background"",
  ""strengths"": [""React"", ""Node.js""],
  ""gaps"": [""Limited cloud experience""]
}}";

            var requestBody = new
            {
                model = "llama-3.1-8b-instant",
                messages = new[]
                {
            new { role = "user", content = prompt }
        },
                temperature = 0.1,
                max_tokens = 400
            };

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _apiKey);

            try
            {
                var response = await _httpClient.PostAsync(url, content);
                var responseString = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"Groq Error: {responseString}");
                    return new AiScreeningResult { Score = 50, Reason = "API error" };
                }

                using var doc = JsonDocument.Parse(responseString);
                var text = doc.RootElement
                    .GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString() ?? "";

                // Clean the response (remove markdown if any)
                text = text.Replace("```json", "").Replace("```", "").Trim();

                var result = JsonSerializer.Deserialize<AiScreeningResult>(text);
                return result ?? new AiScreeningResult { Score = 50, Reason = "Parse failed" };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Groq Call Failed: {ex.Message}");
                return new AiScreeningResult { Score = 50, Reason = "AI call failed" };
            }
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