using MediatR;

namespace EmployeeManagement.Application.Auth.Commands.Logout;

/// <summary>
/// CQRS Command to revoke the current user's Refresh Token and terminate the session in the database.
/// </summary>
public record LogoutCommand : IRequest<bool>;

