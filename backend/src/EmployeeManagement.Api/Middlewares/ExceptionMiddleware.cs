using System.Net;
using System.Text.Json;
using EmployeeManagement.Application.Common;
using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Domain.Common.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Api.Middlewares;

/// <summary>
/// Centralized exception handling middleware across the entire application.
/// Captures domain, application, concurrency, and unhandled exceptions, writes structured logs,
/// and returns a standardized ApiResponse with appropriate HTTP status codes.
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
            if (ex is ValidationException or BadRequestException or DomainException or UnauthorizedException or ForbiddenException or NotFoundException or ConflictException)
            {
                _logger.LogWarning(
                    "Business/Application exception on {Method} {Path}{QueryString} [TraceId: {TraceId}]: {ExceptionType} - {ErrorMessage}",
                    context.Request.Method,
                    context.Request.Path,
                    context.Request.QueryString,
                    context.TraceIdentifier,
                    ex.GetType().Name,
                    ex.Message);
            }
            else
            {
                _logger.LogError(
                    ex,
                    "Unhandled exception occurred while processing request {Method} {Path}{QueryString} [TraceId: {TraceId}]: {ErrorMessage}",
                    context.Request.Method,
                    context.Request.Path,
                    context.Request.QueryString,
                    context.TraceIdentifier,
                    ex.Message);
            }

            await HandleExceptionAsync(context, ex, _env.IsDevelopment());
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception, bool isDevelopment)
    {
        context.Response.ContentType = "application/json";

        var (statusCode, message, errors) = exception switch
        {
            ValidationException validationEx => (
                (int)HttpStatusCode.BadRequest,
                validationEx.Message,
                validationEx.Errors),

            BadRequestException badRequestEx => (
                (int)HttpStatusCode.BadRequest,
                badRequestEx.Message,
                new List<string> { badRequestEx.Message }),

            DomainException domainEx => (
                (int)HttpStatusCode.BadRequest,
                domainEx.Message,
                new List<string> { domainEx.Message }),

            UnauthorizedException unauthorizedEx => (
                (int)HttpStatusCode.Unauthorized,
                unauthorizedEx.Message,
                new List<string> { unauthorizedEx.Message }),

            ForbiddenException forbiddenEx => (
                (int)HttpStatusCode.Forbidden,
                forbiddenEx.Message,
                new List<string> { forbiddenEx.Message }),

            NotFoundException notFoundEx => (
                (int)HttpStatusCode.NotFound,
                notFoundEx.Message,
                new List<string> { notFoundEx.Message }),

            ConflictException conflictEx => (
                (int)HttpStatusCode.Conflict,
                conflictEx.Message,
                new List<string> { conflictEx.Message }),

            DbUpdateConcurrencyException => (
                (int)HttpStatusCode.Conflict,
                "Dữ liệu vừa được cập nhật bởi một phiên làm việc khác. Vui lòng thử lại.",
                new List<string> { "Concurrency conflict detected." }),

            _ => (
                (int)HttpStatusCode.InternalServerError,
                "Đã xảy ra lỗi hệ thống không mong muốn. Vui lòng liên hệ quản trị viên.",
                isDevelopment
                    ? new List<string> { exception.Message, $"TraceId: {context.TraceIdentifier}" }
                    : new List<string> { $"TraceId: {context.TraceIdentifier}" })
        };

        context.Response.StatusCode = statusCode;

        var response = ApiResponse<object>.FailureResult(message, errors);

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        return context.Response.WriteAsync(json);
    }
}
