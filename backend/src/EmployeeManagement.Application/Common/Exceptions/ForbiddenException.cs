namespace EmployeeManagement.Application.Common.Exceptions;

/// <summary>
/// Exception thrown when an authenticated user violates Row-Level Data Ownership (IDOR) or lacks permission (HTTP 403 Forbidden).
/// </summary>
public class ForbiddenException : Exception
{
    public ForbiddenException(string message = "Bạn không có quyền truy cập hoặc thao tác trên dữ liệu này.")
        : base(message)
    {
    }
}

