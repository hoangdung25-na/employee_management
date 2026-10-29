using EmployeeManagement.Domain.Departments.Consts;
using EmployeeManagement.Domain.Departments.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagement.Infrastructure.Departments.Configurations;

/// <summary>
/// EF Core Fluent API configuration for the Departments table.
/// </summary>
public class DepartmentConfiguration : IEntityTypeConfiguration<Department>
{
    public void Configure(EntityTypeBuilder<Department> builder)
    {
        builder.ToTable("Departments");

        builder.HasKey(d => d.Id);
        builder.Property(d => d.Id)
            .HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(d => d.DepartmentCode)
            .HasMaxLength(DepartmentConsts.MaxCodeLength)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(d => d.DepartmentName)
            .HasMaxLength(DepartmentConsts.MaxNameLength)
            .IsRequired();

        builder.Property(d => d.Description)
            .HasMaxLength(DepartmentConsts.MaxDescriptionLength);

        builder.Property(d => d.IsActive)
            .HasDefaultValue(true)
            .IsRequired();

        builder.HasIndex(d => d.DepartmentCode).IsUnique();

        // Parent-child and Manager relationships (Restrict Delete)
        builder.HasOne(d => d.ParentDepartment)
            .WithMany(d => d.SubDepartments)
            .HasForeignKey(d => d.ParentDepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.Manager)
            .WithMany()
            .HasForeignKey(d => d.ManagerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
