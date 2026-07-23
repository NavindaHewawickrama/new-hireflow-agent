using HireFlow.Api.Data;
using HireFlow.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;   // ← Added
using System.Security.Claims;
using System.Text.Json;

namespace HireFlow.Api.Endpoints
{
    public static class InterviewEndpoints
    {
        private static int GetUserId(ClaimsPrincipal user) =>
            int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);

        public static void MapInterviewEndpoints(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/api/interviews").RequireAuthorization();

            // R1 Interview Scoring - only if the candidate's job is owned by the current user
            group.MapPost("/r1/{candidateId}", async (int candidateId, Dictionary<string, int> scores, ClaimsPrincipal user, AppDbContext context, ILogger<Program> logger) =>
            {
                var userId = GetUserId(user);
                logger.LogInformation("R1 scoring started for CandidateId: {CandidateId} by UserId: {UserId}", candidateId, userId);   // ← Log

                var candidate = await context.Candidates
                    .Include(c => c.Job)
                    .FirstOrDefaultAsync(c => c.Id == candidateId);

                if (candidate == null || candidate.Job.CreatedByUserId != userId)
                {
                    logger.LogWarning("R1 scoring failed - Candidate not found or not owned. ID: {CandidateId}, UserId: {UserId}", candidateId, userId);   // ← Log
                    return Results.NotFound(new { message = "Candidate not found." });
                }

                if (scores.Count == 0)
                {
                    return Results.BadRequest(new { message = "At least one score is required." });
                }

                candidate.R1Score = JsonSerializer.Serialize(scores);

                var avg = scores.Values.Average();
                candidate.Status = avg >= 60 ? "r1-advanced" : "r1-rejected";
                candidate.UpdatedAt = DateTime.UtcNow;

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

            // R2 Interview Scoring - only if the candidate's job is owned by the current user
            group.MapPost("/r2/{candidateId}", async (int candidateId, Dictionary<string, int> scores, ClaimsPrincipal user, AppDbContext context, ILogger<Program> logger) =>
            {
                var userId = GetUserId(user);
                logger.LogInformation("R2 scoring started for CandidateId: {CandidateId} by UserId: {UserId}", candidateId, userId);   // ← Log

                var candidate = await context.Candidates
                    .Include(c => c.Job)
                    .FirstOrDefaultAsync(c => c.Id == candidateId);

                if (candidate == null || candidate.Job.CreatedByUserId != userId)
                {
                    logger.LogWarning("R2 scoring failed - Candidate not found or not owned. ID: {CandidateId}, UserId: {UserId}", candidateId, userId);   // ← Log
                    return Results.NotFound(new { message = "Candidate not found." });
                }

                if (scores.Count == 0)
                {
                    return Results.BadRequest(new { message = "At least one score is required." });
                }

                candidate.R2Score = JsonSerializer.Serialize(scores);

                var avg = scores.Values.Average();
                candidate.Status = avg >= 60 ? "r2-advanced" : "r2-rejected";
                candidate.UpdatedAt = DateTime.UtcNow;

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
