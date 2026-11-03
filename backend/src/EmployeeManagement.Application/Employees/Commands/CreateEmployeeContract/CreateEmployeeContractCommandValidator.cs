using EmployeeManagement.Domain.Employees.Consts;
using FluentValidation;

namespace EmployeeManagement.Application.Employees.Commands.CreateEmployeeContract;

/// <summary>
/// Validator for CreateEmployeeContractCommand enforcing labor contract rules and constraints.
/// </summary>
public class CreateEmployeeContractCommandValidator : AbstractValidator<CreateEmployeeContractCommand>
{
    public CreateEmployeeContractCommandValidator()
    {
        RuleFor(x => x.EmployeeId)
            .NotEmpty().WithMessage("Mã định danh nhân viên (EmployeeId) không được để trống.");

        RuleFor(x => x.ContractType)
            .NotEmpty().WithMessage("Loại hợp đồng không được để trống.")
            .Must(type => ContractConsts.ContractTypes.All.Contains(type))
            .WithMessage($"Loại hợp đồng phải thuộc một trong các giá trị: {string.Join(", ", ContractConsts.ContractTypes.All)}.");

        RuleFor(x => x.StartDate)
            .NotEmpty().WithMessage("Ngày bắt đầu hợp đồng không được để trống.");

        When(x => x.EndDate.HasValue, () =>
        {
            RuleFor(x => x.EndDate)
                .GreaterThanOrEqualTo(x => x.StartDate)
                .WithMessage("Ngày kết thúc hợp đồng phải lớn hơn hoặc bằng ngày bắt đầu.");
        });

        RuleFor(x => x.ContractSalary)
            .GreaterThanOrEqualTo(0).WithMessage("Mức lương hợp đồng phải lớn hơn hoặc bằng 0.");

        RuleFor(x => x.Allowances)
            .GreaterThanOrEqualTo(0).WithMessage("Khoản phụ cấp phải lớn hơn hoặc bằng 0.");

        RuleFor(x => x.FileUrl)
            .MaximumLength(ContractConsts.MaxUrlLength)
            .WithMessage($"Đường dẫn file hợp đồng không được vượt quá {ContractConsts.MaxUrlLength} ký tự.");

        RuleFor(x => x.Notes)
            .MaximumLength(ContractConsts.MaxNotesLength)
            .WithMessage($"Ghi chú hợp đồng không được vượt quá {ContractConsts.MaxNotesLength} ký tự.");
    }
}
