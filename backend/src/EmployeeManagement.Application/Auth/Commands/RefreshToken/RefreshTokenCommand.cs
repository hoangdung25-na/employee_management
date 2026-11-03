using System.Text.Json.Serialization;
using EmployeeManagement.Application.Auth.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Auth.Commands.RefreshToken;

/// <summary>
/// CQRS Command for issuing a new Access Token & Refresh Token pair from an expired Access Token.
/// </summary>
public record RefreshTokenCommand(
    [property: JsonIgnore] string AccessToken,
    [property: JsonIgnore] string RefreshToken
) : IRequest<AuthResponseDto>
{
    public override string ToString() =>
        "RefreshTokenCommand { AccessToken = [REDACTED], RefreshToken = [REDACTED] }";
}

