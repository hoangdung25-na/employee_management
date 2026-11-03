using EmployeeManagement.Domain.Employees.Consts;
using EmployeeManagement.Domain.Employees.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagement.Infrastructure.Employees.Configurations;

/// <summary>
/// EF Core Fluent API configuration for the EmployeeOnboardingTasks table.
/// </summary>
public class EmployeeOnboardingTaskConfiguration : IEntityTypeConfiguration<EmployeeOnboardingTask>
{
    public void Configure(EntityTypeBuilder<EmployeeOnboardingTask> builder)
    {
        builder.ToTable("EmployeeOnboardingTasks");

        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id)
            .HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(t => t.ProcessType)
            .HasMaxLength(OnboardingConsts.MaxProcessTypeLength)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(t => t.TaskName)
            .HasMaxLength(OnboardingConsts.MaxTaskNameLength)
            .IsRequired();

        builder.Property(t => t.AssignedRole)
            .HasMaxLength(OnboardingConsts.MaxAssignedRoleLength)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(t => t.DueDate)
            .HasColumnType("date")
            .IsRequired();

        builder.Property(t => t.Status)
            .HasMaxLength(OnboardingConsts.MaxStatusLength)
            .IsUnicode(false)
            .HasDefaultValue("Pending")
            .IsRequired();

        builder.Property(t => t.Notes)
            .HasMaxLength(OnboardingConsts.MaxNotesLength);

        // Foreign Key Relationships
        builder.HasOne(t => t.Employee)
            .WithMany(e => e.OnboardingTasks)
            .HasForeignKey(t => t.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.AssignedToEmployee)
            .WithMany()
            .HasForeignKey(t => t.AssignedToEmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.CompletedByUser)
            .WithMany()
            .HasForeignKey(t => t.CompletedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Filtered Performance Index
        builder.HasIndex(t => new { t.EmployeeId, t.ProcessType, t.Status })
            .HasDatabaseName("IX_EmployeeOnboardingTasks_Employee")
            .HasFilter("[IsDeleted] = 0");
    }
}

