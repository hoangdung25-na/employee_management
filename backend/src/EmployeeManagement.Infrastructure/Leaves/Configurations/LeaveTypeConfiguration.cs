using EmployeeManagement.Domain.Leaves.Consts;
using EmployeeManagement.Domain.Leaves.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagement.Infrastructure.Leaves.Configurations;

/// <summary>
/// EF Core configuration for the LeaveTypes table.
/// </summary>
public class LeaveTypeConfiguration : IEntityTypeConfiguration<LeaveType>
{
    public void Configure(EntityTypeBuilder<LeaveType> builder)
    {
        builder.ToTable("LeaveTypes");

        builder.HasKey(lt => lt.Id);
        builder.Property(lt => lt.Id)
            .HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(lt => lt.LeaveTypeCode)
            .HasMaxLength(LeaveConsts.MaxCodeLength)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(lt => lt.LeaveTypeName)
            .HasMaxLength(LeaveConsts.MaxNameLength)
            .IsRequired();

        builder.Property(lt => lt.DefaultDaysPerYear)
            .HasColumnType("decimal(4,1)")
            .HasDefaultValue(12.0m)
            .IsRequired();

        builder.Property(lt => lt.IsPaid)
            .HasDefaultValue(true)
            .IsRequired();

        builder.Property(lt => lt.RequiresAttachment)
            .HasDefaultValue(false)
            .IsRequired();

        builder.Property(lt => lt.Description)
            .HasMaxLength(250);

        builder.Property(lt => lt.IsActive)
            .HasDefaultValue(true)
            .IsRequired();

        builder.Property(lt => lt.IsDeleted)
            .HasDefaultValue(false)
            .IsRequired();

        builder.Property(lt => lt.CreatedAt)
            .HasDefaultValueSql("GETDATE()")
            .IsRequired();

        builder.HasIndex(lt => lt.LeaveTypeCode)
            .IsUnique();
    }
}
