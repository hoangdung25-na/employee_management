using EmployeeManagement.Application.Timesheets.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Timesheets.Commands.CreateTimesheetEntry;

public record CreateTimesheetEntryCommand(
    DateOnly WorkDate,
    string ProjectCode,
    string ProjectName,
    string TaskTitle,
    decimal HoursWorked,
    bool IsBillable,
    string? Description,
    bool SubmitImmediately,
    Guid? TargetEmployeeId
) : IRequest<TimesheetEntryDto>;

