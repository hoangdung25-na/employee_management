namespace EmployeeManagement.Application.Leaves.DTOs;

/// <summary>
/// Payload DTO for approving or rejecting a leave request.
/// </summary>
public class ReviewLeaveRequestDto
{
    public bool IsApproved { get; set; }
    public string? ReviewComment { get; set; }
}

