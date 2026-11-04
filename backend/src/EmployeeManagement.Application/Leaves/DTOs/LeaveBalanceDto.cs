namespace EmployeeManagement.Application.Leaves.DTOs;

/// <summary>
/// DTO representing an employee's leave balance / remaining quota.
/// </summary>
public record LeaveBalanceDto(
    Guid Id,
    Guid EmployeeId,
    string EmployeeName,
    Guid LeaveTypeId,
    string LeaveTypeCode,
    string LeaveTypeName,
    bool IsPaid,
    int LeaveYear,
    decimal EntitledDays,
    decimal CarriedOverDays,
    decimal UsedDays,
    decimal PendingDays,
    decimal RemainingDays
);
