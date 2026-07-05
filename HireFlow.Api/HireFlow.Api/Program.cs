using HireFlow.Api.Data;
using HireFlow.Api.Endpoints;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

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
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

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

app.Run();