using MediatR;

namespace EmployeeManagement.Application.Auth.Commands.ChangePassword;

/// <summary>
/// CQRS Command for changing the current authenticated user's password.
/// Masks the passwords in ToString() to prevent credential leakage in audit trails.
/// </summary>
public record ChangePasswordCommand(
    string CurrentPassword,
    string NewPassword,
    string ConfirmPassword
) : IRequest<bool>
{
    public override string ToString() =>
        "ChangePasswordCommand { CurrentPassword = [REDACTED], NewPassword = [REDACTED], ConfirmPassword = [REDACTED] }";
}
