using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Application.Timesheets.DTOs;
using EmployeeManagement.Domain.Timesheets.Consts;
using EmployeeManagement.Domain.Timesheets.Entities;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Timesheets.Commands.CreateTimesheetEntry;

public class CreateTimesheetEntryCommandHandler : IRequestHandler<CreateTimesheetEntryCommand, TimesheetEntryDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CreateTimesheetEntryCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<TimesheetEntryDto> Handle(
        CreateTimesheetEntryCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Resolve target employee
        var employeeId = request.TargetEmployeeId ?? _currentUserService.EmployeeId;
        if (!employeeId.HasValue || employeeId.Value == Guid.Empty)
        {
            throw new BadRequestException("Tài khoản chưa được liên kết với hồ sơ nhân sự.");
        }

        // Anti-IDOR check: only HR or Manager can submit on behalf of others
        if (request.TargetEmployeeId.HasValue &&
            request.TargetEmployeeId.Value != _currentUserService.EmployeeId)
        {
            var canManage = _currentUserService.IsInRole(UserConsts.Roles.SuperAdmin) ||
                            _currentUserService.IsInRole(UserConsts.Roles.HrManager) ||
                            _currentUserService.HasPermission(UserConsts.Permissions.TimesheetApprove);

            if (!canManage)
            {
                throw new ForbiddenException("Bạn không có quyền kê khai timesheet hộ nhân viên khác.");
            }
        }

        var employee = await _context.Employees
            .Include(e => e.Department)
            .FirstOrDefaultAsync(e => e.Id == employeeId.Value, cancellationToken);

        if (employee is null)
        {
            throw new NotFoundException("Nhân viên", employeeId.Value);
        }

        // 2. Validate input
        if (string.IsNullOrWhiteSpace(request.ProjectCode))
        {
            throw new BadRequestException("Mã dự án (ProjectCode) không được để trống.");
        }

        if (string.IsNullOrWhiteSpace(request.ProjectName))
        {
            throw new BadRequestException("Tên dự án (ProjectName) không được để trống.");
        }

        if (string.IsNullOrWhiteSpace(request.TaskTitle))
        {
            throw new BadRequestException("Tiêu đề công việc (TaskTitle) không được để trống.");
        }

        if (request.HoursWorked < TimesheetConsts.MinHoursPerEntry || request.HoursWorked > TimesheetConsts.MaxHoursPerDay)
        {
            throw new BadRequestException($"Số giờ làm phải từ {TimesheetConsts.MinHoursPerEntry} đến {TimesheetConsts.MaxHoursPerDay} giờ.");
        }

        // Check total hours on this day for employee
        var existingDailyHours = await _context.TimesheetEntries
            .Where(t => t.EmployeeId == employeeId.Value && t.WorkDate == request.WorkDate && t.Status != TimesheetConsts.Status.Rejected)
            .SumAsync(t => t.HoursWorked, cancellationToken);

        if (existingDailyHours + request.HoursWorked > TimesheetConsts.MaxHoursPerDay)
        {
            throw new BadRequestException($"Tổng số giờ làm trong ngày {request.WorkDate:dd/MM/yyyy} đã vượt quá {TimesheetConsts.MaxHoursPerDay} giờ (Hiện có {existingDailyHours:0.##}h + thêm {request.HoursWorked:0.##}h).");
        }

        // 3. Create entry
        var entry = new TimesheetEntry
        {
            Id = Guid.NewGuid(),
            EmployeeId = employeeId.Value,
            WorkDate = request.WorkDate,
            ProjectCode = request.ProjectCode.Trim().ToUpperInvariant(),
            ProjectName = request.ProjectName.Trim(),
            TaskTitle = request.TaskTitle.Trim(),
            HoursWorked = Math.Round(request.HoursWorked, 2),
            IsBillable = request.IsBillable,
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            Status = request.SubmitImmediately ? TimesheetConsts.Status.Submitted : TimesheetConsts.Status.Draft,
            CreatedAt = DateTime.UtcNow
        };

        _context.TimesheetEntries.Add(entry);
        await _context.SaveChangesAsync(cancellationToken);

        return new TimesheetEntryDto
        {
            Id = entry.Id,
            EmployeeId = entry.EmployeeId,
            EmployeeCode = employee.EmployeeCode,
            EmployeeFullName = employee.FullName,
            DepartmentName = employee.Department?.DepartmentName ?? string.Empty,
            WorkDate = entry.WorkDate,
            ProjectCode = entry.ProjectCode,
            ProjectName = entry.ProjectName,
            TaskTitle = entry.TaskTitle,
            HoursWorked = entry.HoursWorked,
            IsBillable = entry.IsBillable,
            Description = entry.Description,
            Status = entry.Status,
            ApprovedByEmployeeId = null,
            ApproverFullName = null,
            ApprovedAt = null,
            RejectionReason = null,
            CreatedAt = entry.CreatedAt
        };
    }
}

