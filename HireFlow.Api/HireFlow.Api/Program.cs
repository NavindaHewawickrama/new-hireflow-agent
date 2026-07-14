using HireFlow.Api.Data;
using HireFlow.Api.Endpoints;
using Microsoft.EntityFrameworkCore;
using HireFlow.Api.Services;

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

// Register DbContext with PostgreSQL
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register AI Service
builder.Services.AddSingleton<IAiProvider, GeminiAiProvider>();
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

app.Run();