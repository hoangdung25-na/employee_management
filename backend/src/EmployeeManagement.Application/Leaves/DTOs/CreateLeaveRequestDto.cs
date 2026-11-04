namespace EmployeeManagement.Application.Leaves.DTOs;

/// <summary>
/// Payload DTO for submitting a new leave request.
/// </summary>
public class CreateLeaveRequestDto
{
    public Guid LeaveTypeId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public decimal TotalDays { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? AttachmentUrl { get; set; }
    public Guid? TargetEmployeeId { get; set; }
}

