using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Application.Leaves.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Leaves.Queries.GetMyLeaveBalances;

/// <summary>
/// Query to retrieve leave quotas and remaining days for an employee (ESS view).
/// </summary>
public record GetMyLeaveBalancesQuery(int? Year = null, Guid? TargetEmployeeId = null) : IRequest<IReadOnlyList<LeaveBalanceDto>>;

public class GetMyLeaveBalancesQueryHandler : IRequestHandler<GetMyLeaveBalancesQuery, IReadOnlyList<LeaveBalanceDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetMyLeaveBalancesQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<IReadOnlyList<LeaveBalanceDto>> Handle(
        GetMyLeaveBalancesQuery request,
        CancellationToken cancellationToken)
    {
        var employeeId = request.TargetEmployeeId ?? _currentUserService.EmployeeId;
        if (!employeeId.HasValue || employeeId.Value == Guid.Empty)
        {
            throw new BadRequestException("Tài khoản chưa được liên kết với hồ sơ nhân sự.");
        }

        var employee = await _context.Employees
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == employeeId.Value, cancellationToken);

        if (employee is null)
        {
            throw new NotFoundException("Nhân viên", employeeId.Value);
        }

        var year = request.Year ?? DateTime.Now.Year;

        // Fetch all active leave types
        var leaveTypes = await _context.LeaveTypes
            .AsNoTracking()
            .Where(lt => lt.IsActive)
            .OrderBy(lt => lt.LeaveTypeCode)
            .ToListAsync(cancellationToken);

        // Fetch existing balances
        var balances = await _context.LeaveBalances
            .AsNoTracking()
            .Include(lb => lb.LeaveType)
            .Where(lb => lb.EmployeeId == employeeId.Value && lb.LeaveYear == year)
            .ToListAsync(cancellationToken);

        var result = new List<LeaveBalanceDto>();

        foreach (var lt in leaveTypes)
        {
            var bal = balances.FirstOrDefault(b => b.LeaveTypeId == lt.Id);
            if (bal != null)
            {
                var remaining = bal.RemainingDays ??
                    ((bal.EntitledDays + bal.CarriedOverDays) - (bal.UsedDays + bal.PendingDays));

                result.Add(new LeaveBalanceDto(
                    bal.Id,
                    bal.EmployeeId,
                    employee.FullName,
                    lt.Id,
                    lt.LeaveTypeCode,
                    lt.LeaveTypeName,
                    lt.IsPaid,
                    bal.LeaveYear,
                    bal.EntitledDays,
                    bal.CarriedOverDays,
                    bal.UsedDays,
                    bal.PendingDays,
                    remaining));
            }
            else
            {
                // Uninitialized balance shows default days
                result.Add(new LeaveBalanceDto(
                    Guid.Empty,
                    employee.Id,
                    employee.FullName,
                    lt.Id,
                    lt.LeaveTypeCode,
                    lt.LeaveTypeName,
                    lt.IsPaid,
                    year,
                    lt.DefaultDaysPerYear,
                    0m,
                    0m,
                    0m,
                    lt.DefaultDaysPerYear));
            }
        }

        return result;
    }
}

