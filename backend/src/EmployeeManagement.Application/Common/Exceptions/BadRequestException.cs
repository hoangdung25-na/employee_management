namespace EmployeeManagement.Application.Common.Exceptions;

/// <summary>
/// Exception thrown when a business rule or request constraint is violated (HTTP 400 Bad Request).
/// </summary>
public class BadRequestException : Exception
{
    public BadRequestException(string message) : base(message)
    {
    }
}

