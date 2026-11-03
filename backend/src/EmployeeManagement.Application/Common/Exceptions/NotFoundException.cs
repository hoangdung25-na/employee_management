namespace EmployeeManagement.Application.Common.Exceptions;

/// <summary>
/// Exception thrown when a requested entity or resource is not found (HTTP 404 Not Found).
/// </summary>
public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message)
    {
    }

    public NotFoundException(string entityName, object key)
        : base($"Không tìm thấy {entityName} với định danh '{key}'.")
    {
    }
}

