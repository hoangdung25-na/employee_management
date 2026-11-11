namespace EmployeeManagement.Application.Performance.DTOs;

public class CreateReviewCycleDto
{
    public string CycleCode { get; set; } = string.Empty;
    public string CycleName { get; set; } = string.Empty;
    public string CycleType { get; set; } = "Quarterly";
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public DateOnly SelfReviewDeadline { get; set; }
    public DateOnly ManagerReviewDeadline { get; set; }
}

public class CreatePerformanceReviewDto
{
    public Guid ReviewCycleId { get; set; }
    public Guid EmployeeId { get; set; }
    public Guid ReviewerEmployeeId { get; set; }
    public List<CreatePerformanceGoalItemDto> Goals { get; set; } = new();
}

public class EvaluatePerformanceReviewDto
{
    public bool IsManagerEvaluation { get; set; }
    public decimal? OverallScore { get; set; }
    public string? Comment { get; set; }
    public string? DevelopmentPlan { get; set; }
    public List<EvaluateGoalItemDto> GoalScores { get; set; } = new();
}

