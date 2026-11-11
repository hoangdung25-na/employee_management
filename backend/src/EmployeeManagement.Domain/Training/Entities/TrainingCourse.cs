using EmployeeManagement.Domain.Common;
using EmployeeManagement.Domain.Training.Consts;

namespace EmployeeManagement.Domain.Training.Entities;

/// <summary>
/// Internal training course / workshop offering for organizational development.
/// </summary>
public class TrainingCourse : BaseEntity
{
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public string Category { get; set; } = "Technical";
    public string? InstructorName { get; set; }
    public decimal DurationHours { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public bool IsMandatory { get; set; }
    public int? MaxParticipants { get; set; }
    public string Status { get; set; } = TrainingConsts.CourseStatus.Upcoming;
    public string? Description { get; set; }

    // Navigation properties
    public ICollection<EmployeeTraining> EmployeeTrainings { get; set; } = new List<EmployeeTraining>();
}

