using EmployeeManagement.Domain.Employees.Consts;
using EmployeeManagement.Domain.Employees.Enums;
using FluentValidation;

namespace EmployeeManagement.Application.Employees.Commands.UpdateEmployee;

/// <summary>
/// FluentValidation rules for UpdateEmployeeCommand.
/// </summary>
public class UpdateEmployeeCommandValidator : AbstractValidator<UpdateEmployeeCommand>
{
    public UpdateEmployeeCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id nhân viên không hợp lệ.");

        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Họ và tên nhân viên không được để trống.")
            .MinimumLength(EmployeeConsts.MinFullNameLength)
                .WithMessage($"Họ và tên phải có ít nhất {EmployeeConsts.MinFullNameLength} ký tự.")
            .MaximumLength(EmployeeConsts.MaxFullNameLength)
                .WithMessage($"Họ và tên không được vượt quá {EmployeeConsts.MaxFullNameLength} ký tự.");

        RuleFor(x => x.Gender)
            .NotEmpty().WithMessage("Giới tính không được để trống.")
            .Must(g => EmployeeConsts.ValidGenders.Contains(g))
                .WithMessage($"Giới tính phải thuộc một trong các giá trị: {string.Join(", ", EmployeeConsts.ValidGenders)}.");

        RuleFor(x => x.CitizenId)
            .Matches(EmployeeConsts.CitizenIdRegex)
                .When(x => !string.IsNullOrWhiteSpace(x.CitizenId))
                .WithMessage("Số CCCD phải bao gồm đúng 12 chữ số.");

        RuleFor(x => x.PhoneNumber)
            .Matches(EmployeeConsts.PhoneNumberRegex)
                .When(x => !string.IsNullOrWhiteSpace(x.PhoneNumber))
                .WithMessage("Số điện thoại di động không hợp lệ.");

        RuleFor(x => x.PersonalEmail)
            .EmailAddress()
                .When(x => !string.IsNullOrWhiteSpace(x.PersonalEmail))
                .WithMessage("Định dạng Email cá nhân không hợp lệ.")
            .MaximumLength(EmployeeConsts.MaxEmailLength)
                .WithMessage($"Email cá nhân không được vượt quá {EmployeeConsts.MaxEmailLength} ký tự.");

        RuleFor(x => x.Address)
            .MaximumLength(EmployeeConsts.MaxAddressLength)
                .WithMessage($"Địa chỉ không được vượt quá {EmployeeConsts.MaxAddressLength} ký tự.");

        RuleFor(x => x.DepartmentId)
            .NotEmpty().WithMessage("Phòng ban không được để trống.");

        RuleFor(x => x.PositionId)
            .NotEmpty().WithMessage("Chức danh không được để trống.");

        RuleFor(x => x.DirectManagerId)
            .Must((cmd, mgrId) => !mgrId.HasValue || mgrId.Value != cmd.Id)
            .WithMessage("Nhân viên không thể tự làm Quản lý trực tiếp của chính mình.");

        RuleFor(x => x.BaseSalary)
            .GreaterThanOrEqualTo(EmployeeConsts.MinimumBaseSalary)
                .WithMessage("Mức lương cơ bản phải lớn hơn hoặc bằng 0.");

        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Trạng thái làm việc không được để trống.")
            .Must(s => Enum.TryParse<EmployeeStatus>(s, true, out var parsed) && parsed != EmployeeStatus.Terminated)
                .WithMessage("Trạng thái cập nhật hồ sơ phải là 'Probation', 'Active' hoặc 'Suspended' (Sử dụng API thôi việc riêng cho trạng thái 'Terminated').");
    }
}

