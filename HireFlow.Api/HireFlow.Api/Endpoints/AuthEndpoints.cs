using HireFlow.Api.Auth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using System.Security.Claims;

namespace HireFlow.Api.Endpoints
{
    public static class AuthEndpoints
    {
        public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/api/auth");

            // 1. Start Google OAuth Login
            group.MapGet("/google-login", async (HttpContext context) =>
            {
                await context.ChallengeAsync(GoogleDefaults.AuthenticationScheme, new AuthenticationProperties
                {
                    RedirectUri = "/api/auth/google-callback"
                });
            })
            .WithName("GoogleLogin");

            // 2. Google Callback
            group.MapGet("/google-callback", async (HttpContext context, IAuthService authService) =>
            {
                var result = await context.AuthenticateAsync(GoogleDefaults.AuthenticationScheme);

                if (!result.Succeeded)
                {
                    Console.WriteLine($"Google Auth Failed: {result.Failure?.Message}");

                    // Fallback: Mock login for development
                    var googleToken = authService.GenerateJwtToken("dev-user", "dev@example.com", "Development User");
                    context.Response.Cookies.Append("authToken", googleToken, new CookieOptions
                    {
                        HttpOnly = true,
                        Secure = true,
                        SameSite = SameSiteMode.Strict,
                        Expires = DateTime.UtcNow.AddHours(2)
                    });

                    return Results.Redirect("http://localhost:5173"); // Your React port
                }

                var claims = result.Principal.Claims.ToList();
                var userId = claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value ?? "google-user";
                var email = claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value ?? "";
                var name = claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value ?? "User";

                var token = authService.GenerateJwtToken(userId, email, name);

                context.Response.Cookies.Append("authToken", token, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Strict,
                    Expires = DateTime.UtcNow.AddHours(2)
                });

                return Results.Redirect("http://localhost:5173");
            })
            .WithName("GoogleCallback");

            // 3. Mock Login 
            group.MapGet("/mock-login", (HttpContext context, IAuthService authService) =>
            {
                var token = authService.GenerateJwtToken("mock-user", "mock@example.com", "Mock User");

                context.Response.Cookies.Append("authToken", token, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Strict,
                    Expires = DateTime.UtcNow.AddHours(2)
                });

                return Results.Ok(new { 
                    message = "Mock login successful",
                    token = token,
                });
            })
            .WithName("MockLogin");

            // 4. Logout
            group.MapPost("/logout", (HttpContext context) =>
            {
                context.Response.Cookies.Delete("authToken");
                return Results.Ok(new { message = "Logged out successfully" });
            })
            .WithName("Logout");
        }
    }
}