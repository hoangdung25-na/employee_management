using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Application.Training.DTOs;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Training.Queries.GetEmployeeTrainings;

public record GetEmployeeTrainingsQuery(Guid? EmployeeId = null, Guid? CourseId = null) : IRequest<List<EmployeeTrainingDto>>;

public class GetEmployeeTrainingsQueryHandler : IRequestHandler<GetEmployeeTrainingsQuery, List<EmployeeTrainingDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetEmployeeTrainingsQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<List<EmployeeTrainingDto>> Handle(GetEmployeeTrainingsQuery request, CancellationToken cancellationToken)
    {
        var isSuperAdmin = _currentUserService.IsInRole(UserConsts.Roles.SuperAdmin);
        var isHrManager = _currentUserService.IsInRole(UserConsts.Roles.HrManager);
        var isHrStaff = _currentUserService.IsInRole(UserConsts.Roles.HrStaff);
        var isManager = _currentUserService.IsInRole(UserConsts.Roles.Manager);

        var query = _context.EmployeeTrainings
            .AsNoTracking()
            .Include(et => et.TrainingCourse)
            .Include(et => et.Employee)
                .ThenInclude(e => e.Department)
            .Include(et => et.AssignedByEmployee)
            .AsQueryable();

        if (request.CourseId.HasValue && request.CourseId != Guid.Empty)
        {
            query = query.Where(et => et.TrainingCourseId == request.CourseId.Value);
        }

        if (request.EmployeeId.HasValue && request.EmployeeId != Guid.Empty)
        {
            query = query.Where(et => et.EmployeeId == request.EmployeeId.Value);
        }
        else if (request.CourseId.HasValue && (isSuperAdmin || isHrManager || isHrStaff))
                {
            // Admin viewing all enrollments for a specific course
        }
                else
                {
                    var currentEmpId = _currentUserService.EmployeeId;
                    if (currentEmpId.HasValue && currentEmpId.Value != Guid.Empty)
                    {
                        query = query.Where(et => et.EmployeeId == currentEmpId.Value);
                    }
                    else
                    {
                        query = query.Where(et => false);
                    }
                }

        var results = await query
            .OrderByDescending(et => et.CreatedAt)
            .Select(et => new EmployeeTrainingDto
            {
                Id = et.Id,
                TrainingCourseId = et.TrainingCourseId,
                CourseCode = et.TrainingCourse.CourseCode,
                CourseName = et.TrainingCourse.CourseName,
                Category = et.TrainingCourse.Category,
                DurationHours = et.TrainingCourse.DurationHours,
                EmployeeId = et.EmployeeId,
                EmployeeCode = et.Employee.EmployeeCode,
                EmployeeName = et.Employee.FullName,
                DepartmentName = et.Employee.Department.DepartmentName,
                AssignedByEmployeeId = et.AssignedByEmployeeId,
                AssignedByName = et.AssignedByEmployee != null ? et.AssignedByEmployee.FullName : null,
                EnrollmentStatus = et.EnrollmentStatus,
                ProgressPercent = et.ProgressPercent,
                ExamScore = et.ExamScore,
                CompletedAt = et.CompletedAt,
                CertificateUrl = et.CertificateUrl,
                Feedback = et.Feedback
            })
            .ToListAsync(cancellationToken);

        return results;
    }
}

