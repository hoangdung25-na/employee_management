namespace EmployeeManagement.Domain.Employees.Consts;

/// <summary>
/// Centralized business rules and constants for Employee module (Single Source of Truth).
/// Shared across EF Core Configurations, FluentValidation, and DTOs.
/// </summary>
public static class EmployeeConsts
{
    // --- 1. Employee Code ---
    public const int MaxCodeLength = 20;
    public const string CodePrefix = "EMP-";
    public const string CodeFormatRegex = @"^EMP-\d{5}$";
    public const string InvalidCodeFormatErrorMessage = "Employee code must follow the format EMP-xxxxx (e.g., EMP-00001).";

    // --- 2. Full Name ---
    public const int MaxFullNameLength = 100;
    public const int MinFullNameLength = 2;

    // --- 3. Gender ---
    public const int MaxGenderLength = 10;
    public static readonly string[] ValidGenders = ["Nam", "Nữ", "Khác"];

    // --- 4. Citizen ID (12 digits) ---
    public const int CitizenIdLength = 12;
    public const string CitizenIdRegex = @"^\d{12}$";
    public const string InvalidCitizenIdErrorMessage = "Citizen ID must consist of exactly 12 digits.";

    // --- 5. Mobile Phone Number ---
    public const int MaxPhoneNumberLength = 15;
    public const string PhoneNumberRegex = @"^(0|\+84)(3[2-9]|5[689]|7[06-9]|8[1-9]|9\d)\d{7}$";
    public const string InvalidPhoneNumberErrorMessage = "The field is an invalid phone number.";

    // --- 6. Email ---
    public const int MaxEmailLength = 150;

    // --- 7. Address & Media ---
    public const int MaxAddressLength = 250;
    public const int MaxAvatarUrlLength = 500;
    public const int MaxTerminationReasonLength = 500;

    // --- 8. Tax, Insurance & Banking ---
    public const int MaxTaxCodeLength = 20;
    public const int MaxSocialInsuranceNumberLength = 20;
    public const int MaxBankAccountNumberLength = 30;
    public const int MaxBankNameLength = 100;

    // --- 9. Labor Law Business Rules ---
    public const int MinimumWorkingAge = 18;
    public const decimal MinimumBaseSalary = 0m;
    public const string UnderageEmployeeErrorMessage = "Employee must be at least 18 years old as of the hire date.";
}
