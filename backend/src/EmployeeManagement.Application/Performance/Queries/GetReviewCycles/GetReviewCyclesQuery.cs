using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Application.Performance.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Performance.Queries.GetReviewCycles;

public record GetReviewCyclesQuery : IRequest<List<ReviewCycleDto>>;

public class GetReviewCyclesQueryHandler : IRequestHandler<GetReviewCyclesQuery, List<ReviewCycleDto>>
{
    private readonly IApplicationDbContext _context;

    public GetReviewCyclesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ReviewCycleDto>> Handle(GetReviewCyclesQuery request, CancellationToken cancellationToken)
    {
        var cycles = await _context.ReviewCycles
            .AsNoTracking()
            .OrderByDescending(c => c.StartDate)
            .Select(c => new ReviewCycleDto
            {
                Id = c.Id,
                CycleCode = c.CycleCode,
                CycleName = c.CycleName,
                CycleType = c.CycleType,
                StartDate = c.StartDate,
                EndDate = c.EndDate,
                SelfReviewDeadline = c.SelfReviewDeadline,
                ManagerReviewDeadline = c.ManagerReviewDeadline,
                Status = c.Status,
                TotalReviews = c.PerformanceReviews.Count,
                CompletedReviews = c.PerformanceReviews.Count(r => r.Status == "Completed")
            })
            .ToListAsync(cancellationToken);

        return cycles;
    }
}

