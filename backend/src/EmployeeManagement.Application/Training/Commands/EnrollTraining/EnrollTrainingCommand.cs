using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Application.Training.DTOs;
using EmployeeManagement.Domain.Training.Consts;
using EmployeeManagement.Domain.Training.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Training.Commands.EnrollTraining;

public record EnrollTrainingCommand(EnrollTrainingDto Dto) : IRequest<EmployeeTrainingDto>;

public class EnrollTrainingCommandHandler : IRequestHandler<EnrollTrainingCommand, EmployeeTrainingDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public EnrollTrainingCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<EmployeeTrainingDto> Handle(EnrollTrainingCommand request, CancellationToken cancellationToken)
    {
        var targetEmpId = request.Dto.TargetEmployeeId ?? _currentUserService.EmployeeId;
        if (!targetEmpId.HasValue || targetEmpId == Guid.Empty)
            throw new ValidationException("Không xác định được nhân viên đăng ký đào tạo.");

        var course = await _context.TrainingCourses
            .Include(tc => tc.EmployeeTrainings)
            .FirstOrDefaultAsync(tc => tc.Id == request.Dto.CourseId, cancellationToken);

        if (course == null)
            throw new NotFoundException($"Không tìm thấy khóa đào tạo với mã {request.Dto.CourseId}.");

        var employee = await _context.Employees
            .Include(e => e.Department)
            .FirstOrDefaultAsync(e => e.Id == targetEmpId.Value, cancellationToken);

        if (employee == null)
            throw new NotFoundException($"Không tìm thấy nhân sự với mã {targetEmpId.Value}.");

        var existingEnrollment = await _context.EmployeeTrainings
            .FirstOrDefaultAsync(et => et.TrainingCourseId == course.Id && et.EmployeeId == employee.Id, cancellationToken);

        if (existingEnrollment != null)
            throw new ConflictException("Nhân viên này đã đăng ký tham gia khóa đào tạo này.");

        if (course.MaxParticipants.HasValue && course.EmployeeTrainings.Count >= course.MaxParticipants.Value)
            throw new ValidationException("Khóa đào tạo đã đủ số lượng học viên tối đa.");

        var currentEmpId = _currentUserService.EmployeeId;
        Guid? assignedBy = (targetEmpId.Value != currentEmpId) ? currentEmpId : null;

        var enrollment = new EmployeeTraining
        {
            TrainingCourseId = course.Id,
            EmployeeId = employee.Id,
            AssignedByEmployeeId = assignedBy,
            EnrollmentStatus = TrainingConsts.EnrollmentStatus.Enrolled,
            ProgressPercent = 0
        };

        _context.EmployeeTrainings.Add(enrollment);
        await _context.SaveChangesAsync(cancellationToken);

        return new EmployeeTrainingDto
        {
            Id = enrollment.Id,
            TrainingCourseId = course.Id,
            CourseCode = course.CourseCode,
            CourseName = course.CourseName,
            Category = course.Category,
            DurationHours = course.DurationHours,
            EmployeeId = employee.Id,
            EmployeeCode = employee.EmployeeCode,
            EmployeeName = employee.FullName,
            DepartmentName = employee.Department.DepartmentName,
            AssignedByEmployeeId = assignedBy,
            EnrollmentStatus = enrollment.EnrollmentStatus,
            ProgressPercent = enrollment.ProgressPercent
        };
    }
}
