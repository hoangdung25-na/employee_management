using EmployeeManagement.Domain.Common;
using EmployeeManagement.Domain.Employees.Entities;
using EmployeeManagement.Domain.Training.Consts;

namespace EmployeeManagement.Domain.Training.Entities;

/// <summary>
/// Individual employee enrollment, progress, and certification status in a training course.
/// </summary>
public class EmployeeTraining : BaseEntity
{
    public Guid TrainingCourseId { get; set; }
    public Guid EmployeeId { get; set; }
    public Guid? AssignedByEmployeeId { get; set; }
    public string EnrollmentStatus { get; set; } = TrainingConsts.EnrollmentStatus.Enrolled;
    public int ProgressPercent { get; set; } = 0;
    public decimal? ExamScore { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? CertificateUrl { get; set; }
    public string? Feedback { get; set; }

    // Navigation properties
    public TrainingCourse TrainingCourse { get; set; } = null!;
    public Employee Employee { get; set; } = null!;
    public Employee? AssignedByEmployee { get; set; }
}

