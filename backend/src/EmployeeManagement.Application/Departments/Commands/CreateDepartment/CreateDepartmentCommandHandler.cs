using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Departments.DTOs;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Domain.Departments.Entities;
using EmployeeManagement.Domain.Employees.Entities;
using EmployeeManagement.Domain.Employees.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Departments.Commands.CreateDepartment;

/// <summary>
/// Handles creating a new department after verifying unique DepartmentCode, valid ParentDepartmentId, and active ManagerId.
/// </summary>
public class CreateDepartmentCommandHandler : IRequestHandler<CreateDepartmentCommand, DepartmentResponseDto>
{
    private readonly IApplicationDbContext _context;

    public CreateDepartmentCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DepartmentResponseDto> Handle(
        CreateDepartmentCommand request,
        CancellationToken cancellationToken)
    {
        var code = request.DepartmentCode.Trim().ToUpperInvariant();

        // 1. Check duplicate DepartmentCode (AnyAsync per API_PERFORMANCE_RULES.md Rule #4)
        var codeExists = await _context.Departments
            .AnyAsync(d => d.DepartmentCode == code, cancellationToken);

        if (codeExists)
        {
            throw new ConflictException($"Mã phòng ban '{code}' đã tồn tại trong hệ thống.");
        }

        // 2. Validate ParentDepartmentId if provided
        string? parentDepartmentName = null;
        if (request.ParentDepartmentId.HasValue)
        {
            parentDepartmentName = await _context.Departments
                .AsNoTracking()
                .Where(d => d.Id == request.ParentDepartmentId.Value)
                .Select(d => d.DepartmentName)
                .FirstOrDefaultAsync(cancellationToken);

            if (parentDepartmentName is null)
            {
                throw new NotFoundException("Phòng ban cấp trên", request.ParentDepartmentId.Value);
            }
        }

        // 3. Validate & Synchronize ManagerId if provided
        string? managerName = null;
        Employee? managerEmployee = null;
        if (request.ManagerId.HasValue)
        {
            managerEmployee = await _context.Employees
                .Include(e => e.Position)
                .FirstOrDefaultAsync(e => e.Id == request.ManagerId.Value && e.Status != EmployeeStatus.Terminated, cancellationToken);

            if (managerEmployee is null)
            {
                throw new BadRequestException("Nhân sự được chọn làm Trưởng phòng không tồn tại hoặc đã thôi việc.");
            }
            managerName = managerEmployee.FullName;
        }

        var department = new Department
        {
            Id = Guid.NewGuid(),
            DepartmentCode = code,
            DepartmentName = request.DepartmentName.Trim(),
            ParentDepartmentId = request.ParentDepartmentId,
            ManagerId = request.ManagerId,
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            IsActive = true,
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow
        };

        if (managerEmployee != null)
        {
            managerEmployee.DepartmentId = department.Id;

            var highestDirector = await _context.Employees
                .Include(e => e.Position)
                .Where(e => !e.IsDeleted && e.Position.JobLevel == 1)
                .OrderBy(e => e.HireDate)
                .FirstOrDefaultAsync(cancellationToken);

            if (highestDirector != null && managerEmployee.Id != highestDirector.Id)
            {
                managerEmployee.DirectManagerId = highestDirector.Id;
            }
        }

        await _context.Departments.AddAsync(department, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return new DepartmentResponseDto(
            department.Id,
            department.DepartmentCode,
            department.DepartmentName,
            department.ParentDepartmentId,
            parentDepartmentName,
            department.ManagerId,
            managerName,
            0,
            department.IsActive,
            department.Description,
            department.CreatedAt);
    }
}

