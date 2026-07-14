using HireFlow.Api.Data;
using HireFlow.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HireFlow.Api.Endpoints
{
    public static class JobEndpoints
    {
        public static void MapJobEndpoints(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/api/jobs");

            // Create Job
            group.MapPost("/", async (Job job, AppDbContext context) =>
            {
                if (string.IsNullOrWhiteSpace(job.Title) || string.IsNullOrWhiteSpace(job.Description))
                    return Results.BadRequest(new { message = "Job Title and Description are required." });

                // Prevent duplicate by title
                var exists = await context.Jobs.AnyAsync(j => j.Title.ToLower() == job.Title.ToLower());

                if (exists)
                    return Results.BadRequest(new { message = $"Job '{job.Title}' already exists." });

                context.Jobs.Add(job);
                await context.SaveChangesAsync();

                return Results.Created($"/api/jobs/by-id?jobId={job.Id}", new
                {
                    message = "Job created successfully",
                    job
                });
            })
            .WithName("CreateJob");

            // Get All Jobs
            group.MapGet("/", async (AppDbContext context) =>
            {
                var jobs = await context.Jobs
                    .OrderByDescending(j => j.CreatedAt)
                    .ToListAsync();

                return Results.Ok(new
                {
                    message = jobs.Any() ? "Success" : "No jobs found",
                    count = jobs.Count,
                    jobs
                });
            })
            .WithName("GetAllJobs");

            // Get Job by ID
            group.MapGet("/by-id", async (int jobId, AppDbContext context) =>
            {
                if (jobId <= 0)
                    return Results.BadRequest(new { message = "Invalid Job ID." });

                var job = await context.Jobs.FindAsync(jobId);

                if (job == null)
                    return Results.NotFound(new { message = $"Job with ID {jobId} not found." });

                return Results.Ok(new { message = "Success", job });
            })
            .WithName("GetJobById");

            // Delete Job
            group.MapDelete("/{id}", async (int id, AppDbContext context) =>
            {
                var job = await context.Jobs.FindAsync(id);
                if (job == null)
                    return Results.NotFound(new { message = $"Job with ID {id} not found." });

                context.Jobs.Remove(job);
                await context.SaveChangesAsync();

                return Results.Ok(new { message = "Job deleted successfully" });
            })
            .WithName("DeleteJob");
        }
    }
}