using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Threading.RateLimiting;
using EmployeeManagement.Api.Authorization;
using EmployeeManagement.Application.Common;
using EmployeeManagement.Infrastructure.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

namespace EmployeeManagement.Api;

/// <summary>
/// Dependency Injection registration for the API / Presentation Layer.
/// Configures Controllers, strict CORS, Rate Limiting, JWT Bearer Authentication, 5-Role RBAC Policies, and Swagger.
/// </summary>
public static class DependencyInjection
{
    public const string NextJsCorsPolicyName = "AllowNextJsClient";
    public const string AuthLoginRateLimitPolicyName = "AuthLoginRateLimit";

    public static IServiceCollection AddApiServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // 1. Strict CORS Policy for Next.js Frontend (configurable via Cors:AllowedOrigins or CORS_ALLOWED_ORIGINS)
        services.AddCors(options =>
        {
            options.AddPolicy(NextJsCorsPolicyName, policy =>
            {
                var allowedOriginsString = configuration["Cors:AllowedOrigins"];
                if (string.IsNullOrWhiteSpace(allowedOriginsString))
                {
                    allowedOriginsString = configuration["CORS_ALLOWED_ORIGINS"];
                }
                var allowedOrigins = !string.IsNullOrWhiteSpace(allowedOriginsString)
                    ? allowedOriginsString.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    : configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();

                if (allowedOrigins == null || allowedOrigins.Length == 0)
                {
                    allowedOrigins = ["http://localhost:3000", "https://localhost:3000"];
                }

                policy.WithOrigins(allowedOrigins)
                      .WithHeaders("Content-Type", "Authorization", "Accept", "X-Requested-With", "X-XSRF-TOKEN")
                      .WithMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                      .AllowCredentials();
            });
        });

        // 2. Rate Limiting (SECURITY_HARDENING_RULES.md Rule #1)
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            options.OnRejected = async (context, cancellationToken) =>
            {
                context.HttpContext.Response.ContentType = "application/json";
                var response = ApiResponse<object>.FailureResult(
                    "Quá nhiều yêu cầu trong thời gian ngắn. Vui lòng thử lại sau ít phút.",
                    ["Rate limit exceeded (HTTP 429)."]);

                var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });

                await context.HttpContext.Response.WriteAsync(json, cancellationToken);
            };

            // Strict per-IP rate limiter for /api/auth/login (max 10 attempts per minute)
            options.AddPolicy(AuthLoginRateLimitPolicyName, httpContext =>
            {
                var clientIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                return RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: $"login:{clientIp}",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 10,
                        Window = TimeSpan.FromMinutes(1),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0
                    });
            });
        });

        // 3. JWT Bearer Authentication (SECURITY_HARDENING_RULES.md Rule #5)
        var jwtSettings = configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>() ?? new JwtSettings();
        if (string.IsNullOrWhiteSpace(jwtSettings.SecretKey))
        {
            jwtSettings.SecretKey = configuration["JWT_SECRET_KEY"] ?? string.Empty;
        }
        if (string.IsNullOrWhiteSpace(jwtSettings.Issuer))
        {
            jwtSettings.Issuer = configuration["JWT_ISSUER"] ?? "EmployeeManagementApi";
        }
        if (string.IsNullOrWhiteSpace(jwtSettings.Audience))
        {
            jwtSettings.Audience = configuration["JWT_AUDIENCE"] ?? "EmployeeManagementApp";
        }

        if (string.IsNullOrWhiteSpace(jwtSettings.SecretKey))
        {
            throw new InvalidOperationException("JwtSettings:SecretKey section is missing in configuration and environment.");
        }

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.MapInboundClaims = false;
            options.RequireHttpsMetadata = false;
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = jwtSettings.Issuer,
                ValidateAudience = true,
                ValidAudience = jwtSettings.Audience,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey)),
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero,
                NameClaimType = JwtRegisteredClaimNames.Name,
                RoleClaimType = ClaimTypes.Role
            };

            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    // If Authorization header is missing, extract JWT from "access_token" HttpOnly Cookie
                    if (string.IsNullOrEmpty(context.Token) &&
                        context.Request.Cookies.TryGetValue("access_token", out var cookieToken) &&
                        !string.IsNullOrWhiteSpace(cookieToken))
                    {
                        context.Token = cookieToken;
                    }
                    return Task.CompletedTask;
                },
                OnChallenge = async context =>
                {
                    context.HandleResponse();
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    context.Response.ContentType = "application/json";

                    var response = ApiResponse<object>.FailureResult(
                        "Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.",
                        ["Unauthorized (HTTP 401)."]);

                    var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                    });

                    await context.Response.WriteAsync(json);
                },
                OnForbidden = async context =>
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    context.Response.ContentType = "application/json";

                    var response = ApiResponse<object>.FailureResult(
                        "Bạn không có đủ quyền hạn (Role/Permission) để thực hiện thao tác này.",
                        ["Forbidden (HTTP 403)."]);

                    var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                    });

                    await context.Response.WriteAsync(json);
                }
            };
        });

        // 4. Register Dynamic Permission Policy Provider & PermissionChecker Authorization Handler (Phase 3 AuthCache)
        services.AddAuthorization();
        services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
        services.AddScoped<IAuthorizationHandler, PermissionAuthorizationHandler>();

        services.AddControllers();
        services.AddEndpointsApiExplorer();

        // 5. Swagger OpenAPI with JWT Bearer Security Definition
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "Enterprise Employee Management API (HRFlow)",
                Version = "v1",
                Description = "Hybrid Back-Office HRM & Employee Self-Service (ESS) - Clean Architecture & CQRS Pattern"
            });

            var securityScheme = new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Description = "Nhập JWT Bearer token theo định dạng: Bearer {token}",
                In = ParameterLocation.Header,
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = JwtBearerDefaults.AuthenticationScheme
                }
            };

            c.AddSecurityDefinition(JwtBearerDefaults.AuthenticationScheme, securityScheme);
            c.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                { securityScheme, Array.Empty<string>() }
            });
        });

        return services;
    }
}
