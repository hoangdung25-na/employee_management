using EmployeeManagement.Domain.Users.Consts;
using EmployeeManagement.Domain.Users.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagement.Infrastructure.Users.Configurations;

/// <summary>
/// EF Core Fluent API configuration for the Roles table.
/// </summary>
public class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.ToTable("Roles");

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id)
            .HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(r => r.RoleCode)
            .HasMaxLength(UserConsts.MaxRoleCodeLength)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(r => r.RoleName)
            .HasMaxLength(UserConsts.MaxRoleNameLength)
            .IsRequired();

        builder.Property(r => r.Description)
            .HasMaxLength(UserConsts.MaxRoleDescriptionLength);

        builder.Property(r => r.IsActive)
            .HasDefaultValue(true)
            .IsRequired();

        builder.HasIndex(r => r.RoleCode).IsUnique();
    }
}

