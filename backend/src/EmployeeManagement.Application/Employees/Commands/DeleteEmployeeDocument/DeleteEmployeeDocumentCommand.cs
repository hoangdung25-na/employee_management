using MediatR;

namespace EmployeeManagement.Application.Employees.Commands.DeleteEmployeeDocument;

/// <summary>
/// Command to soft-delete an employee document (DELETE /api/employees/{id:guid}/documents/{docId:guid}).
/// </summary>
public record DeleteEmployeeDocumentCommand(Guid EmployeeId, Guid DocumentId) : IRequest<bool>;

