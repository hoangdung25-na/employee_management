using EmployeeManagement.Domain.Performance.Consts;
using EmployeeManagement.Domain.Performance.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagement.Infrastructure.Performance.Configurations;

public class PerformanceGoalConfiguration : IEntityTypeConfiguration<PerformanceGoal>
{
    public void Configure(EntityTypeBuilder<PerformanceGoal> builder)
    {
        builder.ToTable("PerformanceGoals");

        builder.HasKey(pg => pg.Id);
        builder.Property(pg => pg.Id)
            .HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(pg => pg.GoalTitle)
            .HasMaxLength(PerformanceConsts.MaxGoalTitleLength)
            .IsRequired();

        builder.Property(pg => pg.TargetDescription)
            .HasMaxLength(PerformanceConsts.MaxTargetDescriptionLength)
            .IsRequired();

        builder.Property(pg => pg.WeightPercent)
            .HasColumnType("decimal(5,2)")
            .IsRequired();

        builder.Property(pg => pg.SelfAchievementScore)
            .HasColumnType("decimal(5,2)");

        builder.Property(pg => pg.ManagerAchievementScore)
            .HasColumnType("decimal(5,2)");

        builder.Property(pg => pg.Comment)
            .HasMaxLength(PerformanceConsts.MaxCommentLength);

        builder.Property(pg => pg.CreatedAt)
            .HasDefaultValueSql("GETDATE()")
            .IsRequired();

        builder.HasOne(pg => pg.PerformanceReview)
            .WithMany(pr => pr.PerformanceGoals)
            .HasForeignKey(pg => pg.PerformanceReviewId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

