using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Employees.DTOs;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Employees.Queries.GetEmployeeById;

/// <summary>
/// Read-only query handler for retrieving an employee's full profile.
/// Enforces Row-Level Data Ownership (ESS Self-Only anti-IDOR) and Salary Privacy (masks BaseSalary for HR_STAFF).
/// </summary>
public class GetEmployeeByIdQueryHandler : IRequestHandler<GetEmployeeByIdQuery, EmployeeDetailDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetEmployeeByIdQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<EmployeeDetailDto> Handle(
        GetEmployeeByIdQuery request,
        CancellationToken cancellationToken)
    {
        // 1. Enforce Row-Level Data Ownership (anti-IDOR) when called by an authenticated user
        if (_currentUserService.IsAuthenticated)
        {
            var canViewAnyProfile = _currentUserService.IsInRole(UserConsts.Roles.SuperAdmin) ||
                                    _currentUserService.IsInRole(UserConsts.Roles.HrManager) ||
                                    _currentUserService.IsInRole(UserConsts.Roles.HrStaff) ||
                                    _currentUserService.HasPermission(UserConsts.Permissions.EmployeeViewDetail) ||
                                    _currentUserService.HasPermission(UserConsts.Permissions.EmployeeView);

            var isViewingSelf = _currentUserService.EmployeeId.HasValue &&
                                _currentUserService.EmployeeId.Value == request.Id;

            if (!canViewAnyProfile && !isViewingSelf)
            {
                throw new ForbiddenException("Bạn chỉ được phép xem hồ sơ nhân sự của chính mình (Vi phạm quyền sở hữu dữ liệu ESS).");
            }
        }

        // 2. Determine whether BaseSalary should be visible
        var canViewSalary = !_currentUserService.IsAuthenticated ||
                            _currentUserService.IsInRole(UserConsts.Roles.SuperAdmin) ||
                            _currentUserService.IsInRole(UserConsts.Roles.HrManager) ||
                            (_currentUserService.EmployeeId.HasValue && _currentUserService.EmployeeId.Value == request.Id);

        // 3. Project directly to EmployeeDetailDto using AsNoTracking
        var employee = await _context.Employees
            .AsNoTracking()
            .Where(e => e.Id == request.Id)
            .Select(e => new EmployeeDetailDto(
                e.Id,
                e.EmployeeCode,
                e.FullName,
                e.DateOfBirth,
                e.Gender,
                e.CitizenId,
                e.PhoneNumber,
                e.WorkEmail,
                e.PersonalEmail,
                e.Address,
                e.HireDate,
                e.ProbationEndDate,
                e.DepartmentId,
                e.Department.DepartmentName,
                e.PositionId,
                e.Position.PositionName,
                e.DirectManagerId,
                e.DirectManager != null ? e.DirectManager.FullName : null,
                canViewSalary ? e.BaseSalary : 0m,
                e.TaxCode,
                e.SocialInsuranceNumber,
                canViewSalary ? e.BankAccountNumber : null,
                canViewSalary ? e.BankName : null,
                e.AvatarUrl,
                e.Status.ToString(),
                e.TerminationDate,
                e.TerminationReason,
                e.CreatedAt,
                e.UpdatedAt,
                e.Department.ManagerId == e.Id))
            .FirstOrDefaultAsync(cancellationToken);

        if (employee is null)
        {
            throw new NotFoundException("Nhân viên", request.Id);
        }

        return employee;
    }
}

