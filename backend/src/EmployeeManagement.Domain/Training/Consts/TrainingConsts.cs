namespace EmployeeManagement.Domain.Training.Consts;

/// <summary>
/// Constants and allowed status values for internal training and LMS modules.
/// </summary>
public static class TrainingConsts
{
    public const int MaxCourseCodeLength = 30;
    public const int MaxCourseNameLength = 200;
    public const int MaxCategoryLength = 100;
    public const int MaxInstructorNameLength = 100;
    public const int MaxStatusLength = 20;
    public const int MaxDescriptionLength = 500;
    public const int MaxEnrollmentStatusLength = 20;
    public const int MaxCertificateUrlLength = 500;
    public const int MaxFeedbackLength = 500;

    public static class CourseStatus
    {
        public const string Upcoming = "Upcoming";
        public const string Active = "Active";
        public const string Completed = "Completed";
        public const string Cancelled = "Cancelled";
    }

    public static class EnrollmentStatus
    {
        public const string Enrolled = "Enrolled";
        public const string InProgress = "InProgress";
        public const string Completed = "Completed";
        public const string Dropped = "Dropped";
        public const string Failed = "Failed";
    }
}
