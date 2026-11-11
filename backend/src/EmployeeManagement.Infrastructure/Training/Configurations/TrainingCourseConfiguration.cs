using EmployeeManagement.Domain.Training.Consts;
using EmployeeManagement.Domain.Training.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagement.Infrastructure.Training.Configurations;

public class TrainingCourseConfiguration : IEntityTypeConfiguration<TrainingCourse>
{
    public void Configure(EntityTypeBuilder<TrainingCourse> builder)
    {
        builder.ToTable("TrainingCourses");

        builder.HasKey(tc => tc.Id);
        builder.Property(tc => tc.Id)
            .HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(tc => tc.CourseCode)
            .HasMaxLength(TrainingConsts.MaxCourseCodeLength)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(tc => tc.CourseName)
            .HasMaxLength(TrainingConsts.MaxCourseNameLength)
            .IsRequired();

        builder.Property(tc => tc.Category)
            .HasMaxLength(TrainingConsts.MaxCategoryLength)
            .IsRequired();

        builder.Property(tc => tc.InstructorName)
            .HasMaxLength(TrainingConsts.MaxInstructorNameLength);

        builder.Property(tc => tc.DurationHours)
            .HasColumnType("decimal(5,2)")
            .IsRequired();

        builder.Property(tc => tc.StartDate)
            .IsRequired();

        builder.Property(tc => tc.EndDate)
            .IsRequired();

        builder.Property(tc => tc.IsMandatory)
            .HasDefaultValue(false)
            .IsRequired();

        builder.Property(tc => tc.Status)
            .HasMaxLength(TrainingConsts.MaxStatusLength)
            .IsUnicode(false)
            .HasDefaultValue(TrainingConsts.CourseStatus.Upcoming)
            .IsRequired();

        builder.Property(tc => tc.Description)
            .HasMaxLength(TrainingConsts.MaxDescriptionLength);

        builder.Property(tc => tc.CreatedAt)
            .HasDefaultValueSql("GETDATE()")
            .IsRequired();

        builder.HasIndex(tc => tc.CourseCode)
            .IsUnique()
            .HasDatabaseName("UQ_TrainingCourses_Code");
    }
}

