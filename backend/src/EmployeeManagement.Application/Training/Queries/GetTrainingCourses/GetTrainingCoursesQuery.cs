using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Application.Training.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Training.Queries.GetTrainingCourses;

public record GetTrainingCoursesQuery(string? Category = null, string? Search = null) : IRequest<List<TrainingCourseDto>>;

public class GetTrainingCoursesQueryHandler : IRequestHandler<GetTrainingCoursesQuery, List<TrainingCourseDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetTrainingCoursesQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<List<TrainingCourseDto>> Handle(GetTrainingCoursesQuery request, CancellationToken cancellationToken)
    {
        var currentEmpId = _currentUserService.EmployeeId;

        var query = _context.TrainingCourses
            .AsNoTracking()
            .Include(tc => tc.EmployeeTrainings)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Category) && request.Category != "All")
        {
            query = query.Where(tc => tc.Category == request.Category);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim().ToLower();
            query = query.Where(tc =>
                tc.CourseCode.ToLower().Contains(term) ||
                tc.CourseName.ToLower().Contains(term) ||
                (tc.InstructorName != null && tc.InstructorName.ToLower().Contains(term)));
        }

        var courses = await query
            .OrderByDescending(tc => tc.StartDate)
            .Select(tc => new TrainingCourseDto
            {
                Id = tc.Id,
                CourseCode = tc.CourseCode,
                CourseName = tc.CourseName,
                Category = tc.Category,
                InstructorName = tc.InstructorName,
                DurationHours = tc.DurationHours,
                StartDate = tc.StartDate,
                EndDate = tc.EndDate,
                IsMandatory = tc.IsMandatory,
                MaxParticipants = tc.MaxParticipants,
                Status = tc.Status,
                Description = tc.Description,
                EnrolledCount = tc.EmployeeTrainings.Count,
                CompletedCount = tc.EmployeeTrainings.Count(et => et.EnrollmentStatus == "Completed"),
                IsEnrolled = currentEmpId != null && tc.EmployeeTrainings.Any(et => et.EmployeeId == currentEmpId.Value),
                MyEnrollmentStatus = currentEmpId != null
                    ? tc.EmployeeTrainings.Where(et => et.EmployeeId == currentEmpId.Value).Select(et => et.EnrollmentStatus).FirstOrDefault()
                    : null,
                MyProgressPercent = currentEmpId != null
                    ? tc.EmployeeTrainings.Where(et => et.EmployeeId == currentEmpId.Value).Select(et => (int?)et.ProgressPercent).FirstOrDefault()
                    : null,
                MyExamScore = currentEmpId != null
                    ? tc.EmployeeTrainings.Where(et => et.EmployeeId == currentEmpId.Value).Select(et => et.ExamScore).FirstOrDefault()
                    : null
            })
            .ToListAsync(cancellationToken);

        return courses;
    }
}

