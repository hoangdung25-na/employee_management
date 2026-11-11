using EmployeeManagement.Domain.Departments.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagement.Infrastructure.Departments.Configurations;

public class DepartmentPositionConfiguration : IEntityTypeConfiguration<DepartmentPosition>
{
    public void Configure(EntityTypeBuilder<DepartmentPosition> builder)
    {
        builder.ToTable("DepartmentPositions");

        builder.HasKey(dp => new { dp.DepartmentId, dp.PositionId });

        builder.HasOne(dp => dp.Department)
            .WithMany(d => d.DepartmentPositions)
            .HasForeignKey(dp => dp.DepartmentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(dp => dp.Position)
            .WithMany(p => p.DepartmentPositions)
            .HasForeignKey(dp => dp.PositionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(dp => dp.CreatedAt)
            .HasDefaultValueSql("GETDATE()");
    }
}

