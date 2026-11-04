using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Employees.DTOs;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Employees.Queries.GetDecisionById;

/// <summary>
/// Query handler for retrieving a specific employee decision with ESS ownership validation.
/// </summary>
public class GetDecisionByIdQueryHandler : IRequestHandler<GetDecisionByIdQuery, EmployeeDecisionDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetDecisionByIdQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<EmployeeDecisionDto> Handle(
        GetDecisionByIdQuery request,
        CancellationToken cancellationToken)
    {
        var decision = await _context.EmployeeDecisions
            .AsNoTracking()
            .Include(d => d.Employee)
            .Include(d => d.OldDepartment)
            .Include(d => d.NewDepartment)
            .Include(d => d.OldPosition)
            .Include(d => d.NewPosition)
            .FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken);

        if (decision is null)
        {
            throw new NotFoundException("Quyết định nhân sự", request.Id);
        }

        // Enforce ESS data ownership
        if (_currentUserService.IsAuthenticated)
        {
            var hasManageOrViewPermission = _currentUserService.IsInRole(UserConsts.Roles.SuperAdmin) ||
                                            _currentUserService.IsInRole(UserConsts.Roles.HrManager) ||
                                            _currentUserService.IsInRole(UserConsts.Roles.HrStaff) ||
                                            _currentUserService.HasPermission(UserConsts.Permissions.DecisionView) ||
                                            _currentUserService.HasPermission(UserConsts.Permissions.DecisionManage);

            var isOwner = _currentUserService.EmployeeId.HasValue &&
                          _currentUserService.EmployeeId.Value == decision.EmployeeId;

            if (!hasManageOrViewPermission && !isOwner)
            {
                throw new ForbiddenException("Bạn không có quyền xem văn bản quyết định này (Vi phạm quyền sở hữu ESS).");
            }
        }

        return new EmployeeDecisionDto(
            decision.Id,
            decision.DecisionNumber,
            decision.EmployeeId,
            decision.Employee.FullName,
            decision.Employee.EmployeeCode,
            decision.DecisionType,
            decision.Title,
            decision.EffectiveDate,
            decision.SignDate,
            decision.SignerName,
            decision.SignerPosition,
            decision.Amount,
            decision.OldDepartmentId,
            decision.OldDepartment?.DepartmentName,
            decision.NewDepartmentId,
            decision.NewDepartment?.DepartmentName,
            decision.OldPositionId,
            decision.OldPosition?.PositionName,
            decision.NewPositionId,
            decision.NewPosition?.PositionName,
            decision.OldSalary,
            decision.NewSalary,
            decision.Reason,
            decision.AttachmentUrl,
            decision.Status,
            decision.CreatedAt);
    }
}
