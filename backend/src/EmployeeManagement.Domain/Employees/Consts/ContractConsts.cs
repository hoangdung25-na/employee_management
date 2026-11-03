namespace EmployeeManagement.Domain.Employees.Consts;

/// <summary>
/// Constants and allowed types for the Employee Labor Contracts module.
/// </summary>
public static class ContractConsts
{
    public const int MaxNumberLength = 30;
    public const int MaxTypeLength = 30;
    public const int MaxStatusLength = 20;
    public const int MaxUrlLength = 500;
    public const int MaxNotesLength = 500;

    public static class ContractTypes
    {
        public const string Probation = "Probation";
        public const string FixedTerm1Y = "FixedTerm1Y";
        public const string FixedTerm3Y = "FixedTerm3Y";
        public const string Indefinite = "Indefinite";
        public const string Seasonal = "Seasonal";

        public static readonly string[] All = [Probation, FixedTerm1Y, FixedTerm3Y, Indefinite, Seasonal];
    }

    public static class ContractStatuses
    {
        public const string Draft = "Draft";
        public const string Active = "Active";
        public const string Expired = "Expired";
        public const string Terminated = "Terminated";

        public static readonly string[] All = [Draft, Active, Expired, Terminated];
    }
}

