using EmployeeManagement.Application.Auth.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Auth.Queries.GetCurrentUser;

/// <summary>
/// CQRS Query for retrieving the current authenticated user's profile, roles, and permissions (GET /api/auth/me).
/// </summary>
public record GetCurrentUserQuery : IRequest<CurrentUserDto>;

