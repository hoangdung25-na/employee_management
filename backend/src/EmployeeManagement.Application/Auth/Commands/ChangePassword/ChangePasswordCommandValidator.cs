using EmployeeManagement.Domain.Users.Consts;
using FluentValidation;

namespace EmployeeManagement.Application.Auth.Commands.ChangePassword;

/// <summary>
/// FluentValidation rules for ChangePasswordCommand enforcing strong password complexity.
/// </summary>
public class ChangePasswordCommandValidator : AbstractValidator<ChangePasswordCommand>
{
    public ChangePasswordCommandValidator()
    {
        RuleFor(x => x.CurrentPassword)
            .NotEmpty().WithMessage("Mật khẩu hiện tại không được để trống.");

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("Mật khẩu mới không được để trống.")
            .MinimumLength(UserConsts.MinStrongPasswordLength)
                .WithMessage($"Mật khẩu mới phải có tối thiểu {UserConsts.MinStrongPasswordLength} ký tự.")
            .Matches(@"[A-Z]").WithMessage("Mật khẩu mới phải chứa ít nhất 1 chữ cái in hoa.")
            .Matches(@"[a-z]").WithMessage("Mật khẩu mới phải chứa ít nhất 1 chữ cái thường.")
            .Matches(@"\d").WithMessage("Mật khẩu mới phải chứa ít nhất 1 chữ số.")
            .Matches(@"[\W_]").WithMessage("Mật khẩu mới phải chứa ít nhất 1 ký tự đặc biệt.")
            .NotEqual(x => x.CurrentPassword).WithMessage("Mật khẩu mới không được trùng với mật khẩu hiện tại.");

        RuleFor(x => x.ConfirmPassword)
            .NotEmpty().WithMessage("Xác nhận mật khẩu không được để trống.")
            .Equal(x => x.NewPassword).WithMessage("Xác nhận mật khẩu không khớp với mật khẩu mới.");
    }
}

