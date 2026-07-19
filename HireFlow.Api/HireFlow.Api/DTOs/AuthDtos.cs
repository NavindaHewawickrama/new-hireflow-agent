namespace HireFlow.Api.DTOs
{
    public class AuthDtos
    {
    }

    public record RegisterDto(string Email, string Name, string Password);
    public record LoginDto(string Email, string Password);
}
