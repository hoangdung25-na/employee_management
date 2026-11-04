using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Application.Timesheets.DTOs;
using EmployeeManagement.Domain.Timesheets.Consts;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Timesheets.Commands.ReviewTimesheetEntry;

public class ReviewTimesheetEntryCommandHandler : IRequestHandler<ReviewTimesheetEntryCommand, TimesheetEntryDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public ReviewTimesheetEntryCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<TimesheetEntryDto> Handle(
        ReviewTimesheetEntryCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Authorization: Must have Timesheet.Approve or be Admin / HR Manager / Manager
        var canApprove = _currentUserService.IsInRole(UserConsts.Roles.SuperAdmin) ||
                         _currentUserService.IsInRole(UserConsts.Roles.HrManager) ||
                         _currentUserService.IsInRole(UserConsts.Roles.Manager) ||
                         _currentUserService.HasPermission(UserConsts.Permissions.TimesheetApprove);

        if (!canApprove)
        {
            throw new ForbiddenException("Bạn không có quyền hạn phê duyệt hoặc từ chối timesheet.");
        }

        var approverId = _currentUserService.EmployeeId;

        // 2. Find entry
        var entry = await _context.TimesheetEntries
            .Include(t => t.Employee)
                .ThenInclude(e => e.Department)
            .FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);

        if (entry is null)
        {
            throw new NotFoundException("Bản ghi timesheet", request.Id);
        }

        if (entry.Status == TimesheetConsts.Status.Draft)
        {
            throw new BadRequestException("Bản ghi timesheet đang ở trạng thái Nháp (Draft), chưa được gửi để duyệt.");
        }

        if (request.IsApproved)
        {
            entry.Status = TimesheetConsts.Status.Approved;
            entry.ApprovedByEmployeeId = approverId;
            entry.ApprovedAt = DateTime.UtcNow;
            entry.RejectionReason = null;
        }
        else
        {
            if (string.IsNullOrWhiteSpace(request.RejectionReason))
            {
                throw new BadRequestException("Vui lòng nhập lý do từ chối bản ghi timesheet.");
            }

            entry.Status = TimesheetConsts.Status.Rejected;
            entry.ApprovedByEmployeeId = approverId;
            entry.ApprovedAt = DateTime.UtcNow;
            entry.RejectionReason = request.RejectionReason.Trim();
        }

        entry.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        var approverEmployee = approverId.HasValue
            ? await _context.Employees.FirstOrDefaultAsync(e => e.Id == approverId.Value, cancellationToken)
            : null;

        return new TimesheetEntryDto
        {
            Id = entry.Id,
            EmployeeId = entry.EmployeeId,
            EmployeeCode = entry.Employee.EmployeeCode,
            EmployeeFullName = entry.Employee.FullName,
            DepartmentName = entry.Employee.Department?.DepartmentName ?? string.Empty,
            WorkDate = entry.WorkDate,
            ProjectCode = entry.ProjectCode,
            ProjectName = entry.ProjectName,
            TaskTitle = entry.TaskTitle,
            HoursWorked = entry.HoursWorked,
            IsBillable = entry.IsBillable,
            Description = entry.Description,
            Status = entry.Status,
            ApprovedByEmployeeId = entry.ApprovedByEmployeeId,
            ApproverFullName = approverEmployee?.FullName,
            ApprovedAt = entry.ApprovedAt,
            RejectionReason = entry.RejectionReason,
            CreatedAt = entry.CreatedAt
        };
    }
}

