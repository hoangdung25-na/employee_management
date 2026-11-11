using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Application.Users.DTOs;
using EmployeeManagement.Domain.Employees.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Users.Queries.GetUnlinkedEmployees;

/// <summary>
/// Retrieves active employees who do not yet have a linked User account (or includes a specific employee when editing).
/// </summary>
public record GetUnlinkedEmployeesQuery(Guid? IncludeEmployeeId = null) : IRequest<IReadOnlyList<UnlinkedEmployeeOptionDto>>;

public class GetUnlinkedEmployeesQueryHandler : IRequestHandler<GetUnlinkedEmployeesQuery, IReadOnlyList<UnlinkedEmployeeOptionDto>>
{
    private readonly IApplicationDbContext _context;

    public GetUnlinkedEmployeesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<UnlinkedEmployeeOptionDto>> Handle(GetUnlinkedEmployeesQuery request, CancellationToken cancellationToken)
    {
        var linkedEmployeeIdsQuery = _context.Users
            .AsNoTracking()
            .Where(u => u.EmployeeId.HasValue && (!request.IncludeEmployeeId.HasValue || u.EmployeeId != request.IncludeEmployeeId.Value))
            .Select(u => u.EmployeeId!.Value);

        return await _context.Employees
            .AsNoTracking()
            .Where(e => e.Status != EmployeeStatus.Terminated && !linkedEmployeeIdsQuery.Contains(e.Id))
            .OrderBy(e => e.EmployeeCode)
            .Select(e => new UnlinkedEmployeeOptionDto(
                e.Id,
                e.EmployeeCode,
                e.FullName,
                e.WorkEmail,
                e.Department.DepartmentName,
                e.Position.PositionName))
            .ToListAsync(cancellationToken);
    }
}

