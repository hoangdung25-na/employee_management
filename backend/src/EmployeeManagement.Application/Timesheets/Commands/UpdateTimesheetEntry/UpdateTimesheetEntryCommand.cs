using EmployeeManagement.Application.Timesheets.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Timesheets.Commands.UpdateTimesheetEntry;

public record UpdateTimesheetEntryCommand(
    Guid Id,
    DateOnly WorkDate,
    string ProjectCode,
    string ProjectName,
    string TaskTitle,
    decimal HoursWorked,
    bool IsBillable,
    string? Description,
    bool SubmitImmediately
) : IRequest<TimesheetEntryDto>;

