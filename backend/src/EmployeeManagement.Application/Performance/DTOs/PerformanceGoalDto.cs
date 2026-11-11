namespace EmployeeManagement.Application.Performance.DTOs;

public class PerformanceGoalDto
{
    public Guid Id { get; set; }
    public Guid PerformanceReviewId { get; set; }
    public string GoalTitle { get; set; } = string.Empty;
    public string TargetDescription { get; set; } = string.Empty;
    public decimal WeightPercent { get; set; }
    public decimal? SelfAchievementScore { get; set; }
    public decimal? ManagerAchievementScore { get; set; }
    public string? Comment { get; set; }
}

public class CreatePerformanceGoalItemDto
{
    public string GoalTitle { get; set; } = string.Empty;
    public string TargetDescription { get; set; } = string.Empty;
    public decimal WeightPercent { get; set; }
    public decimal? SelfAchievementScore { get; set; }
    public decimal? ManagerAchievementScore { get; set; }
    public string? Comment { get; set; }
}

public class EvaluateGoalItemDto
{
    public Guid GoalId { get; set; }
    public decimal? Score { get; set; }
    public string? Comment { get; set; }
}

