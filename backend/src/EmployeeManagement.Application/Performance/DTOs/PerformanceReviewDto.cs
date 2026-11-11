namespace EmployeeManagement.Application.Performance.DTOs;

public class PerformanceReviewDto
{
    public Guid Id { get; set; }
    public Guid ReviewCycleId { get; set; }
    public string CycleCode { get; set; } = string.Empty;
    public string CycleName { get; set; } = string.Empty;

    public Guid EmployeeId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public Guid DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public string PositionName { get; set; } = string.Empty;

    public Guid ReviewerEmployeeId { get; set; }
    public string ReviewerName { get; set; } = string.Empty;

    public decimal? SelfScore { get; set; }
    public decimal? ManagerScore { get; set; }
    public decimal? FinalScore { get; set; }
    public string? RatingRank { get; set; }

    public string? EmployeeSelfComment { get; set; }
    public string? ManagerFeedback { get; set; }
    public string? DevelopmentPlan { get; set; }

    public string Status { get; set; } = string.Empty;
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }

    public int GoalsCount { get; set; }
    public decimal AverageProgressPercent { get; set; }
    public decimal EstimatedRewardAmount { get; set; }

    public List<PerformanceGoalDto> Goals { get; set; } = new();
}

public class PerformanceSummaryMetricsDto
{
    public int TotalEmployees { get; set; }
    public decimal AverageCompletionPercent { get; set; }
    public decimal PassAndExcellentRate { get; set; }
    public int RankACount { get; set; }
    public int RankBCount { get; set; }
    public int RankCCount { get; set; }
    public int RankDCount { get; set; }
    public decimal ProjectedBonusFund { get; set; }
}

