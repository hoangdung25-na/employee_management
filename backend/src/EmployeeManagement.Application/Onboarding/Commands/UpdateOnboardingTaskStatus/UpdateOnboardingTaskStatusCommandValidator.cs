using EmployeeManagement.Domain.Employees.Consts;
using FluentValidation;

namespace EmployeeManagement.Application.Onboarding.Commands.UpdateOnboardingTaskStatus;

/// <summary>
/// Validator for UpdateOnboardingTaskStatusCommand.
/// </summary>
public class UpdateOnboardingTaskStatusCommandValidator : AbstractValidator<UpdateOnboardingTaskStatusCommand>
{
    public UpdateOnboardingTaskStatusCommandValidator()
    {
        RuleFor(x => x.TaskId)
            .NotEmpty().WithMessage("Mã đầu việc (TaskId) không được để trống.");

        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Trạng thái đầu việc không được để trống.")
            .Must(s => OnboardingConsts.TaskStatuses.All.Contains(s))
            .WithMessage($"Trạng thái phải thuộc một trong các giá trị: {string.Join(", ", OnboardingConsts.TaskStatuses.All)}.");

        RuleFor(x => x.Notes)
            .MaximumLength(OnboardingConsts.MaxNotesLength)
            .WithMessage($"Ghi chú không được vượt quá {OnboardingConsts.MaxNotesLength} ký tự.");
    }
}

