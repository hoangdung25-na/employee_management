using System.Text.Json;
using EmployeeManagement.Application.Common;

namespace EmployeeManagement.Api.Middlewares;

/// <summary>
/// Anti-CSRF (Cross-Site Request Forgery) protection middleware per SECURITY_HARDENING_RULES.md Rule #6.
/// Implements the Double-Submit Cookie pattern for cookie-authenticated mutating requests (POST, PUT, PATCH, DELETE).
/// </summary>
public class CsrfProtectionMiddleware
{
    public const string XsrfCookieName = "XSRF-TOKEN";
    public const string XsrfHeaderName = "X-XSRF-TOKEN";
    public const string AlternativeXsrfHeaderName = "X-CSRF-TOKEN";

    private static readonly HashSet<string> SafeMethods = new(StringComparer.OrdinalIgnoreCase)
    {
        HttpMethods.Get,
        HttpMethods.Head,
        HttpMethods.Options,
        HttpMethods.Trace
    };

    private readonly RequestDelegate _next;

    public CsrfProtectionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // 1. Allow safe HTTP methods (GET, HEAD, OPTIONS, TRACE)
        if (SafeMethods.Contains(context.Request.Method))
        {
            await _next(context);
            return;
        }

        var path = context.Request.Path;

        // 2. Exempt public login and refresh-token endpoints (initial credential exchange) and Swagger
        if (path.StartsWithSegments("/api/auth/login", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWithSegments("/api/auth/refresh-token", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWithSegments("/swagger", StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        // 3. CSRF attacks only exploit browser cookie auto-attachment.
        // If the request uses "access_token" cookie, Anti-CSRF validation is MANDATORY.
        var hasCookieAuth = context.Request.Cookies.ContainsKey("access_token");

        if (hasCookieAuth)
        {
            var cookieToken = context.Request.Cookies[XsrfCookieName];
            var headerToken = context.Request.Headers[XsrfHeaderName].FirstOrDefault()
                              ?? context.Request.Headers[AlternativeXsrfHeaderName].FirstOrDefault();

            if (string.IsNullOrWhiteSpace(cookieToken) ||
                string.IsNullOrWhiteSpace(headerToken) ||
                !string.Equals(cookieToken.Trim(), headerToken.Trim(), StringComparison.Ordinal))
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                context.Response.ContentType = "application/json";

                var failureResponse = ApiResponse<object>.FailureResult(
                    "Yêu cầu bị từ chối do không vượt qua kiểm tra chống giả mạo (Anti-CSRF).",
                    ["Mã Anti-CSRF (XSRF-TOKEN) bị thiếu hoặc không trùng khớp với phiên đăng nhập."]);

                var json = JsonSerializer.Serialize(failureResponse, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });

                await context.Response.WriteAsync(json);
                return;
            }
        }

        await _next(context);
    }
}

