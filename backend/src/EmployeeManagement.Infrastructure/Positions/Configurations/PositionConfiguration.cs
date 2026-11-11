using EmployeeManagement.Domain.Positions.Consts;
using EmployeeManagement.Domain.Positions.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagement.Infrastructure.Positions.Configurations;

/// <summary>
/// EF Core Fluent API configuration for the Positions table.
/// </summary>
public class PositionConfiguration : IEntityTypeConfiguration<Position>
{
    public void Configure(EntityTypeBuilder<Position> builder)
    {
        builder.ToTable("Positions");

        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id)
            .HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(p => p.PositionCode)
            .HasMaxLength(PositionConsts.MaxCodeLength)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(p => p.PositionName)
            .HasMaxLength(PositionConsts.MaxNameLength)
            .IsRequired();

        builder.Property(p => p.Description)
            .HasMaxLength(PositionConsts.MaxDescriptionLength);

        builder.Property(p => p.IsActive)
            .HasDefaultValue(true)
            .IsRequired();

        builder.Property(p => p.JobLevel)
            .HasDefaultValue(3)
            .IsRequired();

        builder.HasIndex(p => p.PositionCode).IsUnique();
    }
}
