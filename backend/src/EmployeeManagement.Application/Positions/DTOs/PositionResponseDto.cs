namespace EmployeeManagement.Application.Positions.DTOs;

/// <summary>
/// Data Transfer Object representing a job position / title for dropdowns and org listings.
/// </summary>
public record PositionResponseDto(
    Guid Id,
    string PositionCode,
    string PositionName,
    string? Description,
    bool IsActive
);

