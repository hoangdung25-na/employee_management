using EmployeeManagement.Domain.Leaves.Consts;
using EmployeeManagement.Domain.Leaves.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagement.Infrastructure.Leaves.Configurations;

/// <summary>
/// EF Core configuration for the LeaveRequests table.
/// </summary>
public class LeaveRequestConfiguration : IEntityTypeConfiguration<LeaveRequest>
{
    public void Configure(EntityTypeBuilder<LeaveRequest> builder)
    {
        builder.ToTable("LeaveRequests");

        builder.HasKey(lr => lr.Id);
        builder.Property(lr => lr.Id)
            .HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(lr => lr.RequestCode)
            .HasMaxLength(LeaveConsts.MaxCodeLength)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(lr => lr.StartDate)
            .IsRequired();

        builder.Property(lr => lr.EndDate)
            .IsRequired();

        builder.Property(lr => lr.TotalDays)
            .HasColumnType("decimal(4,1)")
            .IsRequired();

        builder.Property(lr => lr.Reason)
            .HasMaxLength(LeaveConsts.MaxReasonLength)
            .IsRequired();

        builder.Property(lr => lr.AttachmentUrl)
            .HasMaxLength(LeaveConsts.MaxUrlLength)
            .IsUnicode(false);

        builder.Property(lr => lr.Status)
            .HasMaxLength(LeaveConsts.MaxStatusLength)
            .IsUnicode(false)
            .HasDefaultValue(LeaveConsts.LeaveStatuses.Pending)
            .IsRequired();

        builder.Property(lr => lr.ReviewComment)
            .HasMaxLength(LeaveConsts.MaxCommentLength);

        builder.Property(lr => lr.IsDeleted)
            .HasDefaultValue(false)
            .IsRequired();

        builder.Property(lr => lr.CreatedAt)
            .HasDefaultValueSql("GETDATE()")
            .IsRequired();

        builder.HasOne(lr => lr.Employee)
            .WithMany(e => e.LeaveRequests)
            .HasForeignKey(lr => lr.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(lr => lr.LeaveType)
            .WithMany(lt => lt.LeaveRequests)
            .HasForeignKey(lr => lr.LeaveTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(lr => lr.ReviewedByEmployee)
            .WithMany()
            .HasForeignKey(lr => lr.ReviewedByEmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(lr => lr.RequestCode)
            .IsUnique();

        builder.HasIndex(lr => new { lr.EmployeeId, lr.Status });
    }
}

