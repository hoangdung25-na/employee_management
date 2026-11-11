namespace EmployeeManagement.Application.Employees.Queries.GetDepartmentManagers;

/// <summary>
/// Data Transfer Object representing an eligible Direct Manager candidate.
/// </summary>
public record ManagerOptionDto(
    Guid Id,
    string EmployeeCode,
    string FullName,
    string PositionName,
    string DepartmentName,
    int JobLevel,
    bool IsDepartmentHead
);

