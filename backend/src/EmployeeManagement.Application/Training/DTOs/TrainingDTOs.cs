namespace EmployeeManagement.Application.Training.DTOs;

public class TrainingCourseDto
{
    public Guid Id { get; set; }
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? InstructorName { get; set; }
    public decimal DurationHours { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public bool IsMandatory { get; set; }
    public int? MaxParticipants { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Description { get; set; }

    public int EnrolledCount { get; set; }
    public int CompletedCount { get; set; }

    // Current user's enrollment context (if any)
    public bool IsEnrolled { get; set; }
    public string? MyEnrollmentStatus { get; set; }
    public int? MyProgressPercent { get; set; }
    public decimal? MyExamScore { get; set; }
}

public class EmployeeTrainingDto
{
    public Guid Id { get; set; }
    public Guid TrainingCourseId { get; set; }
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal DurationHours { get; set; }

    public Guid EmployeeId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;

    public Guid? AssignedByEmployeeId { get; set; }
    public string? AssignedByName { get; set; }

    public string EnrollmentStatus { get; set; } = string.Empty;
    public int ProgressPercent { get; set; }
    public decimal? ExamScore { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? CertificateUrl { get; set; }
    public string? Feedback { get; set; }
}

public class CreateTrainingCourseDto
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
    public string? Description { get; set; }
}

public class EnrollTrainingDto
{
    public Guid CourseId { get; set; }
    public Guid? TargetEmployeeId { get; set; } // If HR/Manager assigns; if null, enrolls self
}

public class UpdateTrainingProgressDto
{
    public int ProgressPercent { get; set; }
    public decimal? ExamScore { get; set; }
    public string? Feedback { get; set; }
    public string? EnrollmentStatus { get; set; }
}

