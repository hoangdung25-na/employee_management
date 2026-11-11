using EmployeeManagement.Domain.Training.Consts;
using EmployeeManagement.Domain.Training.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagement.Infrastructure.Training.Configurations;

public class EmployeeTrainingConfiguration : IEntityTypeConfiguration<EmployeeTraining>
{
    public void Configure(EntityTypeBuilder<EmployeeTraining> builder)
    {
        builder.ToTable("EmployeeTrainings");

        builder.HasKey(et => et.Id);
        builder.Property(et => et.Id)
            .HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(et => et.EnrollmentStatus)
            .HasMaxLength(TrainingConsts.MaxEnrollmentStatusLength)
            .IsUnicode(false)
            .HasDefaultValue(TrainingConsts.EnrollmentStatus.Enrolled)
            .IsRequired();

        builder.Property(et => et.ProgressPercent)
            .HasDefaultValue(0)
            .IsRequired();

        builder.Property(et => et.ExamScore)
            .HasColumnType("decimal(5,2)");

        builder.Property(et => et.CertificateUrl)
            .HasMaxLength(TrainingConsts.MaxCertificateUrlLength)
            .IsUnicode(false);

        builder.Property(et => et.Feedback)
            .HasMaxLength(TrainingConsts.MaxFeedbackLength);

        builder.Property(et => et.CreatedAt)
            .HasDefaultValueSql("GETDATE()")
            .IsRequired();

        builder.HasOne(et => et.TrainingCourse)
            .WithMany(tc => tc.EmployeeTrainings)
            .HasForeignKey(et => et.TrainingCourseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(et => et.Employee)
            .WithMany()
            .HasForeignKey(et => et.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(et => et.AssignedByEmployee)
            .WithMany()
            .HasForeignKey(et => et.AssignedByEmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(et => new { et.TrainingCourseId, et.EmployeeId })
            .IsUnique()
            .HasDatabaseName("UQ_EmployeeTrainings_Course_Emp");
    }
}

