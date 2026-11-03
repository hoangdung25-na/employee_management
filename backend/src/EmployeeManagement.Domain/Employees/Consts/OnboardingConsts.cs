namespace EmployeeManagement.Domain.Employees.Consts;

/// <summary>
/// Constants and allowed statuses for Onboarding and Offboarding processes.
/// </summary>
public static class OnboardingConsts
{
    public const int MaxCodeLength = 30;
    public const int MaxProcessTypeLength = 20;
    public const int MaxTaskNameLength = 200;
    public const int MaxAssignedRoleLength = 30;
    public const int MaxStatusLength = 20;
    public const int MaxDescriptionLength = 500;
    public const int MaxNotesLength = 500;

    public static class ProcessTypes
    {
        public const string Onboarding = "Onboarding";
        public const string Offboarding = "Offboarding";

        public static readonly string[] All = [Onboarding, Offboarding];
    }

    public static class TaskStatuses
    {
        public const string Pending = "Pending";
        public const string InProgress = "InProgress";
        public const string Completed = "Completed";
        public const string Skipped = "Skipped";

        public static readonly string[] All = [Pending, InProgress, Completed, Skipped];
    }

    public static class AssignedRoles
    {
        public const string HR = "HR";
        public const string IT = "IT";
        public const string Manager = "MANAGER";
        public const string Employee = "EMPLOYEE";

        public static readonly string[] All = [HR, IT, Manager, Employee];
    }
}
