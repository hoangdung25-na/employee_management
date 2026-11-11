using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Application.Performance.DTOs;
using EmployeeManagement.Domain.Performance.Consts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Performance.Commands.EvaluatePerformanceReview;

public record EvaluatePerformanceReviewCommand(Guid Id, EvaluatePerformanceReviewDto Dto) : IRequest<PerformanceReviewDto>;

public class EvaluatePerformanceReviewCommandHandler : IRequestHandler<EvaluatePerformanceReviewCommand, PerformanceReviewDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public EvaluatePerformanceReviewCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<PerformanceReviewDto> Handle(EvaluatePerformanceReviewCommand request, CancellationToken cancellationToken)
    {
        var review = await _context.PerformanceReviews
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

        var dto = request.Dto;

        if (dto.IsManagerEvaluation)
        {
            // Manager Evaluation / HR Review
            if (dto.GoalScores != null && dto.GoalScores.Count > 0)
            {
                foreach (var gs in dto.GoalScores)
                {
                    var goal = review.PerformanceGoals.FirstOrDefault(g => g.Id == gs.GoalId);
                    if (goal != null)
                    {
                        goal.ManagerAchievementScore = gs.Score;
                        if (!string.IsNullOrWhiteSpace(gs.Comment))
                            goal.Comment = gs.Comment;
                    }
                }
            }

            // Calculate weighted final score
            decimal calculatedFinalScore;
            if (dto.OverallScore.HasValue)
            {
                calculatedFinalScore = dto.OverallScore.Value;
            }
            else if (review.PerformanceGoals.Any(g => g.ManagerAchievementScore.HasValue))
            {
                var totalWeight = review.PerformanceGoals.Sum(g => g.WeightPercent);
                if (totalWeight > 0)
                {
                    calculatedFinalScore = review.PerformanceGoals.Sum(g =>
                        (g.ManagerAchievementScore ?? 0) * (g.WeightPercent / totalWeight));
                }
                else
                {
                    calculatedFinalScore = review.PerformanceGoals.Average(g => g.ManagerAchievementScore ?? 0);
                }
            }
            else
            {
                calculatedFinalScore = review.SelfScore ?? 75m;
            }

            calculatedFinalScore = Math.Round(calculatedFinalScore, 2);
            review.ManagerScore = calculatedFinalScore;
            review.FinalScore = calculatedFinalScore;
            review.RatingRank = PerformanceConsts.RatingRank.CalculateRank(calculatedFinalScore);
            review.ManagerFeedback = dto.Comment;
            if (!string.IsNullOrWhiteSpace(dto.DevelopmentPlan))
                review.DevelopmentPlan = dto.DevelopmentPlan;

            review.ReviewedAt = DateTime.UtcNow;
            review.Status = PerformanceConsts.ReviewStatus.Completed;
        }
        else
        {
            // Employee Self-Review
            if (dto.GoalScores != null && dto.GoalScores.Count > 0)
            {
                foreach (var gs in dto.GoalScores)
                {
                    var goal = review.PerformanceGoals.FirstOrDefault(g => g.Id == gs.GoalId);
                    if (goal != null)
                    {
                        goal.SelfAchievementScore = gs.Score;
                        if (!string.IsNullOrWhiteSpace(gs.Comment))
                            goal.Comment = gs.Comment;
                    }
                }
            }

            decimal selfScore;
            if (dto.OverallScore.HasValue)
            {
                selfScore = dto.OverallScore.Value;
            }
            else if (review.PerformanceGoals.Any(g => g.SelfAchievementScore.HasValue))
            {
                var totalWeight = review.PerformanceGoals.Sum(g => g.WeightPercent);
                if (totalWeight > 0)
                {
                    selfScore = review.PerformanceGoals.Sum(g =>
                        (g.SelfAchievementScore ?? 0) * (g.WeightPercent / totalWeight));
                }
                else
                {
                    selfScore = review.PerformanceGoals.Average(g => g.SelfAchievementScore ?? 0);
                }
            }
            else
            {
                selfScore = 80m;
            }

            review.SelfScore = Math.Round(selfScore, 2);
            review.EmployeeSelfComment = dto.Comment;
            review.SubmittedAt = DateTime.UtcNow;
            review.Status = PerformanceConsts.ReviewStatus.SelfSubmitted;
        }

        review.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

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
            AverageProgressPercent = review.FinalScore ?? review.SelfScore ?? 0,
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
