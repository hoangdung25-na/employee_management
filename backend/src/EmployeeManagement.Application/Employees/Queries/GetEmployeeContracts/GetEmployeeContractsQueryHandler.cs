using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Employees.DTOs;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Employees.Queries.GetEmployeeContracts;

/// <summary>
/// Query handler for retrieving labor contracts history for an employee.
/// Enforces Row-Level Data Ownership (ESS: employees can only view their own contracts).
/// </summary>
public class GetEmployeeContractsQueryHandler : IRequestHandler<GetEmployeeContractsQuery, IReadOnlyList<EmployeeContractDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetEmployeeContractsQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<IReadOnlyList<EmployeeContractDto>> Handle(
        GetEmployeeContractsQuery request,
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
            var hasManagePermission = _currentUserService.IsInRole(UserConsts.Roles.SuperAdmin) ||
                                      _currentUserService.IsInRole(UserConsts.Roles.HrManager) ||
                                      _currentUserService.IsInRole(UserConsts.Roles.HrStaff) ||
                                      _currentUserService.HasPermission(UserConsts.Permissions.DocumentManage);

            var isOwner = _currentUserService.EmployeeId.HasValue &&
                          _currentUserService.EmployeeId.Value == request.EmployeeId;

            if (!hasManagePermission && !isOwner)
            {
                throw new ForbiddenException("Bạn không có quyền xem hợp đồng lao động của nhân sự khác (Vi phạm quyền sở hữu ESS).");
            }
        }

        // 3. Query contracts with AsNoTracking and projection
        var contracts = await _context.EmployeeContracts
            .AsNoTracking()
            .Where(c => c.EmployeeId == request.EmployeeId)
            .OrderByDescending(c => c.StartDate)
            .ThenByDescending(c => c.CreatedAt)
            .Select(c => new EmployeeContractDto(
                c.Id,
                c.ContractNumber,
                c.EmployeeId,
                c.ContractType,
                c.StartDate,
                c.EndDate,
                c.SignedDate,
                c.ContractSalary,
                c.Allowances,
                c.FileUrl,
                c.Status,
                c.Notes,
                c.CreatedAt))
            .ToListAsync(cancellationToken);

        return contracts;
    }
}
