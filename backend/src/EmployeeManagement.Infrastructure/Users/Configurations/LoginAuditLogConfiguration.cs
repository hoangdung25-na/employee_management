using EmployeeManagement.Domain.Users.Consts;
using EmployeeManagement.Domain.Users.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagement.Infrastructure.Users.Configurations;

/// <summary>
/// EF Core Fluent API configuration for the LoginAuditLogs table.
/// Enforces sequential GUID primary key and SARGable indices on UserId and CreatedAt.
/// </summary>
public class LoginAuditLogConfiguration : IEntityTypeConfiguration<LoginAuditLog>
{
    public void Configure(EntityTypeBuilder<LoginAuditLog> builder)
    {
        builder.ToTable("LoginAuditLogs");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id)
            .HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(x => x.UsernameOrEmail)
            .HasMaxLength(UserConsts.MaxEmailLength)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(x => x.IsSuccess)
            .IsRequired();

        builder.Property(x => x.FailureReason)
            .HasMaxLength(UserConsts.MaxFailureReasonLength);

        builder.Property(x => x.IpAddress)
            .HasMaxLength(UserConsts.MaxIpAddressLength)
            .IsUnicode(false);

        builder.Property(x => x.UserAgent)
            .HasMaxLength(UserConsts.MaxUserAgentLength);

        builder.Property(x => x.CreatedAt)
            .HasDefaultValueSql("GETUTCDATE()")
            .IsRequired();

        // SARGable Indexes per API_PERFORMANCE_RULES.md Rule #2
        builder.HasIndex(x => x.UserId)
            .HasDatabaseName("IX_LoginAuditLogs_UserId");

        builder.HasIndex(x => x.CreatedAt)
            .HasDatabaseName("IX_LoginAuditLogs_CreatedAt");

        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

