using HireFlow.Api.Data;
using HireFlow.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;   // ← Added for logging

namespace HireFlow.Api.Endpoints
{
    public static class JobEndpoints
    {
        public static void MapJobEndpoints(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/api/jobs");

            // Create Job - Protected
            group.MapPost("/", [Authorize] async (Job job, AppDbContext context, ILogger<Program> logger) =>
            {
                logger.LogInformation("Job creation attempt. Title: {Title}", job.Title);   // ← Log

                if (string.IsNullOrWhiteSpace(job.Title) || string.IsNullOrWhiteSpace(job.Description))
                {
                    logger.LogWarning("Job creation failed - Missing title or description");   // ← Log
                    return Results.BadRequest(new { message = "Job Title and Description are required." });
                }

                var exists = await context.Jobs.AnyAsync(j => j.Title.ToLower() == job.Title.ToLower());

                if (exists)
                {
                    logger.LogWarning("Duplicate job title detected: {Title}", job.Title);   // ← Log
                    return Results.BadRequest(new { message = $"Job '{job.Title}' already exists." });
                }

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

            // Get All Jobs - Public for now
            group.MapGet("/", async (AppDbContext context, ILogger<Program> logger) =>
            {
                logger.LogInformation("Fetching all jobs");   // ← Log

                var jobs = await context.Jobs
                    .OrderByDescending(j => j.CreatedAt)
                    .ToListAsync();

                logger.LogInformation("Retrieved {Count} jobs", jobs.Count);   // ← Log

                return Results.Ok(new
                {
                    message = jobs.Any() ? "Success" : "No jobs found",
                    count = jobs.Count,
                    jobs
                });
            })
            .WithName("GetAllJobs");

            // Get Job by ID - Public
            group.MapGet("/by-id", async (int jobId, AppDbContext context, ILogger<Program> logger) =>
            {
                logger.LogInformation("Fetching job by ID: {JobId}", jobId);   // ← Log

                if (jobId <= 0)
                    return Results.BadRequest(new { message = "Invalid Job ID." });

                var job = await context.Jobs.FindAsync(jobId);

                if (job == null)
                {
                    logger.LogWarning("Job not found with ID: {JobId}", jobId);   // ← Log
                    return Results.NotFound(new { message = $"Job with ID {jobId} not found." });
                }

                logger.LogInformation("Job found: {Title} (ID: {JobId})", job.Title, job.Id);   // ← Log

                return Results.Ok(new { message = "Success", job });
            })
            .WithName("GetJobById");

            // Delete Job - Protected
            group.MapDelete("/{id}", [Authorize] async (int id, AppDbContext context, ILogger<Program> logger) =>
            {
                logger.LogInformation("Job deletion attempt. ID: {JobId}", id);   // ← Log

                var job = await context.Jobs.FindAsync(id);
                if (job == null)
                {
                    logger.LogWarning("Delete failed - Job not found. ID: {JobId}", id);   // ← Log
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