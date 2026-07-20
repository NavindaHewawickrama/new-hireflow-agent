using HireFlow.Api.Data;
using HireFlow.Api.Models;
using HireFlow.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;   // ← Added

namespace HireFlow.Api.Endpoints
{
    public static class AiEndpoints
    {
        public static void MapAiEndpoints(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/api/ai");

            // Screen a Candidate with AI
            group.MapPost("/screen/{candidateId}", async (int candidateId, AppDbContext context, IAiService aiService, ILogger<Program> logger) =>
            {
                logger.LogInformation("AI Screening requested for CandidateId: {CandidateId}", candidateId);   // ← Log

                var candidate = await context.Candidates
                    .Include(c => c.Job)
                    .FirstOrDefaultAsync(c => c.Id == candidateId);

                if (candidate == null)
                {
                    logger.LogWarning("AI Screening failed - Candidate not found: {CandidateId}", candidateId);   // ← Log
                    return Results.NotFound(new { message = $"Candidate with ID {candidateId} not found." });
                }

                if (candidate.Job == null)
                {
                    logger.LogWarning("AI Screening failed - No job linked to candidate: {CandidateId}", candidateId);   // ← Log
                    return Results.BadRequest(new { message = "Candidate is not linked to any job." });
                }

                if (string.IsNullOrWhiteSpace(candidate.CVText))
                {
                    logger.LogWarning("AI Screening failed - Empty CV text for candidate: {CandidateId}", candidateId);   // ← Log
                    return Results.BadRequest(new { message = "CV text is empty." });
                }

                // Call AI
                var result = await aiService.ScreenCandidateAsync(candidate.Job, candidate.CVText);

                // Update candidate
                candidate.Score = result.Score;
                candidate.Reason = result.Reason;
                candidate.Strengths = result.Strengths;
                candidate.Gaps = result.Gaps;
                candidate.Status = result.Score >= candidate.Job.Threshold ? "shortlisted" : "rejected";

                await context.SaveChangesAsync();

                logger.LogInformation("AI Screening completed for CandidateId: {CandidateId}. Score: {Score}, Status: {Status}",
                    candidateId, result.Score, candidate.Status);   // ← Log

                return Results.Ok(new
                {
                    message = "AI Screening completed successfully",
                    score = candidate.Score,
                    status = candidate.Status,
                    reason = candidate.Reason,
                    strengths = candidate.Strengths,
                    gaps = candidate.Gaps
                });
            })
            .WithName("ScreenCandidate");

            // Test AI (Mock)
            group.MapGet("/test-ai", async (IAiService aiService, ILogger<Program> logger) =>
            {
                logger.LogInformation("AI Test endpoint called");   // ← Log

                var testJob = new Job
                {
                    Title = "Test Job",
                    Description = "Test description for AI",
                    Skills = new List<string> { "test skill" },
                    Threshold = 70
                };

                var result = await aiService.ScreenCandidateAsync(testJob, "This is a test CV with good experience in development.");

                logger.LogInformation("AI Test completed with score: {Score}", result.Score);   // ← Log

                return Results.Ok(new
                {
                    message = "AI test completed",
                    result
                });
            })
            .WithName("TestAI");
        }
    }
}