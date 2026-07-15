using HireFlow.Api.Data;
using HireFlow.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace HireFlow.Api.Endpoints
{
    public static class InterviewEndpoints
    {
        public static void MapInterviewEndpoints(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/api/interviews");

            // R1 Interview Scoring
            group.MapPost("/r1/{candidateId}", async (int candidateId, Dictionary<string, int> scores, AppDbContext context) =>
            {
                var candidate = await context.Candidates.FindAsync(candidateId);
                if (candidate == null)
                    return Results.NotFound(new { message = "Candidate not found." });

                candidate.R1Score = JsonSerializer.Serialize(scores);

                var avg = scores.Values.Average();
                candidate.Status = avg >= 60 ? "r1-advanced" : "r1-rejected";

                await context.SaveChangesAsync();

                return Results.Ok(new
                {
                    message = "R1 interview completed",
                    averageScore = Math.Round(avg, 2),
                    status = candidate.Status
                });
            })
            .WithName("R1Scoring");

            // R2 Interview Scoring
            group.MapPost("/r2/{candidateId}", async (int candidateId, Dictionary<string, int> scores, AppDbContext context) =>
            {
                var candidate = await context.Candidates.FindAsync(candidateId);
                if (candidate == null)
                    return Results.NotFound(new { message = "Candidate not found." });

                candidate.R2Score = JsonSerializer.Serialize(scores);

                var avg = scores.Values.Average();
                candidate.Status = avg >= 60 ? "r2-advanced" : "r2-rejected";

                await context.SaveChangesAsync();

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