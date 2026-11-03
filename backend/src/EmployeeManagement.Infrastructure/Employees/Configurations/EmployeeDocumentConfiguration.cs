using EmployeeManagement.Domain.Employees.Consts;
using EmployeeManagement.Domain.Employees.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagement.Infrastructure.Employees.Configurations;

/// <summary>
/// EF Core Fluent API configuration for the EmployeeDocuments table.
/// </summary>
public class EmployeeDocumentConfiguration : IEntityTypeConfiguration<EmployeeDocument>
{
    public void Configure(EntityTypeBuilder<EmployeeDocument> builder)
    {
        builder.ToTable("EmployeeDocuments");

        builder.HasKey(d => d.Id);
        builder.Property(d => d.Id)
            .HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(d => d.DocumentType)
            .HasMaxLength(DocumentConsts.MaxTypeLength)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(d => d.DocumentTitle)
            .HasMaxLength(DocumentConsts.MaxTitleLength)
            .IsRequired();

        builder.Property(d => d.FileName)
            .HasMaxLength(DocumentConsts.MaxFileNameLength)
            .IsRequired();

        builder.Property(d => d.FileUrl)
            .HasMaxLength(DocumentConsts.MaxUrlLength)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(d => d.FileSizeBytes)
            .HasDefaultValue(0L)
            .IsRequired();

        builder.Property(d => d.IssueDate)
            .HasColumnType("date");

        builder.Property(d => d.ExpiryDate)
            .HasColumnType("date");

        builder.Property(d => d.IsVerified)
            .HasDefaultValue(false)
            .IsRequired();

        builder.Property(d => d.Notes)
            .HasMaxLength(DocumentConsts.MaxNotesLength);

        // Foreign Key Relationships
        builder.HasOne(d => d.Employee)
            .WithMany(e => e.Documents)
            .HasForeignKey(d => d.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.UploadedByUser)
            .WithMany()
            .HasForeignKey(d => d.UploadedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Performance Filtered Index
        builder.HasIndex(d => new { d.EmployeeId, d.DocumentType })
            .HasDatabaseName("IX_EmployeeDocuments_EmployeeId")
            .HasFilter("[IsDeleted] = 0");
    }
}

