using EmployeeManagement.Application.Timesheets.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Timesheets.Commands.ReviewTimesheetEntry;

public record ReviewTimesheetEntryCommand(
    Guid Id,
    bool IsApproved,
    string? RejectionReason
) : IRequest<TimesheetEntryDto>;

