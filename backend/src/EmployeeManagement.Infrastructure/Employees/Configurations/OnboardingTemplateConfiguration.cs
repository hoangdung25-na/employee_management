using EmployeeManagement.Domain.Employees.Consts;
using EmployeeManagement.Domain.Employees.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagement.Infrastructure.Employees.Configurations;

/// <summary>
/// EF Core Fluent API configuration for the OnboardingTemplates table.
/// </summary>
public class OnboardingTemplateConfiguration : IEntityTypeConfiguration<OnboardingTemplate>
{
    public void Configure(EntityTypeBuilder<OnboardingTemplate> builder)
    {
        builder.ToTable("OnboardingTemplates");

        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id)
            .HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(t => t.TemplateCode)
            .HasMaxLength(OnboardingConsts.MaxCodeLength)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(t => t.ProcessType)
            .HasMaxLength(OnboardingConsts.MaxProcessTypeLength)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(t => t.TaskName)
            .HasMaxLength(OnboardingConsts.MaxTaskNameLength)
            .IsRequired();

        builder.Property(t => t.Description)
            .HasMaxLength(OnboardingConsts.MaxDescriptionLength);

        builder.Property(t => t.AssignedRole)
            .HasMaxLength(OnboardingConsts.MaxAssignedRoleLength)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(t => t.DefaultDueDays)
            .HasDefaultValue(3)
            .IsRequired();

        builder.Property(t => t.SortOrder)
            .HasDefaultValue(1)
            .IsRequired();

        builder.Property(t => t.IsActive)
            .HasDefaultValue(true)
            .IsRequired();

        // Database schema does not have UpdatedAt for templates
        builder.Ignore(t => t.UpdatedAt);

        // Unique filtered index on TemplateCode
        builder.HasIndex(t => t.TemplateCode)
            .HasDatabaseName("UQ_OnboardingTemplates_Code")
            .IsUnique()
            .HasFilter("[IsDeleted] = 0");
    }
}
