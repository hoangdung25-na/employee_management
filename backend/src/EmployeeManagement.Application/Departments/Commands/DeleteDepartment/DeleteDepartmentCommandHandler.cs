using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Departments.Commands.DeleteDepartment;

/// <summary>
/// Soft-deletes a department after verifying it has no affiliated employees and no child departments.
/// </summary>
public class DeleteDepartmentCommandHandler : IRequestHandler<DeleteDepartmentCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public DeleteDepartmentCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(DeleteDepartmentCommand request, CancellationToken cancellationToken)
    {
        var department = await _context.Departments
            .FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken);

        if (department is null)
        {
            throw new NotFoundException("Phòng ban", request.Id);
        }

        // Check 1: Does the department have any affiliated employees?
        var hasEmployees = await _context.Employees
            .AnyAsync(e => e.DepartmentId == request.Id, cancellationToken);

        if (hasEmployees)
        {
            throw new BadRequestException("Không thể xóa phòng ban đang có nhân sự trực thuộc.");
        }

        // Check 2: Does the department have any child departments?
        var hasSubDepartments = await _context.Departments
            .AnyAsync(d => d.ParentDepartmentId == request.Id, cancellationToken);

        if (hasSubDepartments)
        {
            throw new BadRequestException("Không thể xóa phòng ban đang có phòng ban cấp dưới.");
        }

        department.IsDeleted = true;
        department.IsActive = false;
        department.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}

