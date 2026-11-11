using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Application.Training.DTOs;
using EmployeeManagement.Domain.Training.Consts;
using EmployeeManagement.Domain.Training.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Training.Commands.CreateTrainingCourse;

public record CreateTrainingCourseCommand(CreateTrainingCourseDto Dto) : IRequest<TrainingCourseDto>;

public class CreateTrainingCourseCommandHandler : IRequestHandler<CreateTrainingCourseCommand, TrainingCourseDto>
{
    private readonly IApplicationDbContext _context;

    public CreateTrainingCourseCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<TrainingCourseDto> Handle(CreateTrainingCourseCommand request, CancellationToken cancellationToken)
    {
        var dto = request.Dto;

        if (string.IsNullOrWhiteSpace(dto.CourseCode))
            throw new ValidationException("Mã khóa đào tạo không được để trống.");

        if (string.IsNullOrWhiteSpace(dto.CourseName))
            throw new ValidationException("Tên khóa đào tạo không được để trống.");

        if (dto.EndDate < dto.StartDate)
            throw new ValidationException("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.");

        var exists = await _context.TrainingCourses
            .AnyAsync(tc => tc.CourseCode == dto.CourseCode.Trim(), cancellationToken);

        if (exists)
            throw new ConflictException($"Khóa đào tạo với mã '{dto.CourseCode}' đã tồn tại.");

        var course = new TrainingCourse
        {
            CourseCode = dto.CourseCode.Trim().ToUpper(),
            CourseName = dto.CourseName.Trim(),
            Category = dto.Category,
            InstructorName = dto.InstructorName,
            DurationHours = dto.DurationHours,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            IsMandatory = dto.IsMandatory,
            MaxParticipants = dto.MaxParticipants,
            Status = TrainingConsts.CourseStatus.Upcoming,
            Description = dto.Description
        };

        _context.TrainingCourses.Add(course);
        await _context.SaveChangesAsync(cancellationToken);

        return new TrainingCourseDto
        {
            Id = course.Id,
            CourseCode = course.CourseCode,
            CourseName = course.CourseName,
            Category = course.Category,
            InstructorName = course.InstructorName,
            DurationHours = course.DurationHours,
            StartDate = course.StartDate,
            EndDate = course.EndDate,
            IsMandatory = course.IsMandatory,
            MaxParticipants = course.MaxParticipants,
            Status = course.Status,
            Description = course.Description,
            EnrolledCount = 0,
            CompletedCount = 0
        };
    }
}
