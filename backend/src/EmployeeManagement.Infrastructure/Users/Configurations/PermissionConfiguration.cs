using EmployeeManagement.Domain.Users.Consts;
using EmployeeManagement.Domain.Users.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagement.Infrastructure.Users.Configurations;

/// <summary>
/// EF Core Fluent API configuration for the Permissions table.
/// </summary>
public class PermissionConfiguration : IEntityTypeConfiguration<Permission>
{
    public void Configure(EntityTypeBuilder<Permission> builder)
    {
        builder.ToTable("Permissions");

        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id)
            .HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(p => p.PermissionCode)
            .HasMaxLength(UserConsts.MaxPermissionCodeLength)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(p => p.PermissionName)
            .HasMaxLength(UserConsts.MaxPermissionNameLength)
            .IsRequired();

        builder.Property(p => p.Module)
            .HasMaxLength(UserConsts.MaxModuleLength)
            .IsUnicode(false)
            .IsRequired();

        builder.HasIndex(p => p.PermissionCode).IsUnique();
    }
}

