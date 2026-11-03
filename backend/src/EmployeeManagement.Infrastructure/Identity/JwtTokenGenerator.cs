using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Domain.Users.Entities;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace EmployeeManagement.Infrastructure.Identity;

/// <summary>
/// Generates JWT Access Tokens (with 5-Role RBAC & ESS employeeId claims) and Refresh Tokens.
/// </summary>
public class JwtTokenGenerator : IJwtTokenGenerator
{
    public const string EmployeeIdClaimType = "employeeId";
    public const string RoleClaimType = "roles";
    public const string PermissionClaimType = "permissions";
    public const string SecurityStampClaimType = "securityStamp";
    public const string UsernameClaimType = "username";

    private readonly JwtSettings _jwtSettings;

    public JwtTokenGenerator(IOptions<JwtSettings> jwtOptions)
    {
        _jwtSettings = jwtOptions.Value;
    }

    public JwtTokenResult GenerateAccessToken(
        User user,
        string fullName,
        IReadOnlyCollection<string> roles,
        IReadOnlyCollection<string> permissions)
    {
        var nowUtc = DateTime.UtcNow;
        var expiresAtUtc = nowUtc.AddMinutes(_jwtSettings.AccessTokenExpirationMinutes);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(JwtRegisteredClaimNames.Name, fullName),
            new(UsernameClaimType, user.Username),
            new(SecurityStampClaimType, user.SecurityStamp)
        };

        // Include employeeId claim for Row-Level Data Ownership (ESS Self-Only & Manager Subordinate-Only)
        if (user.EmployeeId.HasValue && user.EmployeeId.Value != Guid.Empty)
        {
            claims.Add(new Claim(EmployeeIdClaimType, user.EmployeeId.Value.ToString()));
        }

        // Add Role claims (both custom "roles" and standard ClaimTypes.Role for ASP.NET Core Authorize)
        foreach (var role in roles.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            claims.Add(new Claim(RoleClaimType, role));
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        // Add atomic Permission claims
        foreach (var permission in permissions.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            claims.Add(new Claim(PermissionClaimType, permission));
        }

        var keyBytes = Encoding.UTF8.GetBytes(_jwtSettings.SecretKey);
        var signingKey = new SymmetricSecurityKey(keyBytes);
        var signingCredentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var tokenDescriptor = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            notBefore: nowUtc,
            expires: expiresAtUtc,
            signingCredentials: signingCredentials);

        var accessToken = new JwtSecurityTokenHandler().WriteToken(tokenDescriptor);
        return new JwtTokenResult(accessToken, expiresAtUtc);
    }

    public string GenerateRefreshToken()
    {
        return Guid.NewGuid().ToString();
    }

    public int GetRefreshTokenExpirationDays()
    {
        return _jwtSettings.RefreshTokenExpirationDays;
    }

    public ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return null;
        }

        var keyBytes = Encoding.UTF8.GetBytes(_jwtSettings.SecretKey);
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = _jwtSettings.Issuer,
            ValidateAudience = true,
            ValidAudience = _jwtSettings.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
            ValidateLifetime = false, // Allow expired access token during refresh flow
            NameClaimType = JwtRegisteredClaimNames.Name,
            RoleClaimType = ClaimTypes.Role
        };

        var tokenHandler = new JwtSecurityTokenHandler
        {
            MapInboundClaims = false
        };

        try
        {
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);

            if (securityToken is not JwtSecurityToken jwtSecurityToken ||
                !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            return principal;
        }
        catch
        {
            return null;
        }
    }
}
