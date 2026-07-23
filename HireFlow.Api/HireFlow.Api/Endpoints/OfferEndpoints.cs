using HireFlow.Api.Data;
using HireFlow.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;   // ← Added for logging
using System.Security.Claims;

namespace HireFlow.Api.Endpoints
{
    public static class OfferEndpoints
    {
        private static int GetUserId(ClaimsPrincipal user) =>
            int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);

        public static void MapOfferEndpoints(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/api/offers").RequireAuthorization();

            // Generate Offer Letter - only if the candidate's job is owned by the current user
            group.MapPost("/{candidateId}", async (int candidateId, ClaimsPrincipal user, AppDbContext context, IAiService aiService, ILogger<Program> logger) =>
            {
                var userId = GetUserId(user);
                logger.LogInformation("Offer letter generation requested for CandidateId: {CandidateId} by UserId: {UserId}", candidateId, userId);   // ← Log

                var candidate = await context.Candidates
                    .Include(c => c.Job)
                    .FirstOrDefaultAsync(c => c.Id == candidateId);

                if (candidate == null || candidate.Job.CreatedByUserId != userId)
                {
                    logger.LogWarning("Offer generation failed - Candidate not found or not owned. CandidateId: {CandidateId}, UserId: {UserId}", candidateId, userId);   // ← Log
                    return Results.NotFound(new { message = "Candidate not found." });
                }

                if (candidate.Status != "r2-advanced")
                {
                    logger.LogWarning("Offer generation failed - Candidate not in r2-advanced status. Current status: {Status}", candidate.Status);   // ← Log
                    return Results.BadRequest(new { message = "Candidate must be r2-advanced to generate offer." });
                }

                var letter = await aiService.GenerateOfferLetterAsync(candidate);
                if (letter == null)
                {
                    logger.LogError("Offer letter generation failed for CandidateId: {CandidateId}", candidateId);   // ← Log
                    return Results.Problem("Failed to generate offer letter. Please try again.", statusCode: 502);
                }

                candidate.OfferLetter = letter;
                candidate.UpdatedAt = DateTime.UtcNow;
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
