namespace EmployeeManagement.Application.Performance.DTOs;

public class ReviewCycleDto
{
    public Guid Id { get; set; }
    public string CycleCode { get; set; } = string.Empty;
    public string CycleName { get; set; } = string.Empty;
    public string CycleType { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public DateOnly SelfReviewDeadline { get; set; }
    public DateOnly ManagerReviewDeadline { get; set; }
    public string Status { get; set; } = string.Empty;
    public int TotalReviews { get; set; }
    public int CompletedReviews { get; set; }
}

