using MediatR;

namespace EmployeeManagement.Application.Employees.Queries.GetDepartmentManagers;

/// <summary>
/// Query to retrieve eligible Direct Manager candidates filtered by Department and JobLevel hierarchy.
/// </summary>
public record GetDepartmentManagersQuery(
    Guid? DepartmentId = null,
    Guid? ExcludeEmployeeId = null
) : IRequest<IReadOnlyList<ManagerOptionDto>>;

