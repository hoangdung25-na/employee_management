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

        // 2. Validate & Synchronize ManagerId if provided
        string? managerName = null;
        var oldManagerId = department.ManagerId;
        if (request.ManagerId.HasValue)
        {
            var managerEmployee = await _context.Employees
                .Include(e => e.Position)
                .FirstOrDefaultAsync(e => e.Id == request.ManagerId.Value && e.Status != EmployeeStatus.Terminated, cancellationToken);

            if (managerEmployee is null)
            {
                throw new BadRequestException("Nhân sự được chọn làm Trưởng phòng không tồn tại hoặc đã thôi việc.");
            }
            managerName = managerEmployee.FullName;

            // 2.1. Đảm bảo nhân sự được bổ nhiệm thuộc phòng ban này
            managerEmployee.DepartmentId = department.Id;

            // 2.2. Quy tắc phân cấp: Trưởng phòng mặc định báo cáo trực tiếp cho Giám đốc điều hành cấp cao nhất (CEO / JobLevel == 1)
            var highestDirector = await _context.Employees
                .Include(e => e.Position)
                .Where(e => !e.IsDeleted && e.Position.JobLevel == 1)
                .OrderBy(e => e.HireDate)
                .FirstOrDefaultAsync(cancellationToken);

            if (highestDirector != null && managerEmployee.Id != highestDirector.Id)
            {
                managerEmployee.DirectManagerId = highestDirector.Id;
            }

            // 2.3. Tự động đồng bộ Chức vụ của Trưởng phòng thành chức danh cấp Quản lý (JobLevel == 2) của phòng ban đó
            var deptManagerPosition = await _context.DepartmentPositions
                .Include(dp => dp.Position)
                .Where(dp => dp.DepartmentId == department.Id && dp.Position.JobLevel == 2 && dp.Position.IsActive)
                .Select(dp => dp.Position)
                .FirstOrDefaultAsync(cancellationToken);

            if (deptManagerPosition != null)
            {
                managerEmployee.PositionId = deptManagerPosition.Id;
            }

            // 2.4. Đồng bộ nhân viên cấp dưới trong phòng tự động nhận Trưởng phòng làm người Quản lý trực tiếp
            var subordinates = await _context.Employees
                .Where(e => !e.IsDeleted && e.DepartmentId == department.Id && e.Id != managerEmployee.Id &&
                            (e.DirectManagerId == null || (oldManagerId.HasValue && e.DirectManagerId == oldManagerId.Value)))
                .ToListAsync(cancellationToken);

            foreach (var sub in subordinates)
            {
                sub.DirectManagerId = managerEmployee.Id;
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

