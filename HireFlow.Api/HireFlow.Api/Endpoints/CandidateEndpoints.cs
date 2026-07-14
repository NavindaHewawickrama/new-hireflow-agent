using HireFlow.Api.Data;
using HireFlow.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HireFlow.Api.Endpoints
{
    public static class CandidateEndpoints
    {
        public static void MapCandidateEndpoints(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/api/candidates");

            // Create Candidate
            group.MapPost("/", async (Candidate candidate, AppDbContext context) =>
            {
                if (candidate.JobId <= 0 || string.IsNullOrWhiteSpace(candidate.Name) || string.IsNullOrWhiteSpace(candidate.CVText))
                    return Results.BadRequest(new { message = "JobId, Name, and CV Text are required." });

                // Prevent duplicates
                var exists = await context.Candidates
                    .AnyAsync(c => c.JobId == candidate.JobId && c.Name.ToLower() == candidate.Name.ToLower());

                if (exists)
                    return Results.BadRequest(new { message = $"Candidate '{candidate.Name}' already exists for this job." });

                context.Candidates.Add(candidate);
                await context.SaveChangesAsync();

                return Results.Created($"/api/candidates/{candidate.Id}", new
                {
                    message = "Candidate uploaded successfully",
                    candidate
                });
            })
            .WithName("CreateCandidate");

            // Get All Candidates
            group.MapGet("/", async (AppDbContext context) =>
            {
                var candidates = await context.Candidates
                    .Include(c => c.Job)
                    .OrderByDescending(c => c.CreatedAt)
                    .ToListAsync();

                return Results.Ok(new
                {
                    message = "All candidates retrieved successfully",
                    count = candidates.Count,
                    candidates
                });
            })
            .WithName("GetAllCandidates");

            // Get Candidates by Job
            group.MapGet("/by-job", async (int jobId, AppDbContext context) =>
            {
                if (jobId <= 0)
                    return Results.BadRequest(new { message = "Invalid Job ID." });

                var candidates = await context.Candidates
                    .Where(c => c.JobId == jobId)
                    .Include(c => c.Job)
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
                var candidate = await context.Candidates
                    .Include(c => c.Job)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (candidate == null)
                    return Results.NotFound(new { message = $"Candidate with ID {id} not found." });

                return Results.Ok(new { message = "Success", candidate });
            })
            .WithName("GetCandidateById");

            // Delete Candidate
            group.MapDelete("/{id}", async (int id, AppDbContext context) =>
            {
                var candidate = await context.Candidates.FindAsync(id);
                if (candidate == null)
                    return Results.NotFound(new { message = $"Candidate with ID {id} not found." });

                context.Candidates.Remove(candidate);
                await context.SaveChangesAsync();

                return Results.Ok(new { message = "Candidate deleted successfully" });
            })
            .WithName("DeleteCandidate");
        }
    }
}