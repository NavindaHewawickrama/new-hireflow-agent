using HireFlow.Api.Auth;
using HireFlow.Api.Data;
using HireFlow.Api.DTOs;
using HireFlow.Api.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HireFlow.Api.Endpoints
{
    public static class AuthEndpoints
    {
        public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/api/auth");

            // Register
            group.MapPost("/register", async (RegisterDto dto, AppDbContext context, IAuthService authService) =>
            {
                if (await context.Users.AnyAsync(u => u.Email == dto.Email))
                    return Results.BadRequest(new { message = "Email already exists" });

                var user = new User
                {
                    Email = dto.Email,
                    Name = dto.Name,
                    PasswordHash = authService.HashPassword(dto.Password)
                };

                context.Users.Add(user);
                await context.SaveChangesAsync();

                return Results.Ok(new { message = "User registered successfully" });
            })
            .WithName("Register");

            // Login with Email + Password
            group.MapPost("/login", async (LoginDto dto, AppDbContext db, IAuthService authService, HttpContext httpContext) =>
            {
                var user = await db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);

                if (user == null || !authService.VerifyPassword(dto.Password, user.PasswordHash))
                    return Results.BadRequest(new {message = "Invalid Username or password!!"});

                var generatedToken = authService.GenerateJwtToken(user.Id.ToString(), user.Email, user.Name);

                httpContext.Response.Cookies.Append("authToken", generatedToken, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Strict,
                    Expires = DateTime.UtcNow.AddHours(2)
                });

                return Results.Ok(new
                {
                    message = "Login successful",
                    user = new { user.Id, user.Name, user.Email },
                    token = generatedToken
                });
            })
            .WithName("Login");

            // Google Login (keep existing)
            group.MapGet("/google-login", async (HttpContext context) =>
            {
                await context.ChallengeAsync(GoogleDefaults.AuthenticationScheme, new AuthenticationProperties
                {
                    RedirectUri = "/api/auth/google-callback"
                });
            })
            .WithName("GoogleLogin");

            // Google Callback (keep existing)
            group.MapGet("/google-callback", async (HttpContext context, IAuthService authService) =>
            {
                var result = await context.AuthenticateAsync(GoogleDefaults.AuthenticationScheme);

                if (!result.Succeeded)
                {
                    // Fallback to mock
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

                return Results.Redirect("http://localhost:5173");
            })
            .WithName("GoogleCallback");

            // Mock Login
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

                return Results.Ok(new { message = "Mock login successful", token });
            })
            .WithName("MockLogin");

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