using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Application.Performance.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Performance.Queries.GetPerformanceReviewById;

public record GetPerformanceReviewByIdQuery(Guid Id) : IRequest<PerformanceReviewDto>;

public class GetPerformanceReviewByIdQueryHandler : IRequestHandler<GetPerformanceReviewByIdQuery, PerformanceReviewDto>
{
    private readonly IApplicationDbContext _context;

    public GetPerformanceReviewByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PerformanceReviewDto> Handle(GetPerformanceReviewByIdQuery request, CancellationToken cancellationToken)
    {
        var review = await _context.PerformanceReviews
            .AsNoTracking()
            .Include(r => r.ReviewCycle)
            .Include(r => r.Employee)
                .ThenInclude(e => e.Department)
            .Include(r => r.Employee)
                .ThenInclude(e => e.Position)
            .Include(r => r.ReviewerEmployee)
            .Include(r => r.PerformanceGoals)
            .FirstOrDefaultAsync(r => r.Id == request.Id, cancellationToken);

        if (review == null)
            throw new NotFoundException($"Không tìm thấy phiếu đánh giá với mã {request.Id}.");

        return new PerformanceReviewDto
        {
            Id = review.Id,
            ReviewCycleId = review.ReviewCycleId,
            CycleCode = review.ReviewCycle.CycleCode,
            CycleName = review.ReviewCycle.CycleName,
            EmployeeId = review.EmployeeId,
            EmployeeCode = review.Employee.EmployeeCode,
            EmployeeName = review.Employee.FullName,
            DepartmentName = review.Employee.Department.DepartmentName,
            PositionName = review.Employee.Position.PositionName,
            ReviewerEmployeeId = review.ReviewerEmployeeId,
            ReviewerName = review.ReviewerEmployee.FullName,
            SelfScore = review.SelfScore,
            ManagerScore = review.ManagerScore,
            FinalScore = review.FinalScore,
            RatingRank = review.RatingRank,
            EmployeeSelfComment = review.EmployeeSelfComment,
            ManagerFeedback = review.ManagerFeedback,
            DevelopmentPlan = review.DevelopmentPlan,
            Status = review.Status,
            SubmittedAt = review.SubmittedAt,
            ReviewedAt = review.ReviewedAt,
            GoalsCount = review.PerformanceGoals.Count,
            AverageProgressPercent = review.PerformanceGoals.Any()
                ? (decimal)review.PerformanceGoals.Average(g => (double)(g.ManagerAchievementScore ?? g.SelfAchievementScore ?? 0))
                : (review.FinalScore ?? 0),
            EstimatedRewardAmount = review.RatingRank == "A" ? 15000000m : (review.RatingRank == "B" ? 8000000m : (review.RatingRank == "C" ? 3000000m : 0m)),
            Goals = review.PerformanceGoals.Select(g => new PerformanceGoalDto
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
        };
    }
}
