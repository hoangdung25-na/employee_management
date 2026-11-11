using EmployeeManagement.Application.Common;
using EmployeeManagement.Application.Users.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Users.Queries.GetUsers;

/// <summary>
/// Paginated query to list system users with search, role filtering, and active status filtering.
/// </summary>
public record GetUsersQuery : IRequest<PagedResult<UserSummaryDto>>
{
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 12;
    public string? SearchTerm { get; init; }
    public string? RoleCode { get; init; }
    public bool? IsActive { get; init; }
}
