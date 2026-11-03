namespace EmployeeManagement.Application.Common.Exceptions;

/// <summary>
/// Exception thrown when a duplicate record or state conflict occurs (HTTP 409 Conflict).
/// </summary>
public class ConflictException : Exception
{
    public ConflictException(string message) : base(message)
    {
    }
}

