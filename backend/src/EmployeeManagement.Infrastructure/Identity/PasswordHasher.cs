using EmployeeManagement.Application.Interfaces;

namespace EmployeeManagement.Infrastructure.Identity;

/// <summary>
/// BCrypt-based implementation of IPasswordHasher.
/// </summary>
public class PasswordHasher : IPasswordHasher
{
    private const int WorkFactor = 11;

    public string HashPassword(string password)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(password);
        return BCrypt.Net.BCrypt.HashPassword(password, workFactor: WorkFactor);
    }

    public bool VerifyHashedPassword(string hashedPassword, string providedPassword)
    {
        if (string.IsNullOrWhiteSpace(hashedPassword) || string.IsNullOrWhiteSpace(providedPassword))
        {
            return false;
        }

        try
        {
            return BCrypt.Net.BCrypt.Verify(providedPassword, hashedPassword);
        }
        catch (BCrypt.Net.SaltParseException)
        {
            return false;
        }
    }
}

