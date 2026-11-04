using EmployeeManagement.Domain.Common;
using EmployeeManagement.Domain.Departments.Entities;
using EmployeeManagement.Domain.Employees.Enums;
using EmployeeManagement.Domain.Positions.Entities;
using EmployeeManagement.Domain.Users.Entities;

namespace EmployeeManagement.Domain.Employees.Entities;

/// <summary>
/// Core Employee entity in the HRM domain.
/// Enforces GUID identification and strict salary privacy controls.
/// </summary>
public class Employee : BaseEntity
{
    public string EmployeeCode { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public DateOnly DateOfBirth { get; set; }
    public string Gender { get; set; } = string.Empty;
    public string CitizenId { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string WorkEmail { get; set; } = string.Empty;
    public string? PersonalEmail { get; set; }
    public string? Address { get; set; }
    public DateOnly HireDate { get; set; }

    // Department relationship
    public Guid DepartmentId { get; set; }
    public Department Department { get; set; } = null!;

    // Position relationship
    public Guid PositionId { get; set; }
    public Position Position { get; set; } = null!;

    // Direct Manager relationship (Self-referencing hierarchy)
    public Guid? DirectManagerId { get; set; }
    public Employee? DirectManager { get; set; }
    public ICollection<Employee> Subordinates { get; set; } = new List<Employee>();

    // Compensation & Status
    public decimal BaseSalary { get; set; }
    public string? AvatarUrl { get; set; }
    public EmployeeStatus Status { get; set; } = EmployeeStatus.Probation;

    // Offboarding / Termination details
    public DateOnly? TerminationDate { get; set; }
    public string? TerminationReason { get; set; }

    // Probation, Tax, Social Insurance & Banking (HRM Expansion)
    public DateOnly? ProbationEndDate { get; set; }
    public string? TaxCode { get; set; }
    public string? SocialInsuranceNumber { get; set; }
    public string? BankAccountNumber { get; set; }
    public string? BankName { get; set; }

    // Optional 1 - 0..1 Identity account linkage
    public User? User { get; set; }

    // Phase 5: Documents, Contracts, Decisions & Onboarding/Offboarding relationships
    public ICollection<EmployeeDocument> Documents { get; set; } = new List<EmployeeDocument>();
    public ICollection<EmployeeContract> Contracts { get; set; } = new List<EmployeeContract>();
    public ICollection<EmployeeDecision> Decisions { get; set; } = new List<EmployeeDecision>();
    public ICollection<EmployeeOnboardingTask> OnboardingTasks { get; set; } = new List<EmployeeOnboardingTask>();
}
