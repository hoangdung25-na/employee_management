using EmployeeManagement.Domain.Common;
using EmployeeManagement.Domain.Performance.Consts;

namespace EmployeeManagement.Domain.Performance.Entities;

/// <summary>
/// Represents an organizational review cycle (e.g. Q4 2026, Annual 2026, Probation).
/// </summary>
public class ReviewCycle : BaseEntity
{
    public string CycleCode { get; set; } = string.Empty;
    public string CycleName { get; set; } = string.Empty;
    public string CycleType { get; set; } = PerformanceConsts.CycleType.Quarterly;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public DateOnly SelfReviewDeadline { get; set; }
    public DateOnly ManagerReviewDeadline { get; set; }
    public string Status { get; set; } = PerformanceConsts.CycleStatus.Open;

    // Navigation properties
    public ICollection<PerformanceReview> PerformanceReviews { get; set; } = new List<PerformanceReview>();
}

