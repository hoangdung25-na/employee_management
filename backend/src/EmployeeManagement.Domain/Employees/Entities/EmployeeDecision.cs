using EmployeeManagement.Domain.Common;
using EmployeeManagement.Domain.Departments.Entities;
using EmployeeManagement.Domain.Employees.Consts;
using EmployeeManagement.Domain.Positions.Entities;
using EmployeeManagement.Domain.Users.Entities;

namespace EmployeeManagement.Domain.Employees.Entities;

/// <summary>
/// Legal and financial decision entity representing promotions, transfers, rewards, or disciplinary actions.
/// </summary>
public class EmployeeDecision : BaseEntity
{
    public string DecisionNumber { get; set; } = string.Empty;

    public Guid EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;

    public string DecisionType { get; set; } = DecisionConsts.DecisionTypes.Reward;
    public string Title { get; set; } = string.Empty;

    public DateOnly EffectiveDate { get; set; }
    public DateOnly SignDate { get; set; }

    public string? SignerName { get; set; }
    public string? SignerPosition { get; set; }

    public decimal Amount { get; set; }

    public Guid? OldDepartmentId { get; set; }
    public Department? OldDepartment { get; set; }

    public Guid? NewDepartmentId { get; set; }
    public Department? NewDepartment { get; set; }

    public Guid? OldPositionId { get; set; }
    public Position? OldPosition { get; set; }

    public Guid? NewPositionId { get; set; }
    public Position? NewPosition { get; set; }

    public decimal? OldSalary { get; set; }
    public decimal? NewSalary { get; set; }

    public string? Reason { get; set; }
    public string? AttachmentUrl { get; set; }

    public string Status { get; set; } = DecisionConsts.DecisionStatuses.Active;

    public Guid? CreatedByUserId { get; set; }
    public User? CreatedByUser { get; set; }
}
