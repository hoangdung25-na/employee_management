using System.Diagnostics;
using MediatR;
using Microsoft.Extensions.Logging;

namespace EmployeeManagement.Application.Common.Behaviors;

/// <summary>
/// </summary>
public class LoggingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private const int SlowRequestThresholdMs = 500;
    private readonly ILogger<LoggingBehavior<TRequest, TResponse>> _logger;

    public LoggingBehavior(ILogger<LoggingBehavior<TRequest, TResponse>> logger)
    {
        _logger = logger;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;
        var isCommand = requestName.EndsWith("Command", StringComparison.Ordinal);
        var stopwatch = Stopwatch.StartNew();

        // Only log payload upfront for state-modifying Commands (Audit Trail)
        if (isCommand)
        {
            _logger.LogInformation("Executing Command {RequestName} with payload: {@Request}", requestName, request);
        }

        try
        {
            var response = await next();
            stopwatch.Stop();

            if (stopwatch.ElapsedMilliseconds > SlowRequestThresholdMs)
            {
                _logger.LogWarning(
                    "Slow request detected: {RequestName} took {ElapsedMilliseconds} ms (Threshold: {Threshold} ms). Payload: {@Request}",
                    requestName,
                    stopwatch.ElapsedMilliseconds,
                    SlowRequestThresholdMs,
                    request);
            }
            else if (isCommand)
            {
                _logger.LogInformation(
                    "Completed Command {RequestName} successfully in {ElapsedMilliseconds} ms.",
                    requestName,
                    stopwatch.ElapsedMilliseconds);
            }

            return response;
        }
        catch (Exception)
        {
            stopwatch.Stop();

            // Log the request payload that caused the failure so developers can reproduce the bug.
            // Note: We do not pass 'ex' here to avoid printing duplicate stack traces (ExceptionMiddleware logs the full stack trace).
            _logger.LogError(
                "Request {RequestName} failed after {ElapsedMilliseconds} ms. Failed Payload: {@Request}",
                requestName,
                stopwatch.ElapsedMilliseconds,
                request);

            throw;
        }
    }
}
