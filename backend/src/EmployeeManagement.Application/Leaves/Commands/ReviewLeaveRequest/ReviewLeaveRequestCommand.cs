using EmployeeManagement.Application.Leaves.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Leaves.Commands.ReviewLeaveRequest;

/// <summary>
/// Command for a manager or HR to approve or reject a leave request.
/// </summary>
public record ReviewLeaveRequestCommand(
    Guid RequestId,
    bool IsApproved,
    string? ReviewComment = null
) : IRequest<LeaveRequestDto>;

