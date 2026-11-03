using EmployeeManagement.Application.Departments.DTOs;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Domain.Employees.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Departments.Queries.GetDepartments;

/// <summary>
/// Read-only query handler for listing departments with active employee count (Active + Probation only).
/// </summary>
public class GetDepartmentsQueryHandler : IRequestHandler<GetDepartmentsQuery, IReadOnlyList<DepartmentResponseDto>>
{
    private readonly IApplicationDbContext _context;

    public GetDepartmentsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<DepartmentResponseDto>> Handle(
        GetDepartmentsQuery request,
        CancellationToken cancellationToken)
    {
        var query = _context.Departments
            .AsNoTracking()
            .AsQueryable();

        if (!request.IncludeInactive)
        {
            query = query.Where(d => d.IsActive);
        }

        if (!string.IsNullOrWhiteSpace(request.Keyword))
        {
            var keyword = request.Keyword.Trim();
            query = query.Where(d =>
                d.DepartmentCode.Contains(keyword) ||
                d.DepartmentName.Contains(keyword) ||
                (d.Description != null && d.Description.Contains(keyword)));
        }

        return await query
            .OrderBy(d => d.DepartmentCode)
            .Select(d => new DepartmentResponseDto(
                d.Id,
                d.DepartmentCode,
                d.DepartmentName,
                d.ParentDepartmentId,
                d.ParentDepartment != null ? d.ParentDepartment.DepartmentName : null,
                d.ManagerId,
                d.Manager != null ? d.Manager.FullName : null,
                d.Employees.Count(e => !e.IsDeleted && (e.Status == EmployeeStatus.Active || e.Status == EmployeeStatus.Probation)),
                d.IsActive,
                d.Description,
                d.CreatedAt))
            .ToListAsync(cancellationToken);
    }
}

