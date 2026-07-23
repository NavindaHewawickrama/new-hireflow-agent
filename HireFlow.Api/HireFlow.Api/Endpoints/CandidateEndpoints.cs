using HireFlow.Api.Data;
using HireFlow.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HireFlow.Api.Endpoints
{
    public static class CandidateEndpoints
    {
        private static int GetUserId(ClaimsPrincipal user) =>
            int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);

        public static void MapCandidateEndpoints(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/api/candidates").RequireAuthorization();

            // Create Candidate - only for a job owned by the current user
            group.MapPost("/", async (Candidate candidate, ClaimsPrincipal user, AppDbContext context) =>
            {
                var userId = GetUserId(user);

                if (candidate.JobId <= 0 || string.IsNullOrWhiteSpace(candidate.Name) || string.IsNullOrWhiteSpace(candidate.CVText))
                    return Results.BadRequest(new { message = "JobId, Name, and CV Text are required." });

                var jobOwned = await context.Jobs.AnyAsync(j => j.Id == candidate.JobId && j.CreatedByUserId == userId);
                if (!jobOwned)
                    return Results.NotFound(new { message = $"Job with ID {candidate.JobId} not found." });

                // Prevent duplicates
                var exists = await context.Candidates
                    .AnyAsync(c => c.JobId == candidate.JobId && c.Name.ToLower() == candidate.Name.ToLower());

                if (exists)
                    return Results.BadRequest(new { message = $"Candidate '{candidate.Name}' already exists for this job." });

                candidate.Id = 0;
                context.Candidates.Add(candidate);
                await context.SaveChangesAsync();

                return Results.Created($"/api/candidates/{candidate.Id}", new
                {
                    message = "Candidate uploaded successfully",
                    candidate
                });
            })
            .WithName("CreateCandidate");

            // Get All Candidates - only for jobs owned by the current user
            group.MapGet("/", async (ClaimsPrincipal user, AppDbContext context) =>
            {
                var userId = GetUserId(user);

                var candidates = await context.Candidates
                    .Include(c => c.Job)
                    .Where(c => c.Job.CreatedByUserId == userId)
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

            // Get Candidates by Job - only if the job is owned by the current user
            group.MapGet("/by-job", async (int jobId, ClaimsPrincipal user, AppDbContext context) =>
            {
                var userId = GetUserId(user);

                if (jobId <= 0)
                    return Results.BadRequest(new { message = "Invalid Job ID." });

                var jobOwned = await context.Jobs.AnyAsync(j => j.Id == jobId && j.CreatedByUserId == userId);
                if (!jobOwned)
                    return Results.NotFound(new { message = $"Job with ID {jobId} not found." });

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

            // Get Single Candidate - only if owned by the current user
            group.MapGet("/{id}", async (int id, ClaimsPrincipal user, AppDbContext context) =>
            {
                var userId = GetUserId(user);

                var candidate = await context.Candidates
                    .Include(c => c.Job)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (candidate == null || candidate.Job.CreatedByUserId != userId)
                    return Results.NotFound(new { message = $"Candidate with ID {id} not found." });

                return Results.Ok(new { message = "Success", candidate });
            })
            .WithName("GetCandidateById");

            // Delete Candidate - only if owned by the current user
            group.MapDelete("/{id}", async (int id, ClaimsPrincipal user, AppDbContext context) =>
            {
                var userId = GetUserId(user);

                var candidate = await context.Candidates
                    .Include(c => c.Job)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (candidate == null || candidate.Job.CreatedByUserId != userId)
                    return Results.NotFound(new { message = $"Candidate with ID {id} not found." });

                context.Candidates.Remove(candidate);
                await context.SaveChangesAsync();

                return Results.Ok(new { message = "Candidate deleted successfully" });
            })
            .WithName("DeleteCandidate");
        }
    }
}
