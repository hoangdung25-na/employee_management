using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Application.Training.DTOs;
using EmployeeManagement.Domain.Training.Consts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Training.Commands.UpdateTrainingProgress;

public record UpdateTrainingProgressCommand(Guid Id, UpdateTrainingProgressDto Dto) : IRequest<EmployeeTrainingDto>;

public class UpdateTrainingProgressCommandHandler : IRequestHandler<UpdateTrainingProgressCommand, EmployeeTrainingDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateTrainingProgressCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<EmployeeTrainingDto> Handle(UpdateTrainingProgressCommand request, CancellationToken cancellationToken)
    {
        var enrollment = await _context.EmployeeTrainings
            .Include(et => et.TrainingCourse)
            .Include(et => et.Employee)
                .ThenInclude(e => e.Department)
            .Include(et => et.AssignedByEmployee)
            .FirstOrDefaultAsync(et => et.Id == request.Id, cancellationToken);

        if (enrollment == null)
            throw new NotFoundException($"Không tìm thấy bản ghi đào tạo với mã {request.Id}.");

        var dto = request.Dto;

        enrollment.ProgressPercent = Math.Clamp(dto.ProgressPercent, 0, 100);

        if (dto.ExamScore.HasValue)
            enrollment.ExamScore = dto.ExamScore.Value;

        if (!string.IsNullOrWhiteSpace(dto.Feedback))
            enrollment.Feedback = dto.Feedback;

        if (!string.IsNullOrWhiteSpace(dto.EnrollmentStatus))
        {
            enrollment.EnrollmentStatus = dto.EnrollmentStatus;
        }
        else if (enrollment.ProgressPercent >= 100)
        {
            enrollment.EnrollmentStatus = TrainingConsts.EnrollmentStatus.Completed;
            enrollment.CompletedAt = DateTime.UtcNow;
        }
        else if (enrollment.ProgressPercent > 0)
        {
            enrollment.EnrollmentStatus = TrainingConsts.EnrollmentStatus.InProgress;
        }

        enrollment.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return new EmployeeTrainingDto
        {
            Id = enrollment.Id,
            TrainingCourseId = enrollment.TrainingCourseId,
            CourseCode = enrollment.TrainingCourse.CourseCode,
            CourseName = enrollment.TrainingCourse.CourseName,
            Category = enrollment.TrainingCourse.Category,
            DurationHours = enrollment.TrainingCourse.DurationHours,
            EmployeeId = enrollment.EmployeeId,
            EmployeeCode = enrollment.Employee.EmployeeCode,
            EmployeeName = enrollment.Employee.FullName,
            DepartmentName = enrollment.Employee.Department.DepartmentName,
            AssignedByEmployeeId = enrollment.AssignedByEmployeeId,
            AssignedByName = enrollment.AssignedByEmployee != null ? enrollment.AssignedByEmployee.FullName : null,
            EnrollmentStatus = enrollment.EnrollmentStatus,
            ProgressPercent = enrollment.ProgressPercent,
            ExamScore = enrollment.ExamScore,
            CompletedAt = enrollment.CompletedAt,
            CertificateUrl = enrollment.CertificateUrl,
            Feedback = enrollment.Feedback
        };
    }
}
