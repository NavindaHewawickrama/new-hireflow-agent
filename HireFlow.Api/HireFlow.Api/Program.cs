using HireFlow.Api.Data;
using HireFlow.Api.Endpoints;
using Microsoft.EntityFrameworkCore;
using HireFlow.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using HireFlow.Api.Auth;
using Microsoft.AspNetCore.Authentication.Google;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddUserSecrets<Program>();

// Add services to the container
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "HireFlow API",
        Version = "v1",
        Description = "AI-Powered Recruitment Pipeline API",
        Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name = "Navinda",
            Email = "hewawickraman@gmail.com"
        }
    });
});

//authentication setup
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultAuthenticateScheme = GoogleDefaults.AuthenticationScheme;
})
    .AddJwtBearer(options =>
    {
        var jwt = builder.Configuration.GetSection("Jwt").Get<JwtOptions>();
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key))
        };
    })
    .AddGoogle(options =>
    {
        options.ClientId = builder.Configuration["Authentication:Google:ClientId"];
        options.ClientSecret = builder.Configuration["Authentication:Google:ClientSecret"];
    });

// Add Auth Service
builder.Services.AddSingleton<IAuthService, AuthService>();

// Register DbContext with PostgreSQL
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register AI Service
//builder.Services.AddSingleton<IAiProvider, GeminiAiProvider>();
builder.Services.AddSingleton<IAiService, AiService>();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Simple test endpoint
app.MapGet("/", () => "HireFlow API is running!");

//register endpoints
app.MapJobEndpoints();
app.MapCandidateEndpoints();
app.MapAiEndpoints();
app.MapInterviewEndpoints();
app.MapOfferEndpoints();
app.MapAuthEndpoints();

app.Run();