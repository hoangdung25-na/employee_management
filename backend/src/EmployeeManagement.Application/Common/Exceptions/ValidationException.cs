using FluentValidation.Results;

namespace EmployeeManagement.Application.Common.Exceptions;

/// <summary>
/// Exception thrown when one or more FluentValidation rules fail (HTTP 400 Bad Request).
/// </summary>
public class ValidationException : Exception
{
    public List<string> Errors { get; }

    public ValidationException()
        : base("Dữ liệu yêu cầu không hợp lệ.")
    {
        Errors = new List<string>();
    }

    public ValidationException(IEnumerable<ValidationFailure> failures)
        : this()
    {
        Errors = failures
            .Select(f => f.ErrorMessage)
            .Distinct()
            .ToList();
    }

    public ValidationException(string errorMessage)
        : this()
    {
        Errors = new List<string> { errorMessage };
    }
}

