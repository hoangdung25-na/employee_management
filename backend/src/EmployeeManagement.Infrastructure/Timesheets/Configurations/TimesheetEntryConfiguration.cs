using EmployeeManagement.Domain.Timesheets.Consts;
using EmployeeManagement.Domain.Timesheets.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagement.Infrastructure.Timesheets.Configurations;

/// <summary>
/// EF Core Fluent API configuration for the TimesheetEntries table.
/// </summary>
public class TimesheetEntryConfiguration : IEntityTypeConfiguration<TimesheetEntry>
{
    public void Configure(EntityTypeBuilder<TimesheetEntry> builder)
    {
        builder.ToTable("TimesheetEntries");

        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id)
            .HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(t => t.WorkDate)
            .IsRequired();

        builder.Property(t => t.ProjectCode)
            .HasMaxLength(TimesheetConsts.MaxProjectCodeLength)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(t => t.ProjectName)
            .HasMaxLength(TimesheetConsts.MaxProjectNameLength)
            .IsRequired();

        builder.Property(t => t.TaskTitle)
            .HasMaxLength(TimesheetConsts.MaxTaskTitleLength)
            .IsRequired();

        builder.Property(t => t.HoursWorked)
            .HasColumnType("decimal(4,2)")
            .IsRequired();

        builder.Property(t => t.IsBillable)
            .HasDefaultValue(true)
            .IsRequired();

        builder.Property(t => t.Description)
            .HasMaxLength(TimesheetConsts.MaxDescriptionLength);

        builder.Property(t => t.Status)
            .HasMaxLength(TimesheetConsts.MaxStatusLength)
            .IsUnicode(false)
            .HasDefaultValue(TimesheetConsts.Status.Submitted)
            .IsRequired();

        builder.Property(t => t.RejectionReason)
            .HasMaxLength(TimesheetConsts.MaxRejectionReasonLength);

        builder.Property(t => t.CreatedAt)
            .HasDefaultValueSql("GETDATE()")
            .IsRequired();

        builder.Property(t => t.IsDeleted)
            .HasDefaultValue(false)
            .IsRequired();

        // Foreign Key Relationships
        builder.HasOne(t => t.Employee)
            .WithMany()
            .HasForeignKey(t => t.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.ApprovedByEmployee)
            .WithMany()
            .HasForeignKey(t => t.ApprovedByEmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        // Index
        builder.HasIndex(t => new { t.EmployeeId, t.WorkDate, t.Status })
            .HasFilter("[IsDeleted] = 0")
            .HasDatabaseName("IX_TimesheetEntries_Employee_WorkDate");
    }
}

