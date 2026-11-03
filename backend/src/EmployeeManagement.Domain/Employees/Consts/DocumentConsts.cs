namespace EmployeeManagement.Domain.Employees.Consts;

/// <summary>
/// Constants and allowed types for the Employee Documents module.
/// </summary>
public static class DocumentConsts
{
    public const int MaxTypeLength = 30;
    public const int MaxTitleLength = 200;
    public const int MaxFileNameLength = 255;
    public const int MaxUrlLength = 500;
    public const int MaxNotesLength = 500;

    public static class DocumentTypes
    {
        public const string CV = "CV";
        public const string CitizenId = "CitizenId";
        public const string Degree = "Degree";
        public const string Certificate = "Certificate";
        public const string Contract = "Contract";
        public const string Medical = "Medical";
        public const string Other = "Other";

        public static readonly string[] All = [CV, CitizenId, Degree, Certificate, Contract, Medical, Other];
    }
}
