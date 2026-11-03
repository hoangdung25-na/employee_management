using System.Security.Claims;
using EmployeeManagement.Domain.Users.Entities;

namespace EmployeeManagement.Application.Interfaces;

/// <summary>
/// Result returned when generating a JWT Access Token.
/// </summary>
public record JwtTokenResult(string AccessToken, DateTime ExpiresAtUtc);

/// <summary>
/// Abstraction for generating JWT Access Tokens, Refresh Tokens, and extracting claims from expired tokens.
/// </summary>
public interface IJwtTokenGenerator
{
    JwtTokenResult GenerateAccessToken(
        User user,
        string fullName,
        IReadOnlyCollection<string> roles,
        IReadOnlyCollection<string> permissions);

    string GenerateRefreshToken();

    int GetRefreshTokenExpirationDays();

    ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
}

