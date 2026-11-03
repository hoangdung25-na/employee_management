using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Departments.DTOs;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Domain.Employees.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Departments.Queries.GetDepartmentById;

/// <summary>
/// Read-only query handler for retrieving detailed department information and its active/probation members.
/// </summary>
public class GetDepartmentByIdQueryHandler : IRequestHandler<GetDepartmentByIdQuery, DepartmentDetailResponseDto>
{
    private readonly IApplicationDbContext _context;

    public GetDepartmentByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DepartmentDetailResponseDto> Handle(
        GetDepartmentByIdQuery request,
        CancellationToken cancellationToken)
    {
        var department = await _context.Departments
            .AsNoTracking()
            .Where(d => d.Id == request.Id)
            .Select(d => new
            {
                d.Id,
                d.DepartmentCode,
                d.DepartmentName,
                d.ParentDepartmentId,
                ParentDepartmentName = d.ParentDepartment != null ? d.ParentDepartment.DepartmentName : null,
                d.ManagerId,
                ManagerName = d.Manager != null ? d.Manager.FullName : null,
                d.IsActive,
                d.Description,
                d.CreatedAt,
                d.UpdatedAt
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (department is null)
        {
            throw new NotFoundException("Phòng ban", request.Id);
        }

        var members = await _context.Employees
            .AsNoTracking()
            .Where(e => e.DepartmentId == request.Id && (e.Status == EmployeeStatus.Active || e.Status == EmployeeStatus.Probation))
            .OrderBy(e => e.EmployeeCode)
            .Select(e => new DepartmentMemberDto(
                e.Id,
                e.EmployeeCode,
                e.FullName,
                e.WorkEmail,
                e.Position.PositionName,
                e.AvatarUrl,
                e.Status.ToString()))
            .ToListAsync(cancellationToken);

        return new DepartmentDetailResponseDto(
            department.Id,
            department.DepartmentCode,
            department.DepartmentName,
            department.ParentDepartmentId,
            department.ParentDepartmentName,
            department.ManagerId,
            department.ManagerName,
            members.Count,
            department.IsActive,
            department.Description,
            department.CreatedAt,
            department.UpdatedAt,
            members);
    }
}

