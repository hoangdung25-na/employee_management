using MediatR;

namespace EmployeeManagement.Application.Departments.Commands.DeleteDepartment;

/// <summary>
/// CQRS Command for soft-deleting a department (DELETE /api/departments/{id:guid}).
/// </summary>
public record DeleteDepartmentCommand(Guid Id) : IRequest<bool>;

