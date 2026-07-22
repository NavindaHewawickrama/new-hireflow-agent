using HireFlow.Api.Data;
using HireFlow.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;   // ← Added for logging
using System.Security.Claims;

namespace HireFlow.Api.Endpoints
{
    public static class JobEndpoints
    {
        private static int GetUserId(ClaimsPrincipal user) =>
            int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);

        public static void MapJobEndpoints(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/api/jobs").RequireAuthorization();

            // Create Job
            group.MapPost("/", async (Job job, ClaimsPrincipal user, AppDbContext context, ILogger<Program> logger) =>
            {
                var userId = GetUserId(user);
                logger.LogInformation("Job creation attempt. Title: {Title}, UserId: {UserId}", job.Title, userId);   // ← Log

                if (string.IsNullOrWhiteSpace(job.Title) || string.IsNullOrWhiteSpace(job.Description))
                {
                    logger.LogWarning("Job creation failed - Missing title or description");   // ← Log
                    return Results.BadRequest(new { message = "Job Title and Description are required." });
                }

                var exists = await context.Jobs.AnyAsync(j =>
                    j.CreatedByUserId == userId && j.Title.ToLower() == job.Title.ToLower());

                if (exists)
                {
                    logger.LogWarning("Duplicate job title detected for user {UserId}: {Title}", userId, job.Title);   // ← Log
                    return Results.BadRequest(new { message = $"Job '{job.Title}' already exists." });
                }

                job.Id = 0;
                job.CreatedByUserId = userId;
                context.Jobs.Add(job);
                await context.SaveChangesAsync();

                logger.LogInformation("Job created successfully. ID: {JobId}, Title: {Title}", job.Id, job.Title);   // ← Log

                return Results.Created($"/api/jobs/by-id?jobId={job.Id}", new
                {
                    message = "Job created successfully",
                    job
                });
            })
            .WithName("CreateJob");

            // Get All Jobs - only jobs created by the current user
            group.MapGet("/", async (ClaimsPrincipal user, AppDbContext context, ILogger<Program> logger) =>
            {
                var userId = GetUserId(user);
                logger.LogInformation("Fetching jobs for user {UserId}", userId);   // ← Log

                var jobs = await context.Jobs
                    .Where(j => j.CreatedByUserId == userId)
                    .OrderByDescending(j => j.CreatedAt)
                    .ToListAsync();

                logger.LogInformation("Retrieved {Count} jobs for user {UserId}", jobs.Count, userId);   // ← Log

                return Results.Ok(new
                {
                    message = jobs.Any() ? "Success" : "No jobs found",
                    count = jobs.Count,
                    jobs
                });
            })
            .WithName("GetAllJobs");

            // Get Job by ID - only if owned by the current user
            group.MapGet("/by-id", async (int jobId, ClaimsPrincipal user, AppDbContext context, ILogger<Program> logger) =>
            {
                var userId = GetUserId(user);
                logger.LogInformation("Fetching job by ID: {JobId} for user {UserId}", jobId, userId);   // ← Log

                if (jobId <= 0)
                    return Results.BadRequest(new { message = "Invalid Job ID." });

                var job = await context.Jobs.FindAsync(jobId);

                if (job == null || job.CreatedByUserId != userId)
                {
                    logger.LogWarning("Job not found or not owned by user. ID: {JobId}, UserId: {UserId}", jobId, userId);   // ← Log
                    return Results.NotFound(new { message = $"Job with ID {jobId} not found." });
                }

                logger.LogInformation("Job found: {Title} (ID: {JobId})", job.Title, job.Id);   // ← Log

                return Results.Ok(new { message = "Success", job });
            })
            .WithName("GetJobById");

            // Update Job - only if owned by the current user
            group.MapPut("/{id}", async (int id, Job updated, ClaimsPrincipal user, AppDbContext context, ILogger<Program> logger) =>
            {
                var userId = GetUserId(user);
                logger.LogInformation("Job update attempt. ID: {JobId}, UserId: {UserId}", id, userId);   // ← Log

                if (string.IsNullOrWhiteSpace(updated.Title) || string.IsNullOrWhiteSpace(updated.Description))
                {
                    logger.LogWarning("Job update failed - Missing title or description");   // ← Log
                    return Results.BadRequest(new { message = "Job Title and Description are required." });
                }

                var job = await context.Jobs.FindAsync(id);
                if (job == null || job.CreatedByUserId != userId)
                {
                    logger.LogWarning("Update failed - Job not found or not owned. ID: {JobId}, UserId: {UserId}", id, userId);   // ← Log
                    return Results.NotFound(new { message = $"Job with ID {id} not found." });
                }

                job.Title = updated.Title;
                job.Department = updated.Department;
                job.Description = updated.Description;
                job.Skills = updated.Skills;
                job.Qualifications = updated.Qualifications;
                job.SalaryRange = updated.SalaryRange;
                job.Threshold = updated.Threshold;
                job.UpdatedAt = DateTime.UtcNow;

                await context.SaveChangesAsync();

                logger.LogInformation("Job updated successfully. ID: {JobId}, Title: {Title}", job.Id, job.Title);   // ← Log

                return Results.Ok(new { message = "Job updated successfully", job });
            })
            .WithName("UpdateJob");

            // Delete Job - only if owned by the current user
            group.MapDelete("/{id}", async (int id, ClaimsPrincipal user, AppDbContext context, ILogger<Program> logger) =>
            {
                var userId = GetUserId(user);
                logger.LogInformation("Job deletion attempt. ID: {JobId}, UserId: {UserId}", id, userId);   // ← Log

                var job = await context.Jobs.FindAsync(id);
                if (job == null || job.CreatedByUserId != userId)
                {
                    logger.LogWarning("Delete failed - Job not found or not owned. ID: {JobId}, UserId: {UserId}", id, userId);   // ← Log
                    return Results.NotFound(new { message = $"Job with ID {id} not found." });
                }

                context.Jobs.Remove(job);
                await context.SaveChangesAsync();

                logger.LogInformation("Job deleted successfully. ID: {JobId}, Title: {Title}", id, job.Title);   // ← Log

                return Results.Ok(new { message = "Job deleted successfully" });
            })
            .WithName("DeleteJob");
        }
    }
}
