using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Application.Performance.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Performance.Queries.GetPerformanceSummaryMetrics;

public record GetPerformanceSummaryMetricsQuery(Guid? CycleId = null, Guid? DepartmentId = null) : IRequest<PerformanceSummaryMetricsDto>;

public class GetPerformanceSummaryMetricsQueryHandler : IRequestHandler<GetPerformanceSummaryMetricsQuery, PerformanceSummaryMetricsDto>
{
    private readonly IApplicationDbContext _context;

    public GetPerformanceSummaryMetricsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PerformanceSummaryMetricsDto> Handle(GetPerformanceSummaryMetricsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.PerformanceReviews
            .AsNoTracking()
            .Include(r => r.PerformanceGoals)
            .Include(r => r.Employee)
            .AsQueryable();

        if (request.CycleId.HasValue && request.CycleId != Guid.Empty)
        {
            query = query.Where(r => r.ReviewCycleId == request.CycleId.Value);
        }

        if (request.DepartmentId.HasValue && request.DepartmentId != Guid.Empty)
        {
            query = query.Where(r => r.Employee.DepartmentId == request.DepartmentId.Value);
        }

        var reviews = await query.ToListAsync(cancellationToken);
        var totalReviews = reviews.Count;

        if (totalReviews == 0)
        {
            return new PerformanceSummaryMetricsDto
            {
                TotalEmployees = 0,
                AverageCompletionPercent = 0,
                PassAndExcellentRate = 0,
                RankACount = 0,
                RankBCount = 0,
                RankCCount = 0,
                RankDCount = 0,
                ProjectedBonusFund = 0
            };
        }

        var rankA = reviews.Count(r => r.RatingRank == "A");
        var rankB = reviews.Count(r => r.RatingRank == "B");
        var rankC = reviews.Count(r => r.RatingRank == "C");
        var rankD = reviews.Count(r => r.RatingRank == "D");

        var passAndExcellent = totalReviews > 0 ? (decimal)Math.Round((double)(rankA + rankB) / totalReviews * 100, 1) : 0;
        var avgCompletion = (decimal)Math.Round(reviews.Average(r => (double)(r.FinalScore ?? r.ManagerScore ?? r.SelfScore ?? 80m)), 1);

        // Projected Bonus Fund: A = 15m, B = 8m, C = 3m, D = 0
        var totalBonus = (rankA * 15000000m) + (rankB * 8000000m) + (rankC * 3000000m);

        return new PerformanceSummaryMetricsDto
        {
            TotalEmployees = totalReviews,
            AverageCompletionPercent = avgCompletion,
            PassAndExcellentRate = passAndExcellent,
            RankACount = rankA,
            RankBCount = rankB,
            RankCCount = rankC,
            RankDCount = rankD,
            ProjectedBonusFund = totalBonus
        };
    }
}

