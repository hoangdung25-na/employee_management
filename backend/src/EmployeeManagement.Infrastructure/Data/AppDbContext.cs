using System.Reflection;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Domain.Attendance.Entities;
using EmployeeManagement.Domain.Codes.Entities;
using EmployeeManagement.Domain.Departments.Entities;
using EmployeeManagement.Domain.Employees.Entities;
using EmployeeManagement.Domain.Leaves.Entities;
using EmployeeManagement.Domain.Positions.Entities;
using EmployeeManagement.Domain.Users.Entities;
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
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<EmployeeDocument> EmployeeDocuments => Set<EmployeeDocument>();
    public DbSet<EmployeeContract> EmployeeContracts => Set<EmployeeContract>();
    public DbSet<EmployeeDecision> EmployeeDecisions => Set<EmployeeDecision>();
    public DbSet<OnboardingTemplate> OnboardingTemplates => Set<OnboardingTemplate>();
    public DbSet<EmployeeOnboardingTask> EmployeeOnboardingTasks => Set<EmployeeOnboardingTask>();

    // Phase 6: Attendance & Leave Management
    public DbSet<WorkShift> WorkShifts => Set<WorkShift>();
    public DbSet<EmployeeShiftAssignment> EmployeeShiftAssignments => Set<EmployeeShiftAssignment>();
    public DbSet<AttendanceLog> AttendanceLogs => Set<AttendanceLog>();
    public DbSet<LeaveType> LeaveTypes => Set<LeaveType>();
    public DbSet<LeaveBalance> LeaveBalances => Set<LeaveBalance>();
    public DbSet<LeaveRequest> LeaveRequests => Set<LeaveRequest>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 1. Automatically scan and apply all IEntityTypeConfiguration<T> classes in the current assembly
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        // 2. Apply Global Query Filter for Soft Delete (!IsDeleted)
        modelBuilder.Entity<Employee>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Department>().HasQueryFilter(d => !d.IsDeleted);
        modelBuilder.Entity<Position>().HasQueryFilter(p => !p.IsDeleted);
        modelBuilder.Entity<User>().HasQueryFilter(u => !u.IsDeleted);
        modelBuilder.Entity<UserRole>().HasQueryFilter(ur => !ur.User.IsDeleted);
        modelBuilder.Entity<EmployeeDocument>().HasQueryFilter(ed => !ed.IsDeleted);
        modelBuilder.Entity<EmployeeContract>().HasQueryFilter(ec => !ec.IsDeleted);
        modelBuilder.Entity<EmployeeDecision>().HasQueryFilter(ed => !ed.IsDeleted);
        modelBuilder.Entity<OnboardingTemplate>().HasQueryFilter(ot => !ot.IsDeleted);
        modelBuilder.Entity<EmployeeOnboardingTask>().HasQueryFilter(eot => !eot.IsDeleted);

        // Phase 6 Query Filters
        modelBuilder.Entity<WorkShift>().HasQueryFilter(ws => !ws.IsDeleted);
        modelBuilder.Entity<EmployeeShiftAssignment>().HasQueryFilter(esa => !esa.IsDeleted);
        modelBuilder.Entity<AttendanceLog>().HasQueryFilter(al => !al.IsDeleted);
        modelBuilder.Entity<LeaveType>().HasQueryFilter(lt => !lt.IsDeleted);
        modelBuilder.Entity<LeaveBalance>().HasQueryFilter(lb => !lb.IsDeleted);
        modelBuilder.Entity<LeaveRequest>().HasQueryFilter(lr => !lr.IsDeleted);
    }
}
