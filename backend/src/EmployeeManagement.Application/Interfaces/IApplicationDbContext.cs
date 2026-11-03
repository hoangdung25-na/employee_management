using EmployeeManagement.Domain.Codes.Entities;
using EmployeeManagement.Domain.Departments.Entities;
using EmployeeManagement.Domain.Employees.Entities;
using EmployeeManagement.Domain.Positions.Entities;
using EmployeeManagement.Domain.Users.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

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
    DbSet<User> Users { get; }
    DbSet<Role> Roles { get; }
    DbSet<Permission> Permissions { get; }
    DbSet<UserRole> UserRoles { get; }
    DbSet<RolePermission> RolePermissions { get; }

    DatabaseFacade Database { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
