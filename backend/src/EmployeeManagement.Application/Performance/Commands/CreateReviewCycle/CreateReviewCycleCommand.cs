using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Application.Performance.DTOs;
using EmployeeManagement.Domain.Performance.Consts;
using EmployeeManagement.Domain.Performance.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Performance.Commands.CreateReviewCycle;

public record CreateReviewCycleCommand(CreateReviewCycleDto Dto) : IRequest<ReviewCycleDto>;

public class CreateReviewCycleCommandHandler : IRequestHandler<CreateReviewCycleCommand, ReviewCycleDto>
{
    private readonly IApplicationDbContext _context;

    public CreateReviewCycleCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ReviewCycleDto> Handle(CreateReviewCycleCommand request, CancellationToken cancellationToken)
    {
        var dto = request.Dto;

        if (string.IsNullOrWhiteSpace(dto.CycleCode))
            throw new ValidationException("Mã kỳ đánh giá không được để trống.");

        if (string.IsNullOrWhiteSpace(dto.CycleName))
            throw new ValidationException("Tên kỳ đánh giá không được để trống.");

        if (dto.EndDate < dto.StartDate)
            throw new ValidationException("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.");

        var exists = await _context.ReviewCycles
            .AnyAsync(c => c.CycleCode == dto.CycleCode.Trim(), cancellationToken);

        if (exists)
            throw new ConflictException($"Kỳ đánh giá với mã '{dto.CycleCode}' đã tồn tại.");

        var cycle = new ReviewCycle
        {
            CycleCode = dto.CycleCode.Trim().ToUpper(),
            CycleName = dto.CycleName.Trim(),
            CycleType = dto.CycleType,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            SelfReviewDeadline = dto.SelfReviewDeadline,
            ManagerReviewDeadline = dto.ManagerReviewDeadline,
            Status = PerformanceConsts.CycleStatus.Open
        };

        _context.ReviewCycles.Add(cycle);
        await _context.SaveChangesAsync(cancellationToken);

        return new ReviewCycleDto
        {
            Id = cycle.Id,
            CycleCode = cycle.CycleCode,
            CycleName = cycle.CycleName,
            CycleType = cycle.CycleType,
            StartDate = cycle.StartDate,
            EndDate = cycle.EndDate,
            SelfReviewDeadline = cycle.SelfReviewDeadline,
            ManagerReviewDeadline = cycle.ManagerReviewDeadline,
            Status = cycle.Status,
            TotalReviews = 0,
            CompletedReviews = 0
        };
    }
}
