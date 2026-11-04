using MediatR;

namespace EmployeeManagement.Application.Timesheets.Commands.SubmitTimesheets;

public record SubmitTimesheetsCommand(
    IReadOnlyList<Guid>? EntryIds,
    DateOnly? FromDate,
    DateOnly? ToDate
) : IRequest<int>;

