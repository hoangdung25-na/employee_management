using EmployeeManagement.Domain.Employees.Consts;
using EmployeeManagement.Domain.Employees.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagement.Infrastructure.Employees.Configurations;

/// <summary>
/// EF Core Fluent API configuration for the EmployeeContracts table.
/// </summary>
public class EmployeeContractConfiguration : IEntityTypeConfiguration<EmployeeContract>
{
    public void Configure(EntityTypeBuilder<EmployeeContract> builder)
    {
        builder.ToTable("EmployeeContracts");

        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id)
            .HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(c => c.ContractNumber)
            .HasMaxLength(ContractConsts.MaxNumberLength)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(c => c.ContractType)
            .HasMaxLength(ContractConsts.MaxTypeLength)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(c => c.StartDate)
            .HasColumnType("date")
            .IsRequired();

        builder.Property(c => c.EndDate)
            .HasColumnType("date");

        builder.Property(c => c.SignedDate)
            .HasColumnType("date");

        builder.Property(c => c.ContractSalary)
            .HasPrecision(18, 2)
            .HasDefaultValue(0m)
            .IsRequired();

        builder.Property(c => c.Allowances)
            .HasPrecision(18, 2)
            .HasDefaultValue(0m)
            .IsRequired();

        builder.Property(c => c.FileUrl)
            .HasMaxLength(ContractConsts.MaxUrlLength)
            .IsUnicode(false);

        builder.Property(c => c.Status)
            .HasMaxLength(ContractConsts.MaxStatusLength)
            .IsUnicode(false)
            .HasDefaultValue("Active")
            .IsRequired();

        builder.Property(c => c.Notes)
            .HasMaxLength(ContractConsts.MaxNotesLength);

        // Foreign Key Relationship
        builder.HasOne(c => c.Employee)
            .WithMany(e => e.Contracts)
            .HasForeignKey(c => c.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        // Filtered Indexes
        builder.HasIndex(c => c.ContractNumber)
            .HasDatabaseName("UQ_EmployeeContracts_ContractNumber")
            .IsUnique()
            .HasFilter("[IsDeleted] = 0");

        builder.HasIndex(c => new { c.EmployeeId, c.Status })
            .HasDatabaseName("IX_EmployeeContracts_EmployeeId")
            .HasFilter("[IsDeleted] = 0");
    }
}

