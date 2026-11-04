using EmployeeManagement.Application.Attendance.DTOs;
using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Domain.Attendance.Consts;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Attendance.Commands.CheckOut;

/// <summary>
/// Command handler executing daily attendance Check-Out:
/// 1. Finds existing today's check-in record.
/// 2. Computes total working hours (minus shift lunch break).
/// 3. Computes early leave minutes if departing before shift end time.
/// 4. Computes overtime hours if working hours exceed standard shift hours.
/// </summary>
public class CheckOutCommandHandler : IRequestHandler<CheckOutCommand, AttendanceLogDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CheckOutCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<AttendanceLogDto> Handle(
        CheckOutCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Resolve employee
        var employeeId = request.TargetEmployeeId ?? _currentUserService.EmployeeId;
        if (!employeeId.HasValue || employeeId.Value == Guid.Empty)
        {
            throw new BadRequestException("Tài khoản người dùng hiện tại chưa được liên kết với hồ sơ nhân viên.");
        }

        // Anti-IDOR check
        if (request.TargetEmployeeId.HasValue &&
            request.TargetEmployeeId.Value != _currentUserService.EmployeeId)
        {
            var canManage = _currentUserService.IsInRole(UserConsts.Roles.SuperAdmin) ||
                            _currentUserService.IsInRole(UserConsts.Roles.HrManager) ||
                            _currentUserService.HasPermission(UserConsts.Permissions.AttendanceManage);

            if (!canManage)
            {
                throw new ForbiddenException("Bạn không có quyền thực hiện chấm công hộ cho nhân viên khác.");
            }
        }

        var employee = await _context.Employees
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == employeeId.Value, cancellationToken);

        if (employee is null)
        {
            throw new NotFoundException("Nhân viên", employeeId.Value);
        }

        var now = DateTime.Now;
        var today = DateOnly.FromDateTime(now);

        // 2. Find today's log
        var log = await _context.AttendanceLogs
            .Include(al => al.WorkShift)
            .FirstOrDefaultAsync(al => al.EmployeeId == employeeId.Value && al.AttendanceDate == today, cancellationToken);

        if (log is null || !log.CheckInTime.HasValue)
        {
            throw new BadRequestException("Bạn chưa thực hiện Check-in ngày hôm nay nên chưa thể ghi nhận Check-out.");
        }

        var workShift = log.WorkShift;

        // 3. Calculate hours
        log.CheckOutTime = now;

        var elapsed = now - log.CheckInTime.Value;
        var breakDuration = TimeSpan.FromMinutes(workShift.BreakMinutes);
        var netDuration = elapsed > breakDuration ? elapsed - breakDuration : elapsed;
        var workingHours = Math.Max(0, Math.Round((decimal)netDuration.TotalHours, 2));

        // Limit working hours to 24 max as enforced by database check constraint
        if (workingHours > 24m) workingHours = 24m;

        log.WorkingHours = workingHours;

        // Overtime calculation
        if (workingHours > workShift.StandardHours)
        {
            log.OvertimeHours = Math.Round(workingHours - workShift.StandardHours, 2);
        }
        else
        {
            log.OvertimeHours = 0m;
        }

        // Early leave calculation
        var currentTime = now.TimeOfDay;
        if (currentTime < workShift.EndTime)
        {
            log.EarlyLeaveMinutes = (int)Math.Max(0, (workShift.EndTime - currentTime).TotalMinutes);
            if (log.Status == AttendanceConsts.AttendanceStatuses.Present)
            {
                log.Status = AttendanceConsts.AttendanceStatuses.EarlyLeave;
            }
        }
        else
        {
            log.EarlyLeaveMinutes = 0;
        }

        if (!string.IsNullOrWhiteSpace(request.Notes))
        {
            log.Notes = string.IsNullOrWhiteSpace(log.Notes)
                ? request.Notes.Trim()
                : $"{log.Notes} | {request.Notes.Trim()}";
        }

        log.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return new AttendanceLogDto(
            log.Id,
            log.EmployeeId,
            employee.FullName,
            employee.EmployeeCode,
            workShift.Id,
            workShift.ShiftName,
            workShift.ShiftCode,
            log.AttendanceDate,
            log.CheckInTime,
            log.CheckOutTime,
            log.CheckInMethod,
            log.CheckInIpAddress,
            log.WorkingHours,
            log.OvertimeHours,
            log.LateMinutes,
            log.EarlyLeaveMinutes,
            log.Status,
            log.Notes);
    }
}
