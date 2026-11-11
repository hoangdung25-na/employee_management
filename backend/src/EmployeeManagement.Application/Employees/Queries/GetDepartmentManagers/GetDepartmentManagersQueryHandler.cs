using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Domain.Employees.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Employees.Queries.GetDepartmentManagers;

/// <summary>
/// Read-only query handler returning only authorized Manager candidates.
/// Restricts candidates by DepartmentId and JobLevel (Level 1: Executive/BOD, Level 2: Manager/Lead).
/// </summary>
public class GetDepartmentManagersQueryHandler : IRequestHandler<GetDepartmentManagersQuery, IReadOnlyList<ManagerOptionDto>>
{
    private readonly IApplicationDbContext _context;

    public GetDepartmentManagersQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<ManagerOptionDto>> Handle(
        GetDepartmentManagersQuery request,
        CancellationToken cancellationToken)
    {
        var targetDeptId = request.DepartmentId;
        Guid? deptHeadId = null;
        Guid? parentDeptHeadId = null;

        if (targetDeptId.HasValue && targetDeptId.Value != Guid.Empty)
        {
            var dept = await _context.Departments
                .AsNoTracking()
                .Include(d => d.ParentDepartment)
                .FirstOrDefaultAsync(d => d.Id == targetDeptId.Value, cancellationToken);

            if (dept != null)
            {
                deptHeadId = dept.ManagerId;
                parentDeptHeadId = dept.ParentDepartment?.ManagerId;
            }
        }

        var query = _context.Employees
            .AsNoTracking()
            .Include(e => e.Position)
            .Include(e => e.Department)
            .Where(e => !e.IsDeleted && e.Status != EmployeeStatus.Terminated);

        if (request.ExcludeEmployeeId.HasValue && request.ExcludeEmployeeId.Value != Guid.Empty)
        {
            var excludeId = request.ExcludeEmployeeId.Value;
            query = query.Where(e => e.Id != excludeId);
        }

        if (targetDeptId.HasValue && targetDeptId.Value != Guid.Empty)
        {
            var deptId = targetDeptId.Value;
            // Criteria:
            // 1. Executive / BOD member (JobLevel == 1)
            // 2. Department Manager (deptHeadId) or Parent Department Manager (parentDeptHeadId)
            // 3. Or manager in the SAME department with JobLevel <= 2
            query = query.Where(e =>
                e.Position.JobLevel == 1 ||
                (deptHeadId.HasValue && e.Id == deptHeadId.Value) ||
                (parentDeptHeadId.HasValue && e.Id == parentDeptHeadId.Value) ||
                (e.DepartmentId == deptId && e.Position.JobLevel <= 2));
        }
        else
        {
            // If no department specified, only employees with JobLevel <= 2 can be managers
            query = query.Where(e => e.Position.JobLevel <= 2);
        }

        var employees = await query
            .OrderBy(e => e.Position.JobLevel)
            .ThenBy(e => e.FullName)
            .Select(e => new
            {
                e.Id,
                e.EmployeeCode,
                e.FullName,
                PositionName = e.Position.PositionName,
                DepartmentName = e.Department.DepartmentName,
                JobLevel = e.Position.JobLevel,
                IsDepartmentHead = deptHeadId.HasValue && e.Id == deptHeadId.Value
            })
            .ToListAsync(cancellationToken);

        return employees.Select(e => new ManagerOptionDto(
            e.Id,
            e.EmployeeCode,
            e.FullName,
            e.PositionName,
            e.DepartmentName,
            e.JobLevel,
            e.IsDepartmentHead
        )).ToList();
    }
}
