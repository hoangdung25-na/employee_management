using EmployeeManagement.Application.Attendance.DTOs;
using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Domain.Attendance.Consts;
using EmployeeManagement.Domain.Attendance.Entities;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Attendance.Commands.CheckIn;

/// <summary>
/// Command handler executing daily attendance Check-In:
/// 1. Resolves employee and active work shift assignment (or default SHIFT_HC).
/// 2. Ensures no duplicate check-in today.
/// 3. Computes late minutes against GracePeriodMinutes.
/// 4. Records check-in method and IP address.
/// </summary>
public class CheckInCommandHandler : IRequestHandler<CheckInCommand, AttendanceLogDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CheckInCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<AttendanceLogDto> Handle(
        CheckInCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Resolve target employee
        var employeeId = request.TargetEmployeeId ?? _currentUserService.EmployeeId;
        if (!employeeId.HasValue || employeeId.Value == Guid.Empty)
        {
            throw new BadRequestException("Tài khoản người dùng hiện tại chưa được liên kết với hồ sơ nhân viên.");
        }

        // Anti-IDOR check if checking in for someone else
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

        // 2. Check for existing attendance log today
        var existingLog = await _context.AttendanceLogs
            .Include(al => al.WorkShift)
            .FirstOrDefaultAsync(al => al.EmployeeId == employeeId.Value && al.AttendanceDate == today, cancellationToken);

        if (existingLog != null && existingLog.CheckInTime.HasValue)
        {
            throw new BadRequestException($"Bạn đã thực hiện Check-in ngày hôm nay lúc {existingLog.CheckInTime.Value:HH:mm:ss} rồi.");
        }

        // 3. Resolve active work shift assignment (or default SHIFT_HC)
        var shiftAssignment = await _context.EmployeeShiftAssignments
            .Include(esa => esa.WorkShift)
            .Where(esa => esa.EmployeeId == employeeId.Value &&
                          esa.EffectiveDate <= today &&
                          (!esa.ExpiryDate.HasValue || esa.ExpiryDate.Value >= today))
            .OrderByDescending(esa => esa.EffectiveDate)
            .FirstOrDefaultAsync(cancellationToken);

        var workShift = shiftAssignment?.WorkShift;
        if (workShift is null)
        {
            workShift = await _context.WorkShifts
                .FirstOrDefaultAsync(ws => ws.ShiftCode == "SHIFT_HC" && ws.IsActive, cancellationToken)
                ?? await _context.WorkShifts.FirstOrDefaultAsync(ws => ws.IsActive, cancellationToken);

            if (workShift is null)
            {
                throw new BadRequestException("Hệ thống chưa cấu hình ca làm việc mặc định.");
            }
        }

        // 4. Calculate punctuality (LateMinutes)
        var currentTime = now.TimeOfDay;
        var graceEnd = workShift.StartTime.Add(TimeSpan.FromMinutes(workShift.GracePeriodMinutes));
        var lateMinutes = 0;
        var status = AttendanceConsts.AttendanceStatuses.Present;

        if (currentTime > graceEnd)
        {
            lateMinutes = (int)Math.Max(0, (currentTime - workShift.StartTime).TotalMinutes);
            status = AttendanceConsts.AttendanceStatuses.Late;
        }

        AttendanceLog log;
        if (existingLog != null)
        {
            // Update existing empty log (e.g., created in advance or from leave request)
            existingLog.CheckInTime = now;
            existingLog.CheckInMethod = AttendanceConsts.CheckInMethods.Web;
            existingLog.CheckInIpAddress = request.IpAddress;
            existingLog.LateMinutes = lateMinutes;
            existingLog.Status = status;
            existingLog.WorkShiftId = workShift.Id;
            existingLog.Notes = request.Notes?.Trim();
            existingLog.UpdatedAt = DateTime.UtcNow;
            log = existingLog;
        }
        else
        {
            log = new AttendanceLog
            {
                Id = Guid.NewGuid(),
                EmployeeId = employeeId.Value,
                WorkShiftId = workShift.Id,
                AttendanceDate = today,
                CheckInTime = now,
                CheckInMethod = AttendanceConsts.CheckInMethods.Web,
                CheckInIpAddress = request.IpAddress,
                WorkingHours = 0m,
                OvertimeHours = 0m,
                LateMinutes = lateMinutes,
                EarlyLeaveMinutes = 0,
                Status = status,
                Notes = request.Notes?.Trim(),
                CreatedAt = DateTime.UtcNow
            };
            await _context.AttendanceLogs.AddAsync(log, cancellationToken);
        }

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
