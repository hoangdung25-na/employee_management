using EmployeeManagement.Domain.Employees.Consts;
using EmployeeManagement.Domain.Employees.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagement.Infrastructure.Employees.Configurations;

/// <summary>
/// EF Core Fluent API configuration for the EmployeeDecisions table.
/// </summary>
public class EmployeeDecisionConfiguration : IEntityTypeConfiguration<EmployeeDecision>
{
    public void Configure(EntityTypeBuilder<EmployeeDecision> builder)
    {
        builder.ToTable("EmployeeDecisions");

        builder.HasKey(d => d.Id);
        builder.Property(d => d.Id)
            .HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(d => d.DecisionNumber)
            .HasMaxLength(DecisionConsts.MaxNumberLength)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(d => d.DecisionType)
            .HasMaxLength(DecisionConsts.MaxTypeLength)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(d => d.Title)
            .HasMaxLength(DecisionConsts.MaxTitleLength)
            .IsRequired();

        builder.Property(d => d.EffectiveDate)
            .HasColumnType("date")
            .IsRequired();

        builder.Property(d => d.SignDate)
            .HasColumnType("date")
            .IsRequired();

        builder.Property(d => d.SignerName)
            .HasMaxLength(DecisionConsts.MaxSignerLength);

        builder.Property(d => d.SignerPosition)
            .HasMaxLength(DecisionConsts.MaxSignerLength);

        builder.Property(d => d.Amount)
            .HasPrecision(18, 2)
            .HasDefaultValue(0m)
            .IsRequired();

        builder.Property(d => d.OldSalary)
            .HasPrecision(18, 2);

        builder.Property(d => d.NewSalary)
            .HasPrecision(18, 2);

        builder.Property(d => d.Reason)
            .HasMaxLength(DecisionConsts.MaxReasonLength);

        builder.Property(d => d.AttachmentUrl)
            .HasMaxLength(DecisionConsts.MaxUrlLength)
            .IsUnicode(false);

        builder.Property(d => d.Status)
            .HasMaxLength(DecisionConsts.MaxStatusLength)
            .IsUnicode(false)
            .HasDefaultValue(DecisionConsts.DecisionStatuses.Active)
            .IsRequired();

        // Foreign Key Relationships
        builder.HasOne(d => d.Employee)
            .WithMany(e => e.Decisions)
            .HasForeignKey(d => d.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.OldDepartment)
            .WithMany()
            .HasForeignKey(d => d.OldDepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.NewDepartment)
            .WithMany()
            .HasForeignKey(d => d.NewDepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.OldPosition)
            .WithMany()
            .HasForeignKey(d => d.OldPositionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.NewPosition)
            .WithMany()
            .HasForeignKey(d => d.NewPositionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.CreatedByUser)
            .WithMany()
            .HasForeignKey(d => d.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Filtered Indexes
        builder.HasIndex(d => d.DecisionNumber)
            .HasDatabaseName("UQ_EmployeeDecisions_Number")
            .IsUnique()
            .HasFilter("[IsDeleted] = 0");

        builder.HasIndex(d => new { d.EmployeeId, d.DecisionType, d.EffectiveDate })
            .HasDatabaseName("IX_EmployeeDecisions_Employee")
            .HasFilter("[IsDeleted] = 0");
    }
}
