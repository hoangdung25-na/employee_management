using EmployeeManagement.Domain.Attendance.Consts;
using EmployeeManagement.Domain.Attendance.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagement.Infrastructure.Attendance.Configurations;

/// <summary>
/// EF Core configuration for the WorkShifts table.
/// </summary>
public class WorkShiftConfiguration : IEntityTypeConfiguration<WorkShift>
{
    public void Configure(EntityTypeBuilder<WorkShift> builder)
    {
        builder.ToTable("WorkShifts");

        builder.HasKey(ws => ws.Id);
        builder.Property(ws => ws.Id)
            .HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(ws => ws.ShiftCode)
            .HasMaxLength(AttendanceConsts.MaxCodeLength)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(ws => ws.ShiftName)
            .HasMaxLength(AttendanceConsts.MaxNameLength)
            .IsRequired();

        builder.Property(ws => ws.StartTime)
            .IsRequired();

        builder.Property(ws => ws.EndTime)
            .IsRequired();

        builder.Property(ws => ws.BreakMinutes)
            .HasDefaultValue(60)
            .IsRequired();

        builder.Property(ws => ws.GracePeriodMinutes)
            .HasDefaultValue(15)
            .IsRequired();

        builder.Property(ws => ws.StandardHours)
            .HasColumnType("decimal(4,2)")
            .HasDefaultValue(8.00m)
            .IsRequired();

        builder.Property(ws => ws.IsNightShift)
            .HasDefaultValue(false)
            .IsRequired();

        builder.Property(ws => ws.IsActive)
            .HasDefaultValue(true)
            .IsRequired();

        builder.Property(ws => ws.IsDeleted)
            .HasDefaultValue(false)
            .IsRequired();

        builder.Property(ws => ws.CreatedAt)
            .HasDefaultValueSql("GETDATE()")
            .IsRequired();

        builder.HasIndex(ws => ws.ShiftCode)
            .IsUnique();
    }
}
