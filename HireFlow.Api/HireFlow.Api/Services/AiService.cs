using HireFlow.Api.Models;
using Serilog.Core;
using System.Text.Json;
using Microsoft.Extensions.Logging;

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
        private readonly ILogger<AiService> _logger;

        public AiService(IConfiguration configuration, ILogger<AiService> logger)
        {

            _logger = logger;

            _apiKey = configuration["OpenAI:ApiKey"]
                ?? throw new Exception("OpenAI API Key not configured.");

            _httpClient = new HttpClient();
        }

        //        public async Task<AiScreeningResult> ScreenCandidateAsync(Job job, string cvText)
        //        {
        //            var url = "https://api.openai.com/v1/chat/completions";

        //            var prompt = $@"
        //You are an expert HR screener. Score this CV against the job description.

        //JOB TITLE: {job.Title}
        //DESCRIPTION: {job.Description}
        //REQUIRED SKILLS: {string.Join(", ", job.Skills)}
        //MUST-HAVE QUALIFICATIONS: {string.Join(", ", job.Qualifications)}

        //CV:
        //{cvText.Substring(0, Math.Min(6000, cvText.Length))}

        //Respond with ONLY valid JSON:
        //{{
        //  ""score"": 78,
        //  ""reason"": ""Strong technical background"",
        //  ""strengths"": [""React"", ""Node.js""],
        //  ""gaps"": [""Limited cloud""]
        //}}";

        //            var requestBody = new
        //            {
        //                model = "gpt-4o-mini",
        //                messages = new[]
        //                {
        //                    new { role = "user", content = prompt }
        //                },
        //                temperature = 0.1,
        //                max_tokens = 300
        //            };

        //            var json = JsonSerializer.Serialize(requestBody);
        //            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

        //            _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _apiKey);

        //            try
        //            {
        //                var response = await _httpClient.PostAsync(url, content);
        //                var responseString = await response.Content.ReadAsStringAsync();

        //                if (!response.IsSuccessStatusCode)
        //                {
        //                    Console.WriteLine($"OpenAI Error: {responseString}");
        //                    return new AiScreeningResult { Score = 50, Reason = "API error" };
        //                }

        //                using var doc = JsonDocument.Parse(responseString);
        //                var text = doc.RootElement
        //                    .GetProperty("choices")[0]
        //                    .GetProperty("message")
        //                    .GetProperty("content")
        //                    .GetString() ?? "";

        //                text = text.Replace("```json", "").Replace("```", "").Trim();

        //                var result = JsonSerializer.Deserialize<AiScreeningResult>(text);
        //                return result ?? new AiScreeningResult { Score = 50, Reason = "Parse failed" };
        //            }
        //            catch (Exception ex)
        //            {
        //                Console.WriteLine($"OpenAI Call Failed: {ex.Message}");
        //                return new AiScreeningResult { Score = 50, Reason = "AI call failed" };
        //            }
        //        }

        public async Task<AiScreeningResult> ScreenCandidateAsync(Job job, string cvText)
        {

            _logger.LogInformation("Starting AI screening for candidate. Job: {JobTitle}, Threshold: {Threshold}",
                job.Title, job.Threshold);

            try
            {
                await Task.Delay(500);

                int score = cvText.ToLower().Contains("experience") || cvText.ToLower().Contains("developer") ? 85 : 45;

                var result = new AiScreeningResult
                {
                    Score = score,
                    Reason = score >= job.Threshold
                        ? "Strong match with relevant skills and experience"
                        : "Does not meet the minimum requirements for the role",
                    Strengths = new List<string> { "Technical skills", "Relevant experience" },
                    Gaps = score >= job.Threshold
                        ? new List<string>()
                        : new List<string> { "Limited professional experience" }
                };

                _logger.LogInformation("Mock AI Screening completed. Score: {Score}, Status: {Status}",
                    result.Score, result.Score >= job.Threshold ? "Shortlisted" : "Rejected");

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AI Screening failed for job {JobTitle}", job.Title);
                return new AiScreeningResult
                {
                    Score = 50,
                    Reason = "AI call failed"
                };
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