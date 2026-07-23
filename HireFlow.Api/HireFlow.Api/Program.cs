using HireFlow.Api.Data;
using HireFlow.Api.Endpoints;
using Microsoft.EntityFrameworkCore;
using HireFlow.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using HireFlow.Api.Auth;
using Microsoft.AspNetCore.Authentication.Google;
using Serilog;
using System.Net;
using System.Net.Sockets;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddUserSecrets<Program>();

//configure serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .MinimumLevel.Information()
    .WriteTo.Console()
    .WriteTo.File("logs/HireFlow_.log",
        rollingInterval: RollingInterval.Day,     // New file every day
        retainedFileCountLimit: 30,               // Keep last 30 days
        shared: true,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{NewLine}{Exception}")
    .CreateLogger();

builder.Host.UseSerilog();

//add CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
        .AllowAnyMethod()
        .AllowAnyHeader();
    });
});

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

    // JWT Authentication for Swagger
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "Enter JWT token in format: Bearer {token}",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

//authentication setup
var googleClientId = builder.Configuration["Authentication:Google:ClientId"];
var googleClientSecret = builder.Configuration["Authentication:Google:ClientSecret"];
var googleConfigured = !string.IsNullOrWhiteSpace(googleClientId) && !string.IsNullOrWhiteSpace(googleClientSecret);

var authBuilder = builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
    .AddJwtBearer(options =>
    {
        var jwt = builder.Configuration.GetSection("Authentication:Jwt").Get<JwtOptions>();
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
    });

// AddGoogle() validates ClientId/ClientSecret eagerly on every request that
// touches auth, not just Google-specific ones - registering it unconditionally
// means the whole API 500s on every request in any environment that hasn't
// configured Google OAuth. Only wire it up when it's actually configured.
if (googleConfigured)
{
    authBuilder.AddGoogle(options =>
    {
        options.ClientId = googleClientId!;
        options.ClientSecret = googleClientSecret!;
    });
}

builder.Services.AddAuthorization();

// Add Auth Service
builder.Services.AddSingleton<IAuthService, AuthService>();

// Register DbContext with PostgreSQL
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register AI Service
// The "Gemini" client forces IPv4: on networks where IPv6 is advertised via DNS
// but doesn't actually route (common with some ISPs/VPNs), HttpClient's default
// Happy Eyeballs behavior tries IPv6 first and eats the whole request timeout
// before falling back to IPv4 - even though IPv4 alone connects instantly.
builder.Services.AddHttpClient("Gemini", client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
})
.ConfigurePrimaryHttpMessageHandler(() => new SocketsHttpHandler
{
    ConnectTimeout = TimeSpan.FromSeconds(15),
    ConnectCallback = async (context, cancellationToken) =>
    {
        var addresses = await Dns.GetHostAddressesAsync(
            context.DnsEndPoint.Host, AddressFamily.InterNetwork, cancellationToken);

        var socket = new Socket(SocketType.Stream, ProtocolType.Tcp) { NoDelay = true };
        try
        {
            await socket.ConnectAsync(addresses[0], context.DnsEndPoint.Port, cancellationToken);
            return new NetworkStream(socket, ownsSocket: true);
        }
        catch
        {
            socket.Dispose();
            throw;
        }
    }
});
builder.Services.AddSingleton<IAiService, AiService>();

var app = builder.Build();

// Apply pending EF Core migrations on startup. Keeps the container image
// free of the EF CLI tooling - the published runtime image can't run
// `dotnet ef database update` itself, so the app does it in-process instead.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

// Use CORS (before Authentication)
app.UseCors("AllowAll");



// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

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