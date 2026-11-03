using EmployeeManagement.Domain.Users.Consts;
using FluentValidation;

namespace EmployeeManagement.Application.Auth.Commands.Login;

/// <summary>
/// FluentValidation rules for LoginCommand.
/// </summary>
public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.UsernameOrEmail)
            .NotEmpty().WithMessage("Tên đăng nhập hoặc Email không được để trống.")
            .MaximumLength(UserConsts.MaxEmailLength).WithMessage($"Tên đăng nhập hoặc Email không được vượt quá {UserConsts.MaxEmailLength} ký tự.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Mật khẩu không được để trống.")
            .MinimumLength(UserConsts.MinPasswordLength).WithMessage($"Mật khẩu phải có tối thiểu {UserConsts.MinPasswordLength} ký tự.");
    }
}

