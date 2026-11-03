using FluentValidation;

namespace EmployeeManagement.Application.Auth.Commands.RefreshToken;

/// <summary>
/// FluentValidation rules for RefreshTokenCommand.
/// </summary>
public class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
{
    public RefreshTokenCommandValidator()
    {
        RuleFor(x => x.AccessToken)
            .NotEmpty().WithMessage("Access Token không được để trống.");

        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("Refresh Token không được để trống.");
    }
}

