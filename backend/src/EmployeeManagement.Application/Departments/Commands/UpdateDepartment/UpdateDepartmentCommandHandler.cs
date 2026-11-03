using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Departments.DTOs;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Domain.Employees.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Departments.Commands.UpdateDepartment;

/// <summary>
/// Handles updating a department, including circular hierarchy detection (anti-cycle check).
/// </summary>
public class UpdateDepartmentCommandHandler : IRequestHandler<UpdateDepartmentCommand, DepartmentResponseDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateDepartmentCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DepartmentResponseDto> Handle(
        UpdateDepartmentCommand request,
        CancellationToken cancellationToken)
    {
        var department = await _context.Departments
            .FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken);

        if (department is null)
        {
            throw new NotFoundException("Phòng ban", request.Id);
        }

        // 1. Validate ParentDepartmentId & prevent circular hierarchy
        string? parentDepartmentName = null;
        if (request.ParentDepartmentId.HasValue)
        {
            if (request.ParentDepartmentId.Value == request.Id)
            {
                throw new BadRequestException("Không thể chọn chính phòng ban này làm phòng ban cấp trên.");
            }

            var allDepartments = await _context.Departments
                .AsNoTracking()
                .Select(d => new { d.Id, d.DepartmentName, d.ParentDepartmentId })
                .ToListAsync(cancellationToken);

            var parentNode = allDepartments.FirstOrDefault(d => d.Id == request.ParentDepartmentId.Value);
            if (parentNode is null)
            {
                throw new NotFoundException("Phòng ban cấp trên", request.ParentDepartmentId.Value);
            }

            parentDepartmentName = parentNode.DepartmentName;

            // Walk up the ancestor chain of the proposed parent to ensure it does not cycle back to request.Id
            var currentAncestorId = parentNode.ParentDepartmentId;
            var visited = new HashSet<Guid> { request.Id };
            while (currentAncestorId.HasValue)
            {
                if (!visited.Add(currentAncestorId.Value))
                {
                    throw new BadRequestException("Không thể chọn phòng ban con cấp dưới làm phòng ban cấp trên (lỗi vòng lặp phân cấp).");
                }

                var ancestor = allDepartments.FirstOrDefault(d => d.Id == currentAncestorId.Value);
                currentAncestorId = ancestor?.ParentDepartmentId;
            }
        }

        // 2. Validate ManagerId if provided
        string? managerName = null;
        if (request.ManagerId.HasValue)
        {
            managerName = await _context.Employees
                .AsNoTracking()
                .Where(e => e.Id == request.ManagerId.Value && e.Status != EmployeeStatus.Terminated)
                .Select(e => e.FullName)
                .FirstOrDefaultAsync(cancellationToken);

            if (managerName is null)
            {
                throw new BadRequestException("Nhân sự được chọn làm Trưởng phòng không tồn tại hoặc đã thôi việc.");
            }
        }

        department.DepartmentName = request.DepartmentName.Trim();
        department.ParentDepartmentId = request.ParentDepartmentId;
        department.ManagerId = request.ManagerId;
        department.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        department.IsActive = request.IsActive;
        department.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        var employeeCount = await _context.Employees
            .AsNoTracking()
            .CountAsync(
                e => e.DepartmentId == department.Id && (e.Status == EmployeeStatus.Active || e.Status == EmployeeStatus.Probation),
                cancellationToken);

        return new DepartmentResponseDto(
            department.Id,
            department.DepartmentCode,
            department.DepartmentName,
            department.ParentDepartmentId,
            parentDepartmentName,
            department.ManagerId,
            managerName,
            employeeCount,
            department.IsActive,
            department.Description,
            department.CreatedAt);
    }
}

