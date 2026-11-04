namespace EmployeeManagement.Application.Employees.DTOs;

/// <summary>
/// Payload DTO for issuing a new legal or organizational employee decision.
/// </summary>
public class CreateDecisionDto
{
    public Guid EmployeeId { get; set; }
    public string DecisionType { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public DateOnly EffectiveDate { get; set; }
    public DateOnly? SignDate { get; set; }
    public string? SignerName { get; set; }
    public string? SignerPosition { get; set; }
    public decimal Amount { get; set; }
    public Guid? NewDepartmentId { get; set; }
    public Guid? NewPositionId { get; set; }
    public decimal? NewSalary { get; set; }
    public string? Reason { get; set; }
    public string? AttachmentUrl { get; set; }
    public string? DecisionNumber { get; set; }
}
