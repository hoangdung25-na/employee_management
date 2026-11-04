namespace EmployeeManagement.Application.Leaves.DTOs;

/// <summary>
/// DTO representing a Leave Type definition.
/// </summary>
public record LeaveTypeDto(
    Guid Id,
    string LeaveTypeCode,
    string LeaveTypeName,
    decimal DefaultDaysPerYear,
    bool IsPaid,
    bool RequiresAttachment,
    string? Description,
    bool IsActive
);
