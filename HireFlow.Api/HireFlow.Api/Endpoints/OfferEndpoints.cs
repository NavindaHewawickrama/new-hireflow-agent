using HireFlow.Api.Data;
using HireFlow.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HireFlow.Api.Endpoints
{
    public static class OfferEndpoints
    {
        public static void MapOfferEndpoints(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/api/offers");

            // Generate Offer Letter
            group.MapPost("/{candidateId}", async (int candidateId, AppDbContext context) =>
            {
                var candidate = await context.Candidates
                    .Include(c => c.Job)
                    .FirstOrDefaultAsync(c => c.Id == candidateId);

                if (candidate == null || candidate.Job == null)
                    return Results.NotFound(new { message = "Candidate or Job not found." });

                if (candidate.Status != "r2-advanced")
                    return Results.BadRequest(new { message = "Candidate must be r2-advanced to generate offer." });

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