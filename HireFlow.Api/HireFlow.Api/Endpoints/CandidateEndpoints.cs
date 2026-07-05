using HireFlow.Api.Data;
using HireFlow.Api.Models;
using Microsoft.EntityFrameworkCore;

using System.Runtime.CompilerServices;

namespace HireFlow.Api.Endpoints
{
    public static class CandidateEndpoints
    {
        public static void MapCandidateEndpoints(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/api/candidates");

            //upload / create candidate
            group.MapPost("/", async (Candidate candidate, AppDbContext context) =>
            {
                if (candidate.JobId <= 0 || string.IsNullOrWhiteSpace(candidate.Name) || string.IsNullOrWhiteSpace(candidate.CVText))
                {
                    return Results.BadRequest(new { message = "JobId, Name, and CV Text are required." });
                }

                context.Candidates.Add(candidate);
                await context.SaveChangesAsync();

                return Results.Created($"/api/candidates/{candidate.Id}", new
                {
                    message = "Candidate uploaded successfully",
                    candidate
                });
            }).WithName("CreateCandidate");

            // Get Candidates by Job ID
            group.MapGet("/by-job", async (int jobId, AppDbContext context) =>
            {
                if (jobId <= 0)
                    return Results.BadRequest(new { message = "Invalid Job ID." });

                var candidates = await context.Candidates
                    .Where(c => c.JobId == jobId)
                    .OrderByDescending(c => c.CreatedAt)
                    .ToListAsync();

                return Results.Ok(new
                {
                    message = "Candidates retrieved successfully",
                    count = candidates.Count,
                    candidates
                });
            })
            .WithName("GetCandidatesByJob");

            // Get Single Candidate
            group.MapGet("/{id}", async (int id, AppDbContext context) =>
            {
                var candidate = await context.Candidates.FindAsync(id);

                if (candidate == null)
                    return Results.NotFound(new { message = $"Candidate with ID {id} not found." });

                return Results.Ok(new { message = "Success", candidate });
            })
            .WithName("GetCandidateById");
        }
    }
}
