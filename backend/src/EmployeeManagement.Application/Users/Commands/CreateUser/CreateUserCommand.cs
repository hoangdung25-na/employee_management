using EmployeeManagement.Application.Users.DTOs;
using FluentValidation;
using MediatR;

namespace EmployeeManagement.Application.Users.Commands.CreateUser;

/// <summary>
/// Command to create a new system User account with assigned RBAC roles, optional custom permissions, and optional Employee profile link.
/// </summary>
public record CreateUserCommand(
    string Username,
    string Email,
    string Password,
    Guid? EmployeeId,
    IReadOnlyList<string> RoleCodes,
    IReadOnlyList<string>? CustomPermissions = null,
    bool IsActive = true,
    bool MustChangePassword = true) : IRequest<UserSummaryDto>;

public class CreateUserCommandValidator : AbstractValidator<CreateUserCommand>
{
    public CreateUserCommandValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("Tên tài khoản không được để trống.")
            .MinimumLength(3).WithMessage("Tên tài khoản phải có ít nhất 3 ký tự.")
            .MaximumLength(50).WithMessage("Tên tài khoản không được vượt quá 50 ký tự.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email không được để trống.")
            .EmailAddress().WithMessage("Định dạng Email không hợp lệ.")
            .MaximumLength(150).WithMessage("Email không được vượt quá 150 ký tự.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Mật khẩu khởi tạo không được để trống.")
            .MinimumLength(6).WithMessage("Mật khẩu phải có ít nhất 6 ký tự.");

        RuleFor(x => x.RoleCodes)
            .NotEmpty().WithMessage("Vui lòng chọn ít nhất một vai trò (Role) cho người dùng.");
    }
}
