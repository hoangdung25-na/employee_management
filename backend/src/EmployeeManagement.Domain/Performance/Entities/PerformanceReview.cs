using EmployeeManagement.Domain.Common;
using EmployeeManagement.Domain.Employees.Entities;
using EmployeeManagement.Domain.Performance.Consts;

namespace EmployeeManagement.Domain.Performance.Entities;

/// <summary>
/// Individual employee performance review within a cycle.
/// </summary>
public class PerformanceReview : BaseEntity
{
    public Guid ReviewCycleId { get; set; }
    public Guid EmployeeId { get; set; }
    public Guid ReviewerEmployeeId { get; set; }
    public decimal? SelfScore { get; set; }
    public decimal? ManagerScore { get; set; }
    public decimal? FinalScore { get; set; }
    public string? RatingRank { get; set; }
    public string? EmployeeSelfComment { get; set; }
    public string? ManagerFeedback { get; set; }
    public string? DevelopmentPlan { get; set; }
    public string Status { get; set; } = PerformanceConsts.ReviewStatus.Draft;
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }

    // Navigation properties
    public ReviewCycle ReviewCycle { get; set; } = null!;
    public Employee Employee { get; set; } = null!;
    public Employee ReviewerEmployee { get; set; } = null!;
    public ICollection<PerformanceGoal> PerformanceGoals { get; set; } = new List<PerformanceGoal>();
}

