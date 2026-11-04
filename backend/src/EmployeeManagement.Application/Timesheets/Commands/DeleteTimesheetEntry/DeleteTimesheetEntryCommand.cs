using MediatR;

namespace EmployeeManagement.Application.Timesheets.Commands.DeleteTimesheetEntry;

public record DeleteTimesheetEntryCommand(Guid Id) : IRequest<bool>;

