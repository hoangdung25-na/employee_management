using System.IdentityModel.Tokens.Jwt;
using System.Reflection;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Threading.RateLimiting;
using EmployeeManagement.Application.Common;
using EmployeeManagement.Domain.Users.Consts;
using EmployeeManagement.Infrastructure.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
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
        // 1. Strict CORS Policy for Next.js Frontend (SECURITY_HARDENING_RULES.md Rule #2)
        services.AddCors(options =>
        {
            options.AddPolicy(NextJsCorsPolicyName, policy =>
            {
                policy.WithOrigins("http://localhost:3000", "https://localhost:3000")
                      .WithHeaders("Content-Type", "Authorization", "Accept", "X-Requested-With")
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
        var jwtSettings = configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>()
            ?? throw new InvalidOperationException("JwtSettings section is missing in configuration.");

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

        // 4. Register Atomic Permission Policies for 5-Role RBAC & ESS
        services.AddAuthorization(options =>
        {
            var permissionConstants = typeof(UserConsts.Permissions)
                .GetFields(BindingFlags.Public | BindingFlags.Static | BindingFlags.FlattenHierarchy)
                .Where(fi => fi.IsLiteral && !fi.IsInitOnly && fi.FieldType == typeof(string))
                .Select(fi => (string)fi.GetRawConstantValue()!)
                .ToList();

            foreach (var permission in permissionConstants)
            {
                options.AddPolicy(permission, policy =>
                    policy.RequireAssertion(ctx =>
                        ctx.User.HasClaim(c =>
                            c.Type == JwtTokenGenerator.PermissionClaimType &&
                            string.Equals(c.Value, permission, StringComparison.OrdinalIgnoreCase)) ||
                        ctx.User.IsInRole(UserConsts.Roles.SuperAdmin)));
            }
        });

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
