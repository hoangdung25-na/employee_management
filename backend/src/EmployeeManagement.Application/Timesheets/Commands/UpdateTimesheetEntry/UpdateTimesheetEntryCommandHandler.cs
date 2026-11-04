using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Application.Timesheets.DTOs;
using EmployeeManagement.Domain.Timesheets.Consts;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Timesheets.Commands.UpdateTimesheetEntry;

public class UpdateTimesheetEntryCommandHandler : IRequestHandler<UpdateTimesheetEntryCommand, TimesheetEntryDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UpdateTimesheetEntryCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<TimesheetEntryDto> Handle(
        UpdateTimesheetEntryCommand request,
        CancellationToken cancellationToken)
    {
        var entry = await _context.TimesheetEntries
            .Include(t => t.Employee)
                .ThenInclude(e => e.Department)
            .Include(t => t.ApprovedByEmployee)
            .FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);

        if (entry is null)
        {
            throw new NotFoundException("Bản ghi timesheet", request.Id);
        }

        // Ownership or management check
        var isOwner = entry.EmployeeId == _currentUserService.EmployeeId;
        var canManage = _currentUserService.IsInRole(UserConsts.Roles.SuperAdmin) ||
                        _currentUserService.IsInRole(UserConsts.Roles.HrManager);

        if (!isOwner && !canManage)
        {
            throw new ForbiddenException("Bạn không có quyền chỉnh sửa bản ghi timesheet này.");
        }

        if (entry.Status == TimesheetConsts.Status.Approved)
        {
            throw new BadRequestException("Bản ghi timesheet đã được phê duyệt, không thể chỉnh sửa.");
        }

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

        // Check daily hours excluding this entry
        var existingDailyHours = await _context.TimesheetEntries
            .Where(t => t.EmployeeId == entry.EmployeeId && t.WorkDate == request.WorkDate && t.Id != entry.Id && t.Status != TimesheetConsts.Status.Rejected)
            .SumAsync(t => t.HoursWorked, cancellationToken);

        if (existingDailyHours + request.HoursWorked > TimesheetConsts.MaxHoursPerDay)
        {
            throw new BadRequestException($"Tổng số giờ làm trong ngày {request.WorkDate:dd/MM/yyyy} đã vượt quá {TimesheetConsts.MaxHoursPerDay} giờ.");
        }

        entry.WorkDate = request.WorkDate;
        entry.ProjectCode = request.ProjectCode.Trim().ToUpperInvariant();
        entry.ProjectName = request.ProjectName.Trim();
        entry.TaskTitle = request.TaskTitle.Trim();
        entry.HoursWorked = Math.Round(request.HoursWorked, 2);
        entry.IsBillable = request.IsBillable;
        entry.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        entry.Status = request.SubmitImmediately ? TimesheetConsts.Status.Submitted : TimesheetConsts.Status.Draft;
        entry.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

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
            ApproverFullName = entry.ApprovedByEmployee?.FullName,
            ApprovedAt = entry.ApprovedAt,
            RejectionReason = entry.RejectionReason,
            CreatedAt = entry.CreatedAt
        };
    }
}

