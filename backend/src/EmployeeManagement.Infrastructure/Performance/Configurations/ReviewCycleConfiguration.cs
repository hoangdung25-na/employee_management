using EmployeeManagement.Domain.Performance.Consts;
using EmployeeManagement.Domain.Performance.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagement.Infrastructure.Performance.Configurations;

public class ReviewCycleConfiguration : IEntityTypeConfiguration<ReviewCycle>
{
    public void Configure(EntityTypeBuilder<ReviewCycle> builder)
    {
        builder.ToTable("ReviewCycles");

        builder.HasKey(rc => rc.Id);
        builder.Property(rc => rc.Id)
            .HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(rc => rc.CycleCode)
            .HasMaxLength(PerformanceConsts.MaxCycleCodeLength)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(rc => rc.CycleName)
            .HasMaxLength(PerformanceConsts.MaxCycleNameLength)
            .IsRequired();

        builder.Property(rc => rc.CycleType)
            .HasMaxLength(PerformanceConsts.MaxCycleTypeLength)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(rc => rc.StartDate)
            .IsRequired();

        builder.Property(rc => rc.EndDate)
            .IsRequired();

        builder.Property(rc => rc.SelfReviewDeadline)
            .IsRequired();

        builder.Property(rc => rc.ManagerReviewDeadline)
            .IsRequired();

        builder.Property(rc => rc.Status)
            .HasMaxLength(PerformanceConsts.MaxCycleStatusLength)
            .IsUnicode(false)
            .HasDefaultValue(PerformanceConsts.CycleStatus.Open)
            .IsRequired();

        builder.Property(rc => rc.CreatedAt)
            .HasDefaultValueSql("GETDATE()")
            .IsRequired();

        builder.HasIndex(rc => rc.CycleCode)
            .IsUnique()
            .HasDatabaseName("UQ_ReviewCycles_Code");
    }
}

