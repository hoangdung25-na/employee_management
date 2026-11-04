using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Employees.DTOs;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Employees.Queries.GetEmployeeDecisions;

/// <summary>
/// Query handler for retrieving legal/organizational decisions for an employee.
/// Enforces Row-Level Security / ESS Data Ownership.
/// </summary>
public class GetEmployeeDecisionsQueryHandler : IRequestHandler<GetEmployeeDecisionsQuery, IReadOnlyList<EmployeeDecisionDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetEmployeeDecisionsQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<IReadOnlyList<EmployeeDecisionDto>> Handle(
        GetEmployeeDecisionsQuery request,
        CancellationToken cancellationToken)
    {
        // 1. Verify employee exists
        var employeeExists = await _context.Employees
            .AsNoTracking()
            .AnyAsync(e => e.Id == request.EmployeeId, cancellationToken);

        if (!employeeExists)
        {
            throw new NotFoundException("Nhân viên", request.EmployeeId);
        }

        // 2. Enforce Row-Level Security / ESS Ownership
        if (_currentUserService.IsAuthenticated)
        {
            var hasManageOrViewPermission = _currentUserService.IsInRole(UserConsts.Roles.SuperAdmin) ||
                                            _currentUserService.IsInRole(UserConsts.Roles.HrManager) ||
                                            _currentUserService.IsInRole(UserConsts.Roles.HrStaff) ||
                                            _currentUserService.HasPermission(UserConsts.Permissions.DecisionView) ||
                                            _currentUserService.HasPermission(UserConsts.Permissions.DecisionManage);

            var isOwner = _currentUserService.EmployeeId.HasValue &&
                          _currentUserService.EmployeeId.Value == request.EmployeeId;

            if (!hasManageOrViewPermission && !isOwner)
            {
                throw new ForbiddenException("Bạn không có quyền xem quyết định nhân sự của nhân sự khác (Vi phạm quyền sở hữu ESS).");
            }
        }

        // 3. Query decisions with AsNoTracking and projection
        var decisions = await _context.EmployeeDecisions
            .AsNoTracking()
            .Where(d => d.EmployeeId == request.EmployeeId)
            .OrderByDescending(d => d.EffectiveDate)
            .ThenByDescending(d => d.CreatedAt)
            .Select(d => new EmployeeDecisionDto(
                d.Id,
                d.DecisionNumber,
                d.EmployeeId,
                d.Employee.FullName,
                d.Employee.EmployeeCode,
                d.DecisionType,
                d.Title,
                d.EffectiveDate,
                d.SignDate,
                d.SignerName,
                d.SignerPosition,
                d.Amount,
                d.OldDepartmentId,
                d.OldDepartment != null ? d.OldDepartment.DepartmentName : null,
                d.NewDepartmentId,
                d.NewDepartment != null ? d.NewDepartment.DepartmentName : null,
                d.OldPositionId,
                d.OldPosition != null ? d.OldPosition.PositionName : null,
                d.NewPositionId,
                d.NewPosition != null ? d.NewPosition.PositionName : null,
                d.OldSalary,
                d.NewSalary,
                d.Reason,
                d.AttachmentUrl,
                d.Status,
                d.CreatedAt))
            .ToListAsync(cancellationToken);

        return decisions;
    }
}
