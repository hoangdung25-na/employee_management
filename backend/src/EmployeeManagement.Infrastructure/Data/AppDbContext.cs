using System.Reflection;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Domain.Codes.Entities;
using EmployeeManagement.Domain.Departments.Entities;
using EmployeeManagement.Domain.Employees.Entities;
using EmployeeManagement.Domain.Positions.Entities;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Infrastructure.Data;

/// <summary>
/// Primary EF Core DbContext implementing IApplicationDbContext.
/// Automatically loads all Fluent API configurations and applies Soft Delete global query filters.
/// </summary>
public class AppDbContext : DbContext, IApplicationDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Position> Positions => Set<Position>();
    public DbSet<CodeSequence> CodeSequences => Set<CodeSequence>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 1. Automatically scan and apply all IEntityTypeConfiguration<T> classes in the current assembly
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        // 2. Apply Global Query Filter for Soft Delete (!IsDeleted)
        modelBuilder.Entity<Employee>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Department>().HasQueryFilter(d => !d.IsDeleted);
        modelBuilder.Entity<Position>().HasQueryFilter(p => !p.IsDeleted);
    }
}
