using EmployeeManagement.Application.Positions.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Positions.Queries.GetPositions;

/// <summary>
/// CQRS Query to retrieve all active job positions (GET /api/positions).
/// </summary>
public record GetPositionsQuery(bool IncludeInactive = false) : IRequest<IReadOnlyList<PositionResponseDto>>;

