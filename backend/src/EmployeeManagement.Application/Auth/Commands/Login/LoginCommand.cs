using EmployeeManagement.Application.Auth.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Auth.Commands.Login;

/// <summary>
/// CQRS Command for authenticating a user with Username/Email and Password.
/// Masks the password in ToString() to prevent credential leakage in audit trails.
/// </summary>
public record LoginCommand(
    string UsernameOrEmail,
    string Password
) : IRequest<AuthResponseDto>
{
    public override string ToString() =>
        $"LoginCommand {{ UsernameOrEmail = {UsernameOrEmail}, Password = [REDACTED] }}";
}
