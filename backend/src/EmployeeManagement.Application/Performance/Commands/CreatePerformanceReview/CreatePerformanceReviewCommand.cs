using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Application.Performance.DTOs;
using EmployeeManagement.Domain.Performance.Consts;
using EmployeeManagement.Domain.Performance.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Performance.Commands.CreatePerformanceReview;

public record CreatePerformanceReviewCommand(CreatePerformanceReviewDto Dto) : IRequest<PerformanceReviewDto>;

public class CreatePerformanceReviewCommandHandler : IRequestHandler<CreatePerformanceReviewCommand, PerformanceReviewDto>
{
    private readonly IApplicationDbContext _context;

    public CreatePerformanceReviewCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PerformanceReviewDto> Handle(CreatePerformanceReviewCommand request, CancellationToken cancellationToken)
    {
        var dto = request.Dto;

        var cycle = await _context.ReviewCycles.FirstOrDefaultAsync(c => c.Id == dto.ReviewCycleId, cancellationToken);
        if (cycle == null)
            throw new NotFoundException($"Không tìm thấy kỳ đánh giá với mã {dto.ReviewCycleId}.");

        var employee = await _context.Employees
            .Include(e => e.Department)
            .Include(e => e.Position)
            .FirstOrDefaultAsync(e => e.Id == dto.EmployeeId, cancellationToken);
        if (employee == null)
            throw new NotFoundException($"Không tìm thấy nhân viên với mã {dto.EmployeeId}.");

        var exists = await _context.PerformanceReviews
            .AnyAsync(r => r.ReviewCycleId == dto.ReviewCycleId && r.EmployeeId == dto.EmployeeId, cancellationToken);
        if (exists)
            throw new ConflictException("Nhân viên này đã có phiếu đánh giá trong kỳ này.");

        var reviewer = await _context.Employees.FirstOrDefaultAsync(e => e.Id == dto.ReviewerEmployeeId, cancellationToken);
        if (reviewer == null)
            throw new NotFoundException($"Không tìm thấy người đánh giá với mã {dto.ReviewerEmployeeId}.");

        var review = new PerformanceReview
        {
            ReviewCycleId = dto.ReviewCycleId,
            EmployeeId = dto.EmployeeId,
            ReviewerEmployeeId = dto.ReviewerEmployeeId,
            Status = PerformanceConsts.ReviewStatus.Draft
        };

        if (dto.Goals != null && dto.Goals.Count > 0)
        {
            foreach (var g in dto.Goals)
            {
                review.PerformanceGoals.Add(new PerformanceGoal
                {
                    GoalTitle = g.GoalTitle,
                    TargetDescription = g.TargetDescription,
                    WeightPercent = g.WeightPercent,
                    SelfAchievementScore = g.SelfAchievementScore,
                    ManagerAchievementScore = g.ManagerAchievementScore,
                    Comment = g.Comment
                });
            }
        }

        _context.PerformanceReviews.Add(review);
        await _context.SaveChangesAsync(cancellationToken);

        return new PerformanceReviewDto
        {
            Id = review.Id,
            ReviewCycleId = review.ReviewCycleId,
            CycleCode = cycle.CycleCode,
            CycleName = cycle.CycleName,
            EmployeeId = employee.Id,
            EmployeeCode = employee.EmployeeCode,
            EmployeeName = employee.FullName,
            DepartmentName = employee.Department.DepartmentName,
            PositionName = employee.Position.PositionName,
            ReviewerEmployeeId = reviewer.Id,
            ReviewerName = reviewer.FullName,
            Status = review.Status,
            GoalsCount = review.PerformanceGoals.Count,
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
