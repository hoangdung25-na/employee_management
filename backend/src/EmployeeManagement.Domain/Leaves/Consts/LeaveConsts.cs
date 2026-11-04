namespace EmployeeManagement.Domain.Leaves.Consts;

/// <summary>
/// Constants and allowed statuses for Leave Management.
/// </summary>
public static class LeaveConsts
{
    public const int MaxCodeLength = 20;
    public const int MaxNameLength = 100;
    public const int MaxStatusLength = 20;
    public const int MaxReasonLength = 500;
    public const int MaxCommentLength = 500;
    public const int MaxUrlLength = 500;

    public static class LeaveStatuses
    {
        public const string Pending = "Pending";
        public const string Approved = "Approved";
        public const string Rejected = "Rejected";
        public const string Cancelled = "Cancelled";

        public static readonly string[] All = [Pending, Approved, Rejected, Cancelled];
    }
}
