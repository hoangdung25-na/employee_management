using EmployeeManagement.Domain.Employees.Consts;
using FluentValidation;

namespace EmployeeManagement.Application.Employees.Commands.CreateDecision;

/// <summary>
/// Validator for CreateDecisionCommand enforcing legal decision fields and constraint rules.
/// </summary>
public class CreateDecisionCommandValidator : AbstractValidator<CreateDecisionCommand>
{
    public CreateDecisionCommandValidator()
    {
        RuleFor(x => x.EmployeeId)
            .NotEmpty().WithMessage("Mã định danh nhân sự (EmployeeId) không được để trống.");

        RuleFor(x => x.DecisionType)
            .NotEmpty().WithMessage("Loại quyết định không được để trống.")
            .Must(type => DecisionConsts.DecisionTypes.All.Any(t => string.Equals(t, type, StringComparison.OrdinalIgnoreCase)))
            .WithMessage($"Loại quyết định phải thuộc: {string.Join(", ", DecisionConsts.DecisionTypes.All)}.");

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Tiêu đề / trích yếu quyết định không được để trống.")
            .MaximumLength(DecisionConsts.MaxTitleLength)
            .WithMessage($"Tiêu đề quyết định không được vượt quá {DecisionConsts.MaxTitleLength} ký tự.");

        RuleFor(x => x.EffectiveDate)
            .NotEmpty().WithMessage("Ngày có hiệu lực không được để trống.");

        RuleFor(x => x.SignDate)
            .NotEmpty().WithMessage("Ngày ký ban hành không được để trống.");

        RuleFor(x => x.Amount)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Số tiền thưởng/phạt phải lớn hơn hoặc bằng 0.");

        When(x => !string.IsNullOrEmpty(x.SignerName), () =>
        {
            RuleFor(x => x.SignerName)
                .MaximumLength(DecisionConsts.MaxSignerLength)
                .WithMessage($"Tên người ký không được vượt quá {DecisionConsts.MaxSignerLength} ký tự.");
        });

        When(x => !string.IsNullOrEmpty(x.SignerPosition), () =>
        {
            RuleFor(x => x.SignerPosition)
                .MaximumLength(DecisionConsts.MaxSignerLength)
                .WithMessage($"Chức vụ người ký không được vượt quá {DecisionConsts.MaxSignerLength} ký tự.");
        });

        When(x => !string.IsNullOrEmpty(x.Reason), () =>
        {
            RuleFor(x => x.Reason)
                .MaximumLength(DecisionConsts.MaxReasonLength)
                .WithMessage($"Lý do / căn cứ quyết định không được vượt quá {DecisionConsts.MaxReasonLength} ký tự.");
        });

        When(x => !string.IsNullOrEmpty(x.AttachmentUrl), () =>
        {
            RuleFor(x => x.AttachmentUrl)
                .MaximumLength(DecisionConsts.MaxUrlLength)
                .WithMessage($"Đường dẫn file đính kèm không được vượt quá {DecisionConsts.MaxUrlLength} ký tự.");
        });
    }
}
