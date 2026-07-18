using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace HireFlow.Api.Auth
{
    public interface IAuthService
    {
        string GenerateJwtToken(string userId, string email, string name);
    }

    public class AuthService : IAuthService
    {
        private readonly JwtOptions _jwtOptions;

        public AuthService(IConfiguration configuration)
        {
            var options = configuration.GetSection("Authentication:Jwt").Get<JwtOptions>() ?? new JwtOptions();

            if (options == null ||
                string.IsNullOrWhiteSpace(options.Key) ||
                string.IsNullOrWhiteSpace(options.Issuer) ||
                string.IsNullOrWhiteSpace(options.Audience))
            {
                throw new InvalidOperationException("JWT configuration is missing.");
            }

            _jwtOptions = options;
        }

        public string GenerateJwtToken(string userId, string email, string name)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Email, email),
                new Claim(ClaimTypes.Name, name)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.Key));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _jwtOptions.Issuer,
                audience: _jwtOptions.Audience,
                claims: claims,
                expires: DateTime.Now.AddMinutes(_jwtOptions.ExpiryMinutes),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}