using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Domain.Employees.Consts;
using EmployeeManagement.Domain.Employees.Entities;
using EmployeeManagement.Domain.Employees.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Employees.Commands.TerminateEmployee;

/// <summary>
/// Executes the atomic employee termination workflow (Offboarding Security Hook):
/// 1. Sets Employee Status = Terminated, TerminationDate, TerminationReason.
/// 2. Unassigns Department ManagerId if the employee was heading any department.
/// 3. Immediately deactivates linked User account, revokes RefreshToken, and rotates SecurityStamp.
/// </summary>
public class TerminateEmployeeCommandHandler : IRequestHandler<TerminateEmployeeCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public TerminateEmployeeCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(
        TerminateEmployeeCommand request,
        CancellationToken cancellationToken)
    {
        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == request.Id, cancellationToken);

        if (employee is null)
        {
            throw new NotFoundException("Nhân viên", request.Id);
        }

        if (employee.Status == EmployeeStatus.Terminated)
        {
            throw new BadRequestException("Nhân viên này đã ở trạng thái thôi việc.");
        }

        if (request.TerminationDate < employee.HireDate)
        {
            throw new BadRequestException("Ngày thôi việc phải lớn hơn hoặc bằng ngày vào làm.");
        }

        var strategy = _context.Database.CreateExecutionStrategy();

        await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            var nowUtc = DateTime.UtcNow;

            // 1. Update Employee status and termination details
            employee.Status = EmployeeStatus.Terminated;
            employee.TerminationDate = request.TerminationDate;
            employee.TerminationReason = request.TerminationReason.Trim();
            employee.UpdatedAt = nowUtc;

            // 2. Unassign Department ManagerId if the employee manages any departments
            var managedDepartments = await _context.Departments
                .Where(d => d.ManagerId == employee.Id)
                .ToListAsync(cancellationToken);

            foreach (var dept in managedDepartments)
            {
                dept.ManagerId = null;
                dept.UpdatedAt = nowUtc;
            }

            // 3. Offboarding Security Hook: Immediately deactivate linked User account & revoke tokens
            var linkedUser = await _context.Users
                .FirstOrDefaultAsync(u => u.EmployeeId == employee.Id, cancellationToken);

            if (linkedUser is not null)
            {
                linkedUser.IsActive = false;
                linkedUser.RefreshToken = null;
                linkedUser.RefreshTokenExpiryTime = null;
                linkedUser.SecurityStamp = Guid.NewGuid().ToString();
                linkedUser.UpdatedAt = nowUtc;
            }

            // 4. Auto-generate Offboarding Checklist from active OnboardingTemplates (Phase 5)
            var offboardingTemplates = await _context.OnboardingTemplates
                .AsNoTracking()
                .Where(t => t.ProcessType == OnboardingConsts.ProcessTypes.Offboarding && t.IsActive)
                .OrderBy(t => t.SortOrder)
                .ToListAsync(cancellationToken);

            foreach (var template in offboardingTemplates)
            {
                Guid? assignedTo = null;
                if (template.AssignedRole == OnboardingConsts.AssignedRoles.Employee)
                {
                    assignedTo = employee.Id;
                }
                else if (template.AssignedRole == OnboardingConsts.AssignedRoles.Manager)
                {
                    assignedTo = employee.DirectManagerId;
                }

                var offboardingTask = new EmployeeOnboardingTask
                {
                    Id = Guid.NewGuid(),
                    EmployeeId = employee.Id,
                    ProcessType = OnboardingConsts.ProcessTypes.Offboarding,
                    TaskName = template.TaskName,
                    AssignedRole = template.AssignedRole,
                    AssignedToEmployeeId = assignedTo,
                    DueDate = request.TerminationDate.AddDays(template.DefaultDueDays),
                    Status = OnboardingConsts.TaskStatuses.Pending,
                    Notes = template.Description,
                    IsDeleted = false,
                    CreatedAt = nowUtc
                };

                await _context.EmployeeOnboardingTasks.AddAsync(offboardingTask, cancellationToken);
            }

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        });

        return true;
    }
}

