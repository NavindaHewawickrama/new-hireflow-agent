using HireFlow.Api.Data;
using HireFlow.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;   // ← Added for logging

namespace HireFlow.Api.Endpoints
{
    public static class OfferEndpoints
    {
        public static void MapOfferEndpoints(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/api/offers");

            // Generate Offer Letter
            group.MapPost("/{candidateId}", async (int candidateId, AppDbContext context, ILogger<Program> logger) =>
            {
                logger.LogInformation("Offer letter generation requested for CandidateId: {CandidateId}", candidateId);   // ← Log

                var candidate = await context.Candidates
                    .Include(c => c.Job)
                    .FirstOrDefaultAsync(c => c.Id == candidateId);

                if (candidate == null || candidate.Job == null)
                {
                    logger.LogWarning("Offer generation failed - Candidate or Job not found. CandidateId: {CandidateId}", candidateId);   // ← Log
                    return Results.NotFound(new { message = "Candidate or Job not found." });
                }

                if (candidate.Status != "r2-advanced")
                {
                    logger.LogWarning("Offer generation failed - Candidate not in r2-advanced status. Current status: {Status}", candidate.Status);   // ← Log
                    return Results.BadRequest(new { message = "Candidate must be r2-advanced to generate offer." });
                }

                // Mock Offer Letter (replace with real AI later)
                candidate.OfferLetter = $@"
Dear {candidate.Name},

We are pleased to offer you the position of {candidate.Job.Title} at our company.

Salary: {candidate.Job.SalaryRange}
Start Date: August 1, 2026

We look forward to welcoming you to the team.

Best regards,
HR Team";

                await context.SaveChangesAsync();

                logger.LogInformation("Offer letter generated successfully for CandidateId: {CandidateId}, Name: {Name}",
                    candidateId, candidate.Name);   // ← Log

                return Results.Ok(new
                {
                    message = "Offer letter generated successfully",
                    offerLetter = candidate.OfferLetter
                });
            })
            .WithName("GenerateOffer");
        }
    }
}