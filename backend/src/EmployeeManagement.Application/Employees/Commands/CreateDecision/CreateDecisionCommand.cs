using EmployeeManagement.Application.Employees.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Employees.Commands.CreateDecision;

/// <summary>
/// Command to issue an official employee decision (Reward, Discipline, Transfer, Promotion).
/// Automatically updates employee Department, Position, and BaseSalary upon Transfer/Promotion.
/// </summary>
public record CreateDecisionCommand(
    Guid EmployeeId,
    string DecisionType,
    string Title,
    DateOnly EffectiveDate,
    DateOnly SignDate,
    string? SignerName,
    string? SignerPosition,
    decimal Amount,
    Guid? NewDepartmentId,
    Guid? NewPositionId,
    decimal? NewSalary,
    string? Reason,
    string? AttachmentUrl,
    string? DecisionNumber = null
) : IRequest<EmployeeDecisionDto>;
