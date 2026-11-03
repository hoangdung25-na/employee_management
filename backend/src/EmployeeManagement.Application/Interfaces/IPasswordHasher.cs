namespace EmployeeManagement.Application.Interfaces;

/// <summary>
/// Abstraction for secure password hashing and verification (BCrypt).
/// </summary>
public interface IPasswordHasher
{
    string HashPassword(string password);
    bool VerifyHashedPassword(string hashedPassword, string providedPassword);
}

