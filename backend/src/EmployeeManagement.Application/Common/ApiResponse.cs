namespace EmployeeManagement.Application.Common;

/// <summary>
/// Standardized API Response Wrapper across the entire system.
/// </summary>
/// <typeparam name="T">Type of the response payload</typeparam>
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public List<string>? Errors { get; set; }

    public static ApiResponse<T> SuccessResult(T data, string message = "Operation completed successfully.") =>
        new()
        {
            Success = true,
            Message = message,
            Data = data,
            Errors = null
        };

    public static ApiResponse<T> FailureResult(string message, List<string>? errors = null) =>
        new()
        {
            Success = false,
            Message = message,
            Data = default,
            Errors = errors
        };
}
