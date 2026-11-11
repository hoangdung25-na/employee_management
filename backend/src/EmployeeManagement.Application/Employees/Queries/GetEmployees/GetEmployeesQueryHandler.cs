using EmployeeManagement.Application.Common;
using EmployeeManagement.Application.Employees.DTOs;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Domain.Employees.Enums;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Employees.Queries.GetEmployees;

/// <summary>
/// CQRS Query Handler for retrieving a paginated, filtered, and sorted list of employees.
/// Enforces Salary Privacy (masks BaseSalary for HR_STAFF and MANAGER roles).
/// </summary>
public class GetEmployeesQueryHandler : IRequestHandler<GetEmployeesQuery, PagedResult<EmployeeSummaryDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetEmployeesQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<PagedResult<EmployeeSummaryDto>> Handle(GetEmployeesQuery request, CancellationToken cancellationToken)
    {
        // 1. Initialize read-only query with AsNoTracking
        var query = _context.Employees
            .AsNoTracking()
            .AsQueryable();

        // 2. Filter by keyword (SARGable query: SQL Server is case-insensitive by default)
        if (!string.IsNullOrWhiteSpace(request.Keyword))
        {
            var keyword = request.Keyword.Trim();
            query = query.Where(e =>
                e.FullName.Contains(keyword) ||
                e.EmployeeCode.Contains(keyword) ||
                e.WorkEmail.Contains(keyword) ||
                (e.PhoneNumber != null && e.PhoneNumber.Contains(keyword)));
        }

        // 3. Filter by DepartmentId (Guid)
        if (request.DepartmentId.HasValue && request.DepartmentId.Value != Guid.Empty)
        {
            query = query.Where(e => e.DepartmentId == request.DepartmentId.Value);
        }

        // 4. Filter by EmployeeStatus
        if (!string.IsNullOrWhiteSpace(request.Status) && Enum.TryParse<EmployeeStatus>(request.Status, true, out var statusEnum))
        {
            query = query.Where(e => e.Status == statusEnum);
        }

        // 5. Count total matching records
        var totalCount = await query.CountAsync(cancellationToken);

        // 6. Apply sorting (Whitelist switch per SECURITY_HARDENING_RULES.md Rule #3)
        var isDescending = string.Equals(request.SortOrder, "desc", StringComparison.OrdinalIgnoreCase);
        query = (request.SortBy?.ToLower()) switch
        {
            "fullname" => isDescending ? query.OrderByDescending(e => e.FullName) : query.OrderBy(e => e.FullName),
            "basesalary" => isDescending ? query.OrderByDescending(e => e.BaseSalary) : query.OrderBy(e => e.BaseSalary),
            "employeecode" => isDescending ? query.OrderByDescending(e => e.EmployeeCode) : query.OrderBy(e => e.EmployeeCode),
            _ => isDescending ? query.OrderByDescending(e => e.HireDate) : query.OrderBy(e => e.HireDate)
        };

        // 7. Apply safe pagination bounds
        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize is < 1 or > 100 ? 10 : request.PageSize;

        // 8. Determine Salary Privacy permission (Only SUPER_ADMIN and HR_MANAGER can see all salaries)
        var canViewAllSalaries = !_currentUserService.IsAuthenticated ||
                                 _currentUserService.IsInRole(UserConsts.Roles.SuperAdmin) ||
                                 _currentUserService.IsInRole(UserConsts.Roles.HrManager);
        var currentEmployeeId = _currentUserService.EmployeeId;

        // 9. Project directly to EmployeeSummaryDto
        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new EmployeeSummaryDto(
                e.Id,
                e.EmployeeCode,
                e.FullName,
                e.DateOfBirth,
                e.Gender,
                e.WorkEmail,
                e.PhoneNumber,
                e.DepartmentId,
                e.Department.DepartmentName,
                e.PositionId,
                e.Position.PositionName,
                e.DirectManager != null ? e.DirectManager.FullName : null,
                canViewAllSalaries || (currentEmployeeId.HasValue && e.Id == currentEmployeeId.Value) ? e.BaseSalary : 0m,
                e.AvatarUrl,
                e.HireDate,
                e.Status.ToString(),
                e.Department.ManagerId == e.Id
            ))
            .ToListAsync(cancellationToken);

        return new PagedResult<EmployeeSummaryDto>(items, totalCount, pageNumber, pageSize);
    }
}
