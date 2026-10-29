using EmployeeManagement.Application.Common;
using EmployeeManagement.Application.Employees.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Employees.Queries.GetEmployees;

/// <summary>
/// CQRS Query representing a read-only request for a paginated list of employees.
/// </summary>
public record GetEmployeesQuery : IRequest<PagedResult<EmployeeSummaryDto>>
{
    /// <summary>
    /// Search keyword matching FullName, EmployeeCode, WorkEmail, or PhoneNumber
    /// </summary>
    public string? Keyword { get; init; }

    /// <summary>
    /// Filter by Department ID (GUID)
    /// </summary>
    public Guid? DepartmentId { get; init; }

    /// <summary>
    /// Filter by employment status (Probation, Active, Suspended, Terminated)
    /// </summary>
    public string? Status { get; init; }

    /// <summary>
    /// Page number (1-based index, defaults to 1)
    /// </summary>
    public int PageNumber { get; init; } = 1;

    /// <summary>
    /// Number of items per page (defaults to 10, max 100)
    /// </summary>
    public int PageSize { get; init; } = 10;

    /// <summary>
    /// Column to sort by (FullName, BaseSalary, EmployeeCode, HireDate)
    /// </summary>
    public string? SortBy { get; init; }

    /// <summary>
    /// Sort direction: "asc" (ascending) or "desc" (descending)
    /// </summary>
    public string? SortOrder { get; init; } = "asc";
}
