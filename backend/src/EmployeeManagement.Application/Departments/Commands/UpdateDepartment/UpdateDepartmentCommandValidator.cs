using EmployeeManagement.Domain.Departments.Consts;
using FluentValidation;

namespace EmployeeManagement.Application.Departments.Commands.UpdateDepartment;

/// <summary>
/// FluentValidation rules for UpdateDepartmentCommand.
/// </summary>
public class UpdateDepartmentCommandValidator : AbstractValidator<UpdateDepartmentCommand>
{
    public UpdateDepartmentCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id phòng ban không hợp lệ.");

        RuleFor(x => x.DepartmentName)
            .NotEmpty().WithMessage("Tên phòng ban không được để trống.")
            .MinimumLength(DepartmentConsts.MinNameLength)
                .WithMessage($"Tên phòng ban phải có ít nhất {DepartmentConsts.MinNameLength} ký tự.")
            .MaximumLength(DepartmentConsts.MaxNameLength)
                .WithMessage($"Tên phòng ban không được vượt quá {DepartmentConsts.MaxNameLength} ký tự.");

        RuleFor(x => x.ParentDepartmentId)
            .Must((cmd, parentId) => !parentId.HasValue || parentId.Value != cmd.Id)
            .WithMessage("Không thể chọn chính phòng ban này làm phòng ban cấp trên.");

        RuleFor(x => x.Description)
            .MaximumLength(DepartmentConsts.MaxDescriptionLength)
                .WithMessage($"Mô tả phòng ban không được vượt quá {DepartmentConsts.MaxDescriptionLength} ký tự.");
    }
}

