using EmployeeManagement.Domain.Codes.Consts;
using EmployeeManagement.Domain.Codes.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagement.Infrastructure.Codes.Configurations;

/// <summary>
/// EF Core Fluent API configuration for the CodeSequences table.
/// Uses RowVersion concurrency token to prevent race conditions during concurrent code generation.
/// </summary>
public class CodeSequenceConfiguration : IEntityTypeConfiguration<CodeSequence>
{
    public void Configure(EntityTypeBuilder<CodeSequence> builder)
    {
        builder.ToTable("CodeSequences");

        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id)
            .HasMaxLength(CodeConsts.MaxIdLength)
            .IsUnicode(false);

        builder.Property(c => c.LastIndex)
            .IsRequired();

        // SQL Server RowVersion / Optimistic Concurrency Token
        builder.Property(c => c.RowVersion)
            .IsRowVersion();
    }
}
