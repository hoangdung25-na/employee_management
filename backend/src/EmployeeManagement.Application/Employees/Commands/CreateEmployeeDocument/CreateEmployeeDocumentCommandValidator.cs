using EmployeeManagement.Domain.Employees.Consts;
using FluentValidation;

namespace EmployeeManagement.Application.Employees.Commands.CreateEmployeeDocument;

/// <summary>
/// Validator for CreateEmployeeDocumentCommand enforcing document constraints and types.
/// </summary>
public class CreateEmployeeDocumentCommandValidator : AbstractValidator<CreateEmployeeDocumentCommand>
{
    public CreateEmployeeDocumentCommandValidator()
    {
        RuleFor(x => x.EmployeeId)
            .NotEmpty().WithMessage("Mã định danh nhân viên (EmployeeId) không được để trống.");

        RuleFor(x => x.DocumentType)
            .NotEmpty().WithMessage("Loại tài liệu không được để trống.")
            .Must(type => DocumentConsts.DocumentTypes.All.Contains(type))
            .WithMessage($"Loại tài liệu phải thuộc một trong các giá trị: {string.Join(", ", DocumentConsts.DocumentTypes.All)}.");

        RuleFor(x => x.DocumentTitle)
            .NotEmpty().WithMessage("Tiêu đề tài liệu không được để trống.")
            .MaximumLength(DocumentConsts.MaxTitleLength)
            .WithMessage($"Tiêu đề tài liệu không được vượt quá {DocumentConsts.MaxTitleLength} ký tự.");

        RuleFor(x => x.FileName)
            .NotEmpty().WithMessage("Tên file không được để trống.")
            .MaximumLength(DocumentConsts.MaxFileNameLength)
            .WithMessage($"Tên file không được vượt quá {DocumentConsts.MaxFileNameLength} ký tự.");

        RuleFor(x => x.FileUrl)
            .NotEmpty().WithMessage("Đường dẫn file (FileUrl) không được để trống.")
            .MaximumLength(DocumentConsts.MaxUrlLength)
            .WithMessage($"Đường dẫn file không được vượt quá {DocumentConsts.MaxUrlLength} ký tự.");

        RuleFor(x => x.FileSizeBytes)
            .GreaterThanOrEqualTo(0).WithMessage("Kích thước file phải lớn hơn hoặc bằng 0 bytes.");

        When(x => x.ExpiryDate.HasValue && x.IssueDate.HasValue, () =>
        {
            RuleFor(x => x.ExpiryDate)
                .GreaterThanOrEqualTo(x => x.IssueDate!.Value)
                .WithMessage("Ngày hết hạn tài liệu phải lớn hơn hoặc bằng ngày cấp.");
        });

        RuleFor(x => x.Notes)
            .MaximumLength(DocumentConsts.MaxNotesLength)
            .WithMessage($"Ghi chú không được vượt quá {DocumentConsts.MaxNotesLength} ký tự.");
    }
}
