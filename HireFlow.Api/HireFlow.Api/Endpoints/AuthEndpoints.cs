using HireFlow.Api.Auth;
using HireFlow.Api.Data;
using HireFlow.Api.DTOs;
using HireFlow.Api.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;        // ← Added for logging
using System.Security.Claims;

namespace HireFlow.Api.Endpoints
{
    public static class AuthEndpoints
    {
        public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/api/auth");

            // Register
            group.MapPost("/register", async (RegisterDto dto, AppDbContext context, IAuthService authService, ILogger<Program> logger) =>
            {
                logger.LogInformation("Registration attempt for email: {Email}", dto.Email);   // ← Log

                if (await context.Users.AnyAsync(u => u.Email == dto.Email))
                {
                    logger.LogWarning("Registration failed - Email already exists: {Email}", dto.Email);   // ← Log
                    return Results.BadRequest(new { message = "Email already exists" });
                }

                var user = new User
                {
                    Email = dto.Email,
                    Name = dto.Name,
                    PasswordHash = authService.HashPassword(dto.Password)
                };

                context.Users.Add(user);
                await context.SaveChangesAsync();

                logger.LogInformation("User registered successfully: {Email}", dto.Email);   // ← Log

                return Results.Ok(new { message = "User registered successfully" });
            })
            .WithName("Register");

            // Login with Email + Password
            group.MapPost("/login", async (LoginDto dto, AppDbContext db, IAuthService authService, HttpContext httpContext, ILogger<Program> logger) =>
            {
                logger.LogInformation("Login attempt for email: {Email}", dto.Email);   // ← Log

                var user = await db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);

                if (user == null || !authService.VerifyPassword(dto.Password, user.PasswordHash))
                {
                    logger.LogWarning("Failed login attempt for email: {Email}", dto.Email);   // ← Log
                    return Results.BadRequest(new { message = "Invalid Username or password!!" });
                }

                var generatedToken = authService.GenerateJwtToken(user.Id.ToString(), user.Email, user.Name);

                httpContext.Response.Cookies.Append("authToken", generatedToken, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Strict,
                    Expires = DateTime.UtcNow.AddHours(2)
                });

                logger.LogInformation("User logged in successfully: {Email} (ID: {UserId})", user.Email, user.Id);   // ← Log

                return Results.Ok(new
                {
                    message = "Login successful",
                    user = new { user.Id, user.Name, user.Email },
                    token = generatedToken
                });
            })
            .WithName("Login");

            // Google Login
            group.MapGet("/google-login", async (HttpContext context, ILogger<Program> logger) =>
            {
                logger.LogInformation("Google login flow started");   // ← Log
                await context.ChallengeAsync(GoogleDefaults.AuthenticationScheme, new AuthenticationProperties
                {
                    RedirectUri = "/api/auth/google-callback"
                });
            })
            .WithName("GoogleLogin");

            // Google Callback
            group.MapGet("/google-callback", async (HttpContext context, IAuthService authService, ILogger<Program> logger) =>
            {
                logger.LogInformation("Google callback received");   // ← Log

                var result = await context.AuthenticateAsync(GoogleDefaults.AuthenticationScheme);

                if (!result.Succeeded)
                {
                    logger.LogWarning("Google authentication failed");   // ← Log
                    var tokenNew = authService.GenerateJwtToken("dev-user", "dev@example.com", "Development User");
                    context.Response.Cookies.Append("authToken", tokenNew, new CookieOptions { HttpOnly = true, Secure = true, SameSite = SameSiteMode.Strict, Expires = DateTime.UtcNow.AddHours(2) });
                    return Results.Redirect("http://localhost:5173");
                }

                var claims = result.Principal.Claims.ToList();
                var userId = claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value ?? "google-user";
                var email = claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value ?? "";
                var name = claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value ?? "User";

                var token = authService.GenerateJwtToken(userId, email, name);

                context.Response.Cookies.Append("authToken", token, new CookieOptions { HttpOnly = true, Secure = true, SameSite = SameSiteMode.Strict, Expires = DateTime.UtcNow.AddHours(2) });

                logger.LogInformation("Google login successful for user: {Email}", email);   // ← Log

                return Results.Redirect("http://localhost:5173");
            })
            .WithName("GoogleCallback");

            // Mock Login
            group.MapGet("/mock-login", (HttpContext context, IAuthService authService, ILogger<Program> logger) =>
            {
                logger.LogInformation("Mock login used");   // ← Log

                var token = authService.GenerateJwtToken("mock-user", "mock@example.com", "Mock User");

                context.Response.Cookies.Append("authToken", token, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Strict,
                    Expires = DateTime.UtcNow.AddHours(2)
                });

                return Results.Ok(new { message = "Mock login successful", token });
            })
            .WithName("MockLogin");

            // Logout
            group.MapPost("/logout", (HttpContext context, ILogger<Program> logger) =>
            {
                logger.LogInformation("User logged out");   // ← Log
                context.Response.Cookies.Delete("authToken");
                return Results.Ok(new { message = "Logged out successfully" });
            })
            .WithName("Logout");
        }
    }
}