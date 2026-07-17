using HireFlow.Api.Auth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HireFlow.Api.Endpoints
{
    public static class AuthEndpoints
    {
        public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/api/auth");

            // Google Login
            group.MapGet("/google-login", async (HttpContext context) =>
            {
                await context.ChallengeAsync(GoogleDefaults.AuthenticationScheme, new AuthenticationProperties
                {
                    RedirectUri = "/api/auth/google-callback"
                });
            })
            .WithName("GoogleLogin");

            // Google Callback
            group.MapGet("/google-callback", async (HttpContext context, IAuthService authService) =>
            {
                var result = await context.AuthenticateAsync(GoogleDefaults.AuthenticationScheme);

                if (result.Succeeded)
                {
                    var claims = result.Principal.Claims;
                    var userId = claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
                    var email = claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
                    var name = claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value;

                    var token = authService.GenerateJwtToken(userId ?? "", email ?? "", name ?? "");

                    // Set HttpOnly cookie
                    context.Response.Cookies.Append("authToken", token, new CookieOptions
                    {
                        HttpOnly = true,
                        Secure = true,
                        SameSite = SameSiteMode.Strict,
                        Expires = DateTime.UtcNow.AddHours(1)
                    });

                    return Results.Redirect("/"); // Redirect to frontend
                }

                return Results.BadRequest(new { message = "Google login failed" });
            })
            .WithName("GoogleCallback");

            // Logout
            group.MapPost("/logout", (HttpContext context) =>
            {
                context.Response.Cookies.Delete("authToken");
                return Results.Ok(new { message = "Logged out successfully" });
            })
            .WithName("Logout");
        }
    }
}