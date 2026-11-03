using EmployeeManagement.Domain.Employees.Consts;
using FluentValidation;

namespace EmployeeManagement.Application.Employees.Commands.TerminateEmployee;

/// <summary>
/// FluentValidation rules for TerminateEmployeeCommand.
/// </summary>
public class TerminateEmployeeCommandValidator : AbstractValidator<TerminateEmployeeCommand>
{
    public TerminateEmployeeCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id nhân viên không hợp lệ.");

        RuleFor(x => x.TerminationDate)
            .NotEmpty().WithMessage("Ngày thôi việc không được để trống.");

        RuleFor(x => x.TerminationReason)
            .NotEmpty().WithMessage("Lý do thôi việc không được để trống.")
            .MaximumLength(EmployeeConsts.MaxTerminationReasonLength)
                .WithMessage($"Lý do thôi việc không được vượt quá {EmployeeConsts.MaxTerminationReasonLength} ký tự.");
    }
}

