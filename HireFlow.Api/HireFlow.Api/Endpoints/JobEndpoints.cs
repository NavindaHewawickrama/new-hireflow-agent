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

            // Create a new Job
            group.MapPost("/", async (Job job, AppDbContext context) =>
            {
                if(string.IsNullOrWhiteSpace(job.Title) || string.IsNullOrWhiteSpace(job.Description))
                    return Results.BadRequest(new { message = "Job Title and Description are required." });

                context.Jobs.Add(job);
                await context.SaveChangesAsync();

                return Results.Created($"/api/jobs/by-id?jobId={job.Id}", new
                {
                    message = "Job created successfully",
                    job
                });
            })
            .WithName("CreateJob");

            // Get all Jobs
            group.MapGet("/", async (AppDbContext context) =>
            {
                var jobs = await context.Jobs
                    .OrderByDescending(j=>j.CreatedAt)
                    .ToListAsync();
                return Results.Ok(new { message = "Success", count = jobs.Count, jobs });
            })
            .WithName("GetAllJobs");

            // Get Job by ID
            group.MapGet("/by-id", async (int jobId, AppDbContext context) =>
            {
                if(jobId <= 0)
                    return Results.BadRequest(new { message = "Invalid Job ID." });

                var job = await context.Jobs.FindAsync(jobId);

                if (job == null)
                    return Results.NotFound(new { message = $"Job with ID {jobId} not found." });

                return Results.Ok(new { message = "Success", job });
            })
            .WithName("GetJobById");
        }
    }
}