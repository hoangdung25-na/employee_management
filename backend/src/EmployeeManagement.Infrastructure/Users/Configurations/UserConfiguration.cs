using EmployeeManagement.Domain.Users.Consts;
using EmployeeManagement.Domain.Users.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagement.Infrastructure.Users.Configurations;

/// <summary>
/// EF Core Fluent API configuration for the Users table.
/// Enforces sequential GUID primary key, unique username/email/employeeId constraints, and Restrict delete behavior.
/// </summary>
public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");

        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id)
            .HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(u => u.Username)
            .HasMaxLength(UserConsts.MaxUsernameLength)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(u => u.Email)
            .HasMaxLength(UserConsts.MaxEmailLength)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(u => u.PasswordHash)
            .HasMaxLength(UserConsts.MaxPasswordHashLength)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(u => u.SecurityStamp)
            .HasMaxLength(UserConsts.MaxSecurityStampLength)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(u => u.RefreshToken)
            .HasMaxLength(UserConsts.MaxRefreshTokenLength)
            .IsUnicode(false);

        builder.Property(u => u.IsActive)
            .HasDefaultValue(true)
            .IsRequired();

        builder.Property(u => u.IsLocked)
            .HasDefaultValue(false)
            .IsRequired();

        builder.Property(u => u.FailedLoginAttempts)
            .HasDefaultValue(0)
            .IsRequired();

        builder.Property(u => u.MustChangePassword)
            .HasDefaultValue(false)
            .IsRequired();

        // Unique constraints
        builder.HasIndex(u => u.Username).IsUnique();
        builder.HasIndex(u => u.Email).IsUnique();
        builder.HasIndex(u => u.EmployeeId)
            .IsUnique()
            .HasFilter("[EmployeeId] IS NOT NULL AND [IsDeleted] = 0")
            .HasDatabaseName("UQ_Users_EmployeeId");

        // 1 - 0..1 optional link to Employee (Restrict delete per Golden Rule #7)
        builder.HasOne(u => u.Employee)
            .WithOne(e => e.User)
            .HasForeignKey<User>(u => u.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

