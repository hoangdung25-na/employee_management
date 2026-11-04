using EmployeeManagement.Application.Attendance.DTOs;
using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Domain.Attendance.Consts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Attendance.Queries.GetTodayAttendance;

/// <summary>
/// Query handler returning today's real-time attendance status, assigned shift details,
/// and whether the employee can check-in or check-out right now.
/// </summary>
public class GetTodayAttendanceQueryHandler : IRequestHandler<GetTodayAttendanceQuery, TodayAttendanceStatusDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetTodayAttendanceQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<TodayAttendanceStatusDto> Handle(
        GetTodayAttendanceQuery request,
        CancellationToken cancellationToken)
    {
        var employeeId = request.TargetEmployeeId ?? _currentUserService.EmployeeId;
        if (!employeeId.HasValue || employeeId.Value == Guid.Empty)
        {
            throw new BadRequestException("Tài khoản chưa được liên kết với hồ sơ nhân viên.");
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

        // 1. Resolve work shift
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
        }

        var shiftDto = workShift != null ? new WorkShiftDto(
            workShift.Id,
            workShift.ShiftCode,
            workShift.ShiftName,
            workShift.StartTime,
            workShift.EndTime,
            workShift.BreakMinutes,
            workShift.GracePeriodMinutes,
            workShift.StandardHours,
            workShift.IsNightShift,
            workShift.IsActive) : null!;

        // 2. Query today's log
        var log = await _context.AttendanceLogs
            .AsNoTracking()
            .FirstOrDefaultAsync(al => al.EmployeeId == employeeId.Value && al.AttendanceDate == today, cancellationToken);

        var hasCheckedIn = log != null && log.CheckInTime.HasValue;
        var hasCheckedOut = log != null && log.CheckOutTime.HasValue;

        var workingHours = log?.WorkingHours ?? 0m;
        // If checked in but not checked out yet, calculate live working hours
        if (hasCheckedIn && !hasCheckedOut && log!.CheckInTime.HasValue && workShift != null)
        {
            var elapsed = now - log.CheckInTime.Value;
            var breakDuration = TimeSpan.FromMinutes(workShift.BreakMinutes);
            var netDuration = elapsed > breakDuration ? elapsed - breakDuration : elapsed;
            workingHours = Math.Max(0, Math.Round((decimal)netDuration.TotalHours, 2));
        }

        var lateMinutes = log?.LateMinutes ?? 0;
        var earlyLeaveMinutes = log?.EarlyLeaveMinutes ?? 0;
        var status = log?.Status ?? AttendanceConsts.AttendanceStatuses.Absent;

        var canCheckIn = !hasCheckedIn;
        var canCheckOut = hasCheckedIn; // Allow re-check out anytime during shift

        return new TodayAttendanceStatusDto(
            employee.Id,
            employee.FullName,
            today,
            hasCheckedIn,
            hasCheckedOut,
            log?.CheckInTime,
            log?.CheckOutTime,
            workingHours,
            lateMinutes,
            earlyLeaveMinutes,
            status,
            shiftDto,
            canCheckIn,
            canCheckOut);
    }
}

