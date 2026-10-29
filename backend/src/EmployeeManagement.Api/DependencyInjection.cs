using Microsoft.OpenApi.Models;

namespace EmployeeManagement.Api;

/// <summary>
/// Dependency Injection registration for the API / Presentation Layer.
/// Configures Controllers, CORS policies, and Swagger OpenAPI documentation.
/// </summary>
public static class DependencyInjection
{
    public const string NextJsCorsPolicyName = "AllowNextJsClient";

    public static IServiceCollection AddApiServices(this IServiceCollection services)
    {
        services.AddCors(options =>
        {
            options.AddPolicy(NextJsCorsPolicyName, policy =>
            {
                policy.WithOrigins("http://localhost:3000", "https://localhost:3000")
                      .AllowAnyHeader()
                      .AllowAnyMethod()
                      .AllowCredentials();
            });
        });

        services.AddControllers();
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "Enterprise Employee Management API",
                Version = "v1",
                Description = "Internal Back-Office HRM System - Clean Architecture & CQRS Pattern"
            });
        });

        return services;
    }
}

