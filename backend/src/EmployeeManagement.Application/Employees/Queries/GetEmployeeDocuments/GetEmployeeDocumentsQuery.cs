using EmployeeManagement.Application.Employees.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Employees.Queries.GetEmployeeDocuments;

/// <summary>
/// Query to retrieve digital documents for an employee (GET /api/employees/{id:guid}/documents).
/// </summary>
public record GetEmployeeDocumentsQuery(Guid EmployeeId) : IRequest<IReadOnlyList<EmployeeDocumentDto>>;

