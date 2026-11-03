namespace EmployeeManagement.Infrastructure.Identity;

/// <summary>
/// Strongly-typed configuration settings for JWT authentication.
/// Bound from the "JwtSettings" section in appsettings.json.
/// </summary>
public class JwtSettings
{
    public const string SectionName = "JwtSettings";

    public string SecretKey { get; set; } = string.Empty;
    public string Issuer { get; set; } = "EmployeeManagementApi";
    public string Audience { get; set; } = "EmployeeManagementApp";
    public int AccessTokenExpirationMinutes { get; set; } = 15;
    public int RefreshTokenExpirationDays { get; set; } = 7;
}

