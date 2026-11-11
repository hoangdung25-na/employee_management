using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Infrastructure.Data;
using EmployeeManagement.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace EmployeeManagement.Infrastructure;

/// <summary>
/// Dependency Injection registration for the Infrastructure Layer.
/// Configures EF Core SQL Server DbContext, Identity/JWT services, and current user context.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            connectionString = configuration["DB_CONNECTION_STRING"]
                ?? configuration["DATABASE_URL"];
        }

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("Connection string 'DefaultConnection' was not found in configuration or environment (.env).");
        }

        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(connectionString, sqlOptions =>
            {
                sqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 3,
                    maxRetryDelay: TimeSpan.FromSeconds(5),
                    errorNumbersToAdd: null);
            }));

        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<AppDbContext>());

        // Identity & Security Services (JWT, BCrypt, CurrentUser Context)
        services.Configure<JwtSettings>(options =>
        {
            configuration.GetSection(JwtSettings.SectionName).Bind(options);

            var envSecret = configuration["JWT_SECRET_KEY"] ?? configuration["JwtSettings:SecretKey"];
            if (!string.IsNullOrWhiteSpace(envSecret)) options.SecretKey = envSecret;

            var envIssuer = configuration["JWT_ISSUER"] ?? configuration["JwtSettings:Issuer"];
            if (!string.IsNullOrWhiteSpace(envIssuer)) options.Issuer = envIssuer;

            var envAudience = configuration["JWT_AUDIENCE"] ?? configuration["JwtSettings:Audience"];
            if (!string.IsNullOrWhiteSpace(envAudience)) options.Audience = envAudience;

            var envAccess = configuration["JWT_ACCESS_TOKEN_EXPIRATION_MINUTES"] ?? configuration["JwtSettings:AccessTokenExpirationMinutes"];
            if (int.TryParse(envAccess, out var accessMins)) options.AccessTokenExpirationMinutes = accessMins;

            var envRefreshHours = configuration["JWT_REFRESH_TOKEN_EXPIRATION_HOURS"] ?? configuration["JwtSettings:RefreshTokenExpirationHours"];
            if (int.TryParse(envRefreshHours, out var refreshHours)) options.RefreshTokenExpirationHours = refreshHours;

            var envRefresh = configuration["JWT_REFRESH_TOKEN_EXPIRATION_DAYS"] ?? configuration["JwtSettings:RefreshTokenExpirationDays"];
            if (int.TryParse(envRefresh, out var refreshDays)) options.RefreshTokenExpirationDays = refreshDays;
        });
        services.AddMemoryCache();
        services.AddHttpContextAccessor();
        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddSingleton<IAuthCache, MemoryAuthCache>();
        services.AddScoped<IPermissionChecker, PermissionChecker>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        return services;
    }
}

