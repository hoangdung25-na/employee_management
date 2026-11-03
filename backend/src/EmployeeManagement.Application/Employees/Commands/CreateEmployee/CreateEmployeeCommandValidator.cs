using EmployeeManagement.Domain.Employees.Consts;
using EmployeeManagement.Domain.Employees.Enums;
using FluentValidation;

namespace EmployeeManagement.Application.Employees.Commands.CreateEmployee;

/// <summary>
/// FluentValidation rules for CreateEmployeeCommand enforcing labor age (>= 18), 12-digit CitizenId, and compensation rules.
/// </summary>
public class CreateEmployeeCommandValidator : AbstractValidator<CreateEmployeeCommand>
{
    public CreateEmployeeCommandValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Họ và tên nhân viên không được để trống.")
            .MinimumLength(EmployeeConsts.MinFullNameLength)
                .WithMessage($"Họ và tên phải có ít nhất {EmployeeConsts.MinFullNameLength} ký tự.")
            .MaximumLength(EmployeeConsts.MaxFullNameLength)
                .WithMessage($"Họ và tên không được vượt quá {EmployeeConsts.MaxFullNameLength} ký tự.");

        RuleFor(x => x.DateOfBirth)
            .NotEmpty().WithMessage("Ngày sinh không được để trống.")
            .Must((cmd, dob) => dob.AddYears(EmployeeConsts.MinimumWorkingAge) <= cmd.HireDate)
                .WithMessage("Nhân viên phải đủ 18 tuổi tính đến ngày bắt đầu làm việc (DateOfBirth + 18 năm <= HireDate).");

        RuleFor(x => x.Gender)
            .NotEmpty().WithMessage("Giới tính không được để trống.")
            .Must(g => EmployeeConsts.ValidGenders.Contains(g))
                .WithMessage($"Giới tính phải thuộc một trong các giá trị: {string.Join(", ", EmployeeConsts.ValidGenders)}.");

        RuleFor(x => x.CitizenId)
            .NotEmpty().WithMessage("Số CCCD không được để trống.")
            .Matches(EmployeeConsts.CitizenIdRegex)
                .WithMessage("Số CCCD phải bao gồm đúng 12 chữ số.");

        RuleFor(x => x.PhoneNumber)
            .Matches(EmployeeConsts.PhoneNumberRegex)
                .When(x => !string.IsNullOrWhiteSpace(x.PhoneNumber))
                .WithMessage("Số điện thoại di động không hợp lệ.");

        RuleFor(x => x.WorkEmail)
            .NotEmpty().WithMessage("Email công ty không được để trống.")
            .EmailAddress().WithMessage("Định dạng Email công ty không hợp lệ.")
            .MaximumLength(EmployeeConsts.MaxEmailLength)
                .WithMessage($"Email công ty không được vượt quá {EmployeeConsts.MaxEmailLength} ký tự.");

        RuleFor(x => x.PersonalEmail)
            .EmailAddress()
                .When(x => !string.IsNullOrWhiteSpace(x.PersonalEmail))
                .WithMessage("Định dạng Email cá nhân không hợp lệ.")
            .MaximumLength(EmployeeConsts.MaxEmailLength)
                .WithMessage($"Email cá nhân không được vượt quá {EmployeeConsts.MaxEmailLength} ký tự.");

        RuleFor(x => x.Address)
            .MaximumLength(EmployeeConsts.MaxAddressLength)
                .WithMessage($"Địa chỉ không được vượt quá {EmployeeConsts.MaxAddressLength} ký tự.");

        RuleFor(x => x.HireDate)
            .NotEmpty().WithMessage("Ngày vào làm không được để trống.");

        RuleFor(x => x.DepartmentId)
            .NotEmpty().WithMessage("Phòng ban không được để trống.");

        RuleFor(x => x.PositionId)
            .NotEmpty().WithMessage("Chức danh không được để trống.");

        RuleFor(x => x.BaseSalary)
            .GreaterThanOrEqualTo(EmployeeConsts.MinimumBaseSalary)
                .WithMessage("Mức lương cơ bản phải lớn hơn hoặc bằng 0.");

        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Trạng thái làm việc không được để trống.")
            .Must(s => Enum.TryParse<EmployeeStatus>(s, true, out var parsed) &&
                       (parsed == EmployeeStatus.Probation || parsed == EmployeeStatus.Active))
                .WithMessage("Trạng thái tiếp nhận mới chỉ được phép là 'Probation' hoặc 'Active'.");
    }
}

