namespace EmployeeManagement.Application.Common.Exceptions;

/// <summary>
/// Exception thrown when authentication fails or token is invalid/expired (HTTP 401 Unauthorized).
/// </summary>
public class UnauthorizedException : Exception
{
    public UnauthorizedException(string message) : base(message)
    {
    }
}

