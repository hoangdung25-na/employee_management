using EmployeeManagement.Domain.Attendance.Consts;
using EmployeeManagement.Domain.Attendance.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagement.Infrastructure.Attendance.Configurations;

/// <summary>
/// EF Core configuration for the AttendanceLogs table.
/// </summary>
public class AttendanceLogConfiguration : IEntityTypeConfiguration<AttendanceLog>
{
    public void Configure(EntityTypeBuilder<AttendanceLog> builder)
    {
        builder.ToTable("AttendanceLogs");

        builder.HasKey(al => al.Id);
        builder.Property(al => al.Id)
            .HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(al => al.AttendanceDate)
            .IsRequired();

        builder.Property(al => al.CheckInMethod)
            .HasMaxLength(AttendanceConsts.MaxMethodLength)
            .IsUnicode(false)
            .HasDefaultValue(AttendanceConsts.CheckInMethods.Web)
            .IsRequired();

        builder.Property(al => al.CheckInIpAddress)
            .HasMaxLength(AttendanceConsts.MaxIpLength)
            .IsUnicode(false);

        builder.Property(al => al.WorkingHours)
            .HasColumnType("decimal(4,2)")
            .HasDefaultValue(0.00m)
            .IsRequired();

        builder.Property(al => al.OvertimeHours)
            .HasColumnType("decimal(4,2)")
            .HasDefaultValue(0.00m)
            .IsRequired();

        builder.Property(al => al.LateMinutes)
            .HasDefaultValue(0)
            .IsRequired();

        builder.Property(al => al.EarlyLeaveMinutes)
            .HasDefaultValue(0)
            .IsRequired();

        builder.Property(al => al.Status)
            .HasMaxLength(AttendanceConsts.MaxStatusLength)
            .IsUnicode(false)
            .HasDefaultValue(AttendanceConsts.AttendanceStatuses.Present)
            .IsRequired();

        builder.Property(al => al.Notes)
            .HasMaxLength(AttendanceConsts.MaxNotesLength);

        builder.Property(al => al.IsDeleted)
            .HasDefaultValue(false)
            .IsRequired();

        builder.Property(al => al.CreatedAt)
            .HasDefaultValueSql("GETDATE()")
            .IsRequired();

        builder.HasOne(al => al.Employee)
            .WithMany(e => e.AttendanceLogs)
            .HasForeignKey(al => al.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(al => al.WorkShift)
            .WithMany(ws => ws.AttendanceLogs)
            .HasForeignKey(al => al.WorkShiftId)
            .OnDelete(DeleteBehavior.Restrict);

        // Unique index: One attendance log per employee per day
        builder.HasIndex(al => new { al.EmployeeId, al.AttendanceDate })
            .IsUnique();

        builder.HasIndex(al => new { al.AttendanceDate, al.Status });
    }
}
