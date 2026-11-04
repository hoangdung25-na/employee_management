namespace EmployeeManagement.Application.Leaves.DTOs;

/// <summary>
/// DTO representing an individual leave application.
/// </summary>
public record LeaveRequestDto(
    Guid Id,
    string RequestCode,
    Guid EmployeeId,
    string EmployeeName,
    string EmployeeCode,
    string? DepartmentName,
    Guid LeaveTypeId,
    string LeaveTypeCode,
    string LeaveTypeName,
    bool IsPaid,
    DateOnly StartDate,
    DateOnly EndDate,
    decimal TotalDays,
    string Reason,
    string? AttachmentUrl,
    string Status,
    Guid? ReviewedByEmployeeId,
    string? ReviewedByEmployeeName,
    DateTime? ReviewedAt,
    string? ReviewComment,
    DateTime CreatedAt
);
