using HireFlow.Api.Data;
using HireFlow.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;   // ← Added
using System.Text.Json;

namespace HireFlow.Api.Endpoints
{
    public static class InterviewEndpoints
    {
        public static void MapInterviewEndpoints(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/api/interviews");

            // R1 Interview Scoring
            group.MapPost("/r1/{candidateId}", async (int candidateId, Dictionary<string, int> scores, AppDbContext context, ILogger<Program> logger) =>
            {
                logger.LogInformation("R1 scoring started for CandidateId: {CandidateId}", candidateId);   // ← Log

                var candidate = await context.Candidates.FindAsync(candidateId);
                if (candidate == null)
                {
                    logger.LogWarning("R1 scoring failed - Candidate not found: {CandidateId}", candidateId);   // ← Log
                    return Results.NotFound(new { message = "Candidate not found." });
                }

                candidate.R1Score = JsonSerializer.Serialize(scores);

                var avg = scores.Values.Average();
                candidate.Status = avg >= 60 ? "r1-advanced" : "r1-rejected";

                await context.SaveChangesAsync();

                logger.LogInformation("R1 completed for CandidateId: {CandidateId}. Average: {Avg}, Status: {Status}",
                    candidateId, Math.Round(avg, 2), candidate.Status);   // ← Log

                return Results.Ok(new
                {
                    message = "R1 interview completed",
                    averageScore = Math.Round(avg, 2),
                    status = candidate.Status
                });
            })
            .WithName("R1Scoring");

            // R2 Interview Scoring
            group.MapPost("/r2/{candidateId}", async (int candidateId, Dictionary<string, int> scores, AppDbContext context, ILogger<Program> logger) =>
            {
                logger.LogInformation("R2 scoring started for CandidateId: {CandidateId}", candidateId);   // ← Log

                var candidate = await context.Candidates.FindAsync(candidateId);
                if (candidate == null)
                {
                    logger.LogWarning("R2 scoring failed - Candidate not found: {CandidateId}", candidateId);   // ← Log
                    return Results.NotFound(new { message = "Candidate not found." });
                }

                candidate.R2Score = JsonSerializer.Serialize(scores);

                var avg = scores.Values.Average();
                candidate.Status = avg >= 60 ? "r2-advanced" : "r2-rejected";

                await context.SaveChangesAsync();

                logger.LogInformation("R2 completed for CandidateId: {CandidateId}. Average: {Avg}, Status: {Status}",
                    candidateId, Math.Round(avg, 2), candidate.Status);   // ← Log

                return Results.Ok(new
                {
                    message = "R2 interview completed",
                    averageScore = Math.Round(avg, 2),
                    status = candidate.Status
                });
            })
            .WithName("R2Scoring");
        }
    }
}