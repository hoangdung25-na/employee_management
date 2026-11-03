namespace EmployeeManagement.Api.Middlewares;

/// <summary>
/// Enforces HTTP security headers across API responses to mitigate XSS, Clickjacking, and MIME-sniffing attacks
/// per SECURITY_HARDENING_RULES.md Rule #7.
/// </summary>
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        context.Response.OnStarting(() =>
        {
            var headers = context.Response.Headers;

            headers["X-Content-Type-Options"] = "nosniff";
            headers["X-Frame-Options"] = "DENY";
            headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
            headers["X-Permitted-Cross-Domain-Policies"] = "none";

            // Apply strict CSP on API routes (skip Swagger UI assets in Development)
            if (!context.Request.Path.StartsWithSegments("/swagger"))
            {
                headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none';";
            }

            return Task.CompletedTask;
        });

        await _next(context);
    }
}

