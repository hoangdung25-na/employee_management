namespace EmployeeManagement.Domain.Timesheets.Consts;

/// <summary>
/// Domain constants and status definitions for Timesheet Management (Phase 7).
/// </summary>
public static class TimesheetConsts
{
    public const int MaxProjectCodeLength = 30;
    public const int MaxProjectNameLength = 150;
    public const int MaxTaskTitleLength = 250;
    public const int MaxDescriptionLength = 500;
    public const int MaxRejectionReasonLength = 500;
    public const int MaxStatusLength = 20;

    public const decimal MinHoursPerEntry = 0.25m;
    public const decimal MaxHoursPerDay = 24.0m;

    public static class Status
    {
        public const string Draft = "Draft";
        public const string Submitted = "Submitted";
        public const string Approved = "Approved";
        public const string Rejected = "Rejected";

        public static readonly string[] All = [Draft, Submitted, Approved, Rejected];

        public static bool IsValid(string status) =>
            All.Contains(status, StringComparer.OrdinalIgnoreCase);
    }
}

