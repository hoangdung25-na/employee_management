namespace EmployeeManagement.Domain.Employees.Consts;

/// <summary>
/// Constants and allowed types for the Employee Decisions module (Rewards, Discipline, Transfer, Promotion).
/// </summary>
public static class DecisionConsts
{
    public const int MaxNumberLength = 30;
    public const int MaxTypeLength = 30;
    public const int MaxTitleLength = 200;
    public const int MaxSignerLength = 100;
    public const int MaxReasonLength = 500;
    public const int MaxUrlLength = 500;
    public const int MaxStatusLength = 20;

    public static class DecisionTypes
    {
        public const string Reward = "Reward";
        public const string Discipline = "Discipline";
        public const string Transfer = "Transfer";
        public const string Promotion = "Promotion";

        public static readonly string[] All = [Reward, Discipline, Transfer, Promotion];
    }

    public static class DecisionStatuses
    {
        public const string Draft = "Draft";
        public const string Active = "Active";
        public const string Cancelled = "Cancelled";

        public static readonly string[] All = [Draft, Active, Cancelled];
    }
}
