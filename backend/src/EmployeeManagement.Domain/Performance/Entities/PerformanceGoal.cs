using EmployeeManagement.Domain.Common;

namespace EmployeeManagement.Domain.Performance.Entities;

/// <summary>
/// Specific KPI/OKR goal item tied to an employee's performance review.
/// </summary>
public class PerformanceGoal : BaseEntity
{
    public Guid PerformanceReviewId { get; set; }
    public string GoalTitle { get; set; } = string.Empty;
    public string TargetDescription { get; set; } = string.Empty;
    public decimal WeightPercent { get; set; }
    public decimal? SelfAchievementScore { get; set; }
    public decimal? ManagerAchievementScore { get; set; }
    public string? Comment { get; set; }

    // Navigation property
    public PerformanceReview PerformanceReview { get; set; } = null!;
}

