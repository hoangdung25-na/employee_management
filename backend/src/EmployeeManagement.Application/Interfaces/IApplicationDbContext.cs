using EmployeeManagement.Domain.Codes.Entities;
using EmployeeManagement.Domain.Departments.Entities;
using EmployeeManagement.Domain.Employees.Entities;
using EmployeeManagement.Domain.Positions.Entities;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Interfaces;

/// <summary>
/// Abstraction over the EF Core DbContext for the Application Layer (Dependency Inversion Principle).
/// </summary>
public interface IApplicationDbContext
{
    DbSet<Employee> Employees { get; }
    DbSet<Department> Departments { get; }
    DbSet<Position> Positions { get; }
    DbSet<CodeSequence> CodeSequences { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
