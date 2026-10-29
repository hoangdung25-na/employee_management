using System.Net;
using System.Text.Json;
using EmployeeManagement.Application.Common;

namespace EmployeeManagement.Api.Middlewares;

/// <summary>
/// Centralized exception handling middleware across the entire application.
/// Captures unhandled exceptions, writes structured error logs, and returns a standardized ApiResponse.
/// </summary>
public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public ExceptionMiddleware(
        RequestDelegate next,
        ILogger<ExceptionMiddleware> logger,
        IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            _logger.LogWarning(
                "Request was cancelled by the client: {Method} {Path}{QueryString} [TraceId: {TraceId}]",
                context.Request.Method,
                context.Request.Path,
                context.Request.QueryString,
                context.TraceIdentifier);

            context.Response.StatusCode = 499; // Client Closed Request
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Unhandled exception occurred while processing request {Method} {Path}{QueryString} [TraceId: {TraceId}]: {ErrorMessage}",
                context.Request.Method,
                context.Request.Path,
                context.Request.QueryString,
                context.TraceIdentifier,
                ex.Message);

            await HandleExceptionAsync(context, ex, _env.IsDevelopment());
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception, bool isDevelopment)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

        var errors = isDevelopment
            ? new List<string> { exception.Message, $"TraceId: {context.TraceIdentifier}" }
            : new List<string> { $"TraceId: {context.TraceIdentifier}" };

        var response = ApiResponse<object>.FailureResult(
            "An unexpected internal server error occurred. Please contact the system administrator.",
            errors
        );

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        return context.Response.WriteAsync(json);
    }
}
