namespace EmployeeManagement.Domain.Attendance.Consts;

/// <summary>
/// Constants and allowed statuses for the Attendance module.
/// </summary>
public static class AttendanceConsts
{
    public const int MaxCodeLength = 20;
    public const int MaxNameLength = 100;
    public const int MaxMethodLength = 20;
    public const int MaxStatusLength = 20;
    public const int MaxNotesLength = 500;
    public const int MaxIpLength = 45;

    public static class CheckInMethods
    {
        public const string Web = "Web";
        public const string Mobile = "Mobile";
        public const string Biometric = "Biometric";
        public const string Manual = "Manual";

        public static readonly string[] All = [Web, Mobile, Biometric, Manual];
    }

    public static class AttendanceStatuses
    {
        public const string Present = "Present";
        public const string Late = "Late";
        public const string EarlyLeave = "EarlyLeave";
        public const string HalfDay = "HalfDay";
        public const string Absent = "Absent";
        public const string OnLeave = "OnLeave";

        public static readonly string[] All = [Present, Late, EarlyLeave, HalfDay, Absent, OnLeave];
    }
}

