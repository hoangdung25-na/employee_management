using EmployeeManagement.Domain.Departments.Consts;
using FluentValidation;

namespace EmployeeManagement.Application.Departments.Commands.CreateDepartment;

/// <summary>
/// FluentValidation rules for CreateDepartmentCommand.
/// </summary>
public class CreateDepartmentCommandValidator : AbstractValidator<CreateDepartmentCommand>
{
    public CreateDepartmentCommandValidator()
    {
        RuleFor(x => x.DepartmentCode)
            .NotEmpty().WithMessage("Mã phòng ban không được để trống.")
            .MinimumLength(2).WithMessage("Mã phòng ban phải có ít nhất 2 ký tự.")
            .MaximumLength(DepartmentConsts.MaxCodeLength)
                .WithMessage($"Mã phòng ban không được vượt quá {DepartmentConsts.MaxCodeLength} ký tự.")
            .Matches(@"^[A-Z0-9_]+$")
                .WithMessage("Mã phòng ban chỉ được chứa chữ cái in hoa, chữ số và dấu gạch dưới (không chứa khoảng trắng).");

        RuleFor(x => x.DepartmentName)
            .NotEmpty().WithMessage("Tên phòng ban không được để trống.")
            .MinimumLength(DepartmentConsts.MinNameLength)
                .WithMessage($"Tên phòng ban phải có ít nhất {DepartmentConsts.MinNameLength} ký tự.")
            .MaximumLength(DepartmentConsts.MaxNameLength)
                .WithMessage($"Tên phòng ban không được vượt quá {DepartmentConsts.MaxNameLength} ký tự.");

        RuleFor(x => x.Description)
            .MaximumLength(DepartmentConsts.MaxDescriptionLength)
                .WithMessage($"Mô tả phòng ban không được vượt quá {DepartmentConsts.MaxDescriptionLength} ký tự.");
    }
}

