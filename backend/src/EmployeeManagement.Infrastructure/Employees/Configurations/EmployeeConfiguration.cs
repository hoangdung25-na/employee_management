using EmployeeManagement.Domain.Employees.Consts;
using EmployeeManagement.Domain.Employees.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagement.Infrastructure.Employees.Configurations;

/// <summary>
/// EF Core Fluent API configuration for the Employees table.
/// Enforces sequential GUID generation, EmployeeConsts limits, performance indexes, and Restrict delete behavior.
/// </summary>
public class EmployeeConfiguration : IEntityTypeConfiguration<Employee>
{
    public void Configure(EntityTypeBuilder<Employee> builder)
    {
        builder.ToTable("Employees");

        // 1. GUID Primary Key with NEWSEQUENTIALID()
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id)
            .HasDefaultValueSql("NEWSEQUENTIALID()");

        // 2. Column definitions & constraints using EmployeeConsts
        builder.Property(e => e.EmployeeCode)
            .HasMaxLength(EmployeeConsts.MaxCodeLength)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(e => e.FullName)
            .HasMaxLength(EmployeeConsts.MaxFullNameLength)
            .IsRequired();

        builder.Property(e => e.DateOfBirth)
            .HasColumnType("date")
            .IsRequired();

        builder.Property(e => e.Gender)
            .HasMaxLength(EmployeeConsts.MaxGenderLength)
            .IsRequired();

        builder.Property(e => e.CitizenId)
            .HasMaxLength(EmployeeConsts.MaxCodeLength)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(e => e.PhoneNumber)
            .HasMaxLength(EmployeeConsts.MaxPhoneNumberLength)
            .IsUnicode(false);

        builder.Property(e => e.WorkEmail)
            .HasMaxLength(EmployeeConsts.MaxEmailLength)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(e => e.PersonalEmail)
            .HasMaxLength(EmployeeConsts.MaxEmailLength)
            .IsUnicode(false);

        builder.Property(e => e.Address)
            .HasMaxLength(EmployeeConsts.MaxAddressLength);

        builder.Property(e => e.HireDate)
            .HasColumnType("date")
            .IsRequired();

        builder.Property(e => e.BaseSalary)
            .HasPrecision(18, 2)
            .HasDefaultValue(0m)
            .IsRequired();

        builder.Property(e => e.AvatarUrl)
            .HasMaxLength(EmployeeConsts.MaxAvatarUrlLength)
            .IsUnicode(false);

        builder.Property(e => e.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(e => e.TerminationDate)
            .HasColumnType("date");

        builder.Property(e => e.TerminationReason)
            .HasMaxLength(EmployeeConsts.MaxTerminationReasonLength);

        // 3. Unique Indexes
        builder.HasIndex(e => e.EmployeeCode).IsUnique();
        builder.HasIndex(e => e.WorkEmail).IsUnique();
        builder.HasIndex(e => e.CitizenId).IsUnique();

        // 4. Non-Clustered Performance Indexes for filtering, sorting, and searching
        builder.HasIndex(e => e.DepartmentId).HasDatabaseName("IX_Employees_DepartmentId");
        builder.HasIndex(e => e.Status).HasDatabaseName("IX_Employees_Status");
        builder.HasIndex(e => e.HireDate).HasDatabaseName("IX_Employees_HireDate");
        builder.HasIndex(e => e.FullName).HasDatabaseName("IX_Employees_FullName");

        // 5. Foreign Key Relationships - Strictly Restrict (No Cascade Delete)
        builder.HasOne(e => e.Department)
            .WithMany(d => d.Employees)
            .HasForeignKey(e => e.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Position)
            .WithMany(p => p.Employees)
            .HasForeignKey(e => e.PositionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.DirectManager)
            .WithMany(m => m.Subordinates)
            .HasForeignKey(e => e.DirectManagerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
