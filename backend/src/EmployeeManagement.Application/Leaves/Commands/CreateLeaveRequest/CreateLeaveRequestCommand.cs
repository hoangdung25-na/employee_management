using EmployeeManagement.Application.Leaves.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Leaves.Commands.CreateLeaveRequest;

/// <summary>
/// Command for an employee to submit a leave request.
/// </summary>
public record CreateLeaveRequestCommand(
    Guid LeaveTypeId,
    DateOnly StartDate,
    DateOnly EndDate,
    decimal TotalDays,
    string Reason,
    string? AttachmentUrl = null,
    Guid? TargetEmployeeId = null
) : IRequest<LeaveRequestDto>;
