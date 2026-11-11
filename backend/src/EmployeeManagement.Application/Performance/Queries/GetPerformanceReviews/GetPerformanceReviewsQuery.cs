using EmployeeManagement.Application.Common;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Application.Performance.DTOs;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Performance.Queries.GetPerformanceReviews;

public record GetPerformanceReviewsQuery(
    Guid? CycleId = null,
    Guid? DepartmentId = null,
    Guid? EmployeeId = null,
    string? Rank = null,
    string? Search = null,
    int PageNumber = 1,
    int PageSize = 20
) : IRequest<PagedResult<PerformanceReviewDto>>;

public class GetPerformanceReviewsQueryHandler : IRequestHandler<GetPerformanceReviewsQuery, PagedResult<PerformanceReviewDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetPerformanceReviewsQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<PagedResult<PerformanceReviewDto>> Handle(GetPerformanceReviewsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.PerformanceReviews
            .AsNoTracking()
            .Include(r => r.ReviewCycle)
            .Include(r => r.Employee)
                .ThenInclude(e => e.Department)
            .Include(r => r.Employee)
                .ThenInclude(e => e.Position)
            .Include(r => r.ReviewerEmployee)
            .Include(r => r.PerformanceGoals)
            .AsQueryable();

        // 1. Cycle filter
        if (request.CycleId.HasValue && request.CycleId != Guid.Empty)
        {
            query = query.Where(r => r.ReviewCycleId == request.CycleId.Value);
        }

        // 2. Department filter
        if (request.DepartmentId.HasValue && request.DepartmentId != Guid.Empty)
        {
            query = query.Where(r => r.Employee.DepartmentId == request.DepartmentId.Value);
        }

        // 3. Employee filter
        if (request.EmployeeId.HasValue && request.EmployeeId != Guid.Empty)
        {
            query = query.Where(r => r.EmployeeId == request.EmployeeId.Value);
        }

        // 4. Rank filter
        if (!string.IsNullOrWhiteSpace(request.Rank) && request.Rank != "All")
        {
            query = query.Where(r => r.RatingRank == request.Rank);
        }

        // 5. Search keyword
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim().ToLower();
            query = query.Where(r =>
                r.Employee.FullName.ToLower().Contains(term) ||
                r.Employee.EmployeeCode.ToLower().Contains(term));
        }

        // 6. RBAC & Data Isolation
        var isSuperAdmin = _currentUserService.IsInRole(UserConsts.Roles.SuperAdmin);
        var isHrManager = _currentUserService.IsInRole(UserConsts.Roles.HrManager);
        var isHrStaff = _currentUserService.IsInRole(UserConsts.Roles.HrStaff);
        var isManager = _currentUserService.IsInRole(UserConsts.Roles.Manager);

        if (!isSuperAdmin && !isHrManager && !isHrStaff)
        {
            var currentEmpId = _currentUserService.EmployeeId ?? Guid.Empty;
            if (isManager)
            {
                query = query.Where(r =>
                    r.EmployeeId == currentEmpId ||
                    r.ReviewerEmployeeId == currentEmpId ||
                    r.Employee.DirectManagerId == currentEmpId);
            }
            else
            {
                // Normal Employee (ESS)
                query = query.Where(r => r.EmployeeId == currentEmpId);
            }
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var reviews = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(r => new PerformanceReviewDto
            {
                Id = r.Id,
                ReviewCycleId = r.ReviewCycleId,
                CycleCode = r.ReviewCycle.CycleCode,
                CycleName = r.ReviewCycle.CycleName,
                EmployeeId = r.EmployeeId,
                EmployeeCode = r.Employee.EmployeeCode,
                EmployeeName = r.Employee.FullName,
                DepartmentId = r.Employee.DepartmentId,
                DepartmentName = r.Employee.Department.DepartmentName,
                PositionName = r.Employee.Position.PositionName,
                ReviewerEmployeeId = r.ReviewerEmployeeId,
                ReviewerName = r.ReviewerEmployee.FullName,
                SelfScore = r.SelfScore,
                ManagerScore = r.ManagerScore,
                FinalScore = r.FinalScore,
                RatingRank = r.RatingRank,
                EmployeeSelfComment = r.EmployeeSelfComment,
                ManagerFeedback = r.ManagerFeedback,
                DevelopmentPlan = r.DevelopmentPlan,
                Status = r.Status,
                SubmittedAt = r.SubmittedAt,
                ReviewedAt = r.ReviewedAt,
                GoalsCount = r.PerformanceGoals.Count,
                AverageProgressPercent = r.PerformanceGoals.Any()
                    ? (decimal)r.PerformanceGoals.Average(g => (double)(g.ManagerAchievementScore ?? g.SelfAchievementScore ?? 0))
                    : (r.FinalScore ?? 0),
                EstimatedRewardAmount = r.RatingRank == "A" ? 15000000m : (r.RatingRank == "B" ? 8000000m : (r.RatingRank == "C" ? 3000000m : 0m)),
                Goals = r.PerformanceGoals.Select(g => new PerformanceGoalDto
                {
                    Id = g.Id,
                    PerformanceReviewId = g.PerformanceReviewId,
                    GoalTitle = g.GoalTitle,
                    TargetDescription = g.TargetDescription,
                    WeightPercent = g.WeightPercent,
                    SelfAchievementScore = g.SelfAchievementScore,
                    ManagerAchievementScore = g.ManagerAchievementScore,
                    Comment = g.Comment
                }).ToList()
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<PerformanceReviewDto>(reviews, totalCount, request.PageNumber, request.PageSize);
    }
}

