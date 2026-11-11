using EmployeeManagement.Domain.Performance.Consts;
using EmployeeManagement.Domain.Performance.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagement.Infrastructure.Performance.Configurations;

public class PerformanceReviewConfiguration : IEntityTypeConfiguration<PerformanceReview>
{
    public void Configure(EntityTypeBuilder<PerformanceReview> builder)
    {
        builder.ToTable("PerformanceReviews");

        builder.HasKey(pr => pr.Id);
        builder.Property(pr => pr.Id)
            .HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(pr => pr.SelfScore)
            .HasColumnType("decimal(5,2)");

        builder.Property(pr => pr.ManagerScore)
            .HasColumnType("decimal(5,2)");

        builder.Property(pr => pr.FinalScore)
            .HasColumnType("decimal(5,2)");

        builder.Property(pr => pr.RatingRank)
            .HasMaxLength(PerformanceConsts.MaxRatingRankLength)
            .IsUnicode(false);

        builder.Property(pr => pr.EmployeeSelfComment)
            .HasMaxLength(PerformanceConsts.MaxCommentFeedbackLength);

        builder.Property(pr => pr.ManagerFeedback)
            .HasMaxLength(PerformanceConsts.MaxCommentFeedbackLength);

        builder.Property(pr => pr.DevelopmentPlan)
            .HasMaxLength(PerformanceConsts.MaxCommentFeedbackLength);

        builder.Property(pr => pr.Status)
            .HasMaxLength(PerformanceConsts.MaxReviewStatusLength)
            .IsUnicode(false)
            .HasDefaultValue(PerformanceConsts.ReviewStatus.Draft)
            .IsRequired();

        builder.Property(pr => pr.CreatedAt)
            .HasDefaultValueSql("GETDATE()")
            .IsRequired();

        builder.HasOne(pr => pr.ReviewCycle)
            .WithMany(rc => rc.PerformanceReviews)
            .HasForeignKey(pr => pr.ReviewCycleId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(pr => pr.Employee)
            .WithMany()
            .HasForeignKey(pr => pr.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(pr => pr.ReviewerEmployee)
            .WithMany()
            .HasForeignKey(pr => pr.ReviewerEmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(pr => new { pr.ReviewCycleId, pr.EmployeeId })
            .IsUnique()
            .HasDatabaseName("UQ_PerformanceReviews_Cycle_Emp");
    }
}

