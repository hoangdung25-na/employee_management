using EmployeeManagement.Application.Users.DTOs;
using FluentValidation;
using MediatR;

namespace EmployeeManagement.Application.Users.Commands.UpdateUser;

/// <summary>
/// Command to update an existing User account, roles, custom permissions, optional password reset, and account unlock.
/// </summary>
public record UpdateUserCommand(
    Guid Id,
    string Email,
    Guid? EmployeeId,
    IReadOnlyList<string> RoleCodes,
    IReadOnlyList<string>? CustomPermissions,
    string? NewPassword,
    bool IsActive,
    bool UnlockAccount = false,
    bool MustChangePassword = false) : IRequest<UserSummaryDto>;

public class UpdateUserCommandValidator : AbstractValidator<UpdateUserCommand>
{
    public UpdateUserCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("ID tài khoản không hợp lệ.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email không được để trống.")
            .EmailAddress().WithMessage("Định dạng Email không hợp lệ.")
            .MaximumLength(150).WithMessage("Email không được vượt quá 150 ký tự.");

        RuleFor(x => x.RoleCodes)
            .NotEmpty().WithMessage("Vui lòng chọn ít nhất một vai trò (Role) cho người dùng.");

        RuleFor(x => x.NewPassword)
            .MinimumLength(6).WithMessage("Mật khẩu đặt lại phải có ít nhất 6 ký tự.")
            .When(x => !string.IsNullOrWhiteSpace(x.NewPassword));
    }
}
