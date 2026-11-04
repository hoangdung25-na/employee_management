using EmployeeManagement.Domain.Attendance.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagement.Infrastructure.Attendance.Configurations;

/// <summary>
/// EF Core configuration for EmployeeShiftAssignments table.
/// </summary>
public class EmployeeShiftAssignmentConfiguration : IEntityTypeConfiguration<EmployeeShiftAssignment>
{
    public void Configure(EntityTypeBuilder<EmployeeShiftAssignment> builder)
    {
        builder.ToTable("EmployeeShiftAssignments");

        builder.HasKey(esa => esa.Id);
        builder.Property(esa => esa.Id)
            .HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(esa => esa.EffectiveDate)
            .IsRequired();

        builder.Property(esa => esa.Notes)
            .HasMaxLength(500);

        builder.Property(esa => esa.IsDeleted)
            .HasDefaultValue(false)
            .IsRequired();

        builder.Property(esa => esa.CreatedAt)
            .HasDefaultValueSql("GETDATE()")
            .IsRequired();

        builder.HasOne(esa => esa.Employee)
            .WithMany(e => e.ShiftAssignments)
            .HasForeignKey(esa => esa.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(esa => esa.WorkShift)
            .WithMany(ws => ws.ShiftAssignments)
            .HasForeignKey(esa => esa.WorkShiftId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(esa => esa.EmployeeId);
    }
}

