using EmployeeManagement.Api.Authorization;
using EmployeeManagement.Application.Common;
using EmployeeManagement.Application.Performance.Commands.CreatePerformanceReview;
using EmployeeManagement.Application.Performance.Commands.CreateReviewCycle;
using EmployeeManagement.Application.Performance.Commands.EvaluatePerformanceReview;
using EmployeeManagement.Application.Performance.DTOs;
using EmployeeManagement.Application.Performance.Queries.GetPerformanceReviewById;
using EmployeeManagement.Application.Performance.Queries.GetPerformanceReviews;
using EmployeeManagement.Application.Performance.Queries.GetPerformanceSummaryMetrics;
using EmployeeManagement.Application.Performance.Queries.GetReviewCycles;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.Api.Controllers;

/// <summary>
/// RESTful Controller managing Review Cycles, Employee KPI/OKR reviews, and evaluations (Phase 8).
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize]
public class PerformanceController : ControllerBase
{
    private readonly ISender _sender;

    public PerformanceController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Retrieves all review cycles.
    /// </summary>
    [HttpGet("cycles")]
    [ProducesResponseType(typeof(ApiResponse<List<ReviewCycleDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCycles(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetReviewCyclesQuery(), cancellationToken);
        return Ok(ApiResponse<List<ReviewCycleDto>>.SuccessResult(result, "Tải danh sách kỳ đánh giá thành công."));
    }

    /// <summary>
    /// Creates a new review cycle (HR Manager / Admin only).
    /// </summary>
    [HttpPost("cycles")]
    [Authorize(Roles = $"{UserConsts.Roles.SuperAdmin},{UserConsts.Roles.HrManager}")]
    [ProducesResponseType(typeof(ApiResponse<ReviewCycleDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateCycle([FromBody] CreateReviewCycleDto dto, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new CreateReviewCycleCommand(dto), cancellationToken);
        var response = ApiResponse<ReviewCycleDto>.SuccessResult(result, "Tạo kỳ đánh giá mới thành công.");
        return CreatedAtAction(nameof(GetCycles), new { id = result.Id }, response);
    }

    /// <summary>
    /// Retrieves aggregated KPI summary metrics (Stitch HRFlow 4 Cards).
    /// </summary>
    [HttpGet("reviews/summary")]
    [ProducesResponseType(typeof(ApiResponse<PerformanceSummaryMetricsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSummaryMetrics(
        [FromQuery] Guid? cycleId,
        [FromQuery] Guid? departmentId,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetPerformanceSummaryMetricsQuery(cycleId, departmentId), cancellationToken);
        return Ok(ApiResponse<PerformanceSummaryMetricsDto>.SuccessResult(result, "Tải tổng hợp chỉ số KPI thành công."));
    }

    /// <summary>
    /// Retrieves paginated performance reviews with filtering by cycle, department, employee, and rank.
    /// </summary>
    [HttpGet("reviews")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<PerformanceReviewDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetReviews(
        [FromQuery] Guid? cycleId,
        [FromQuery] Guid? departmentId,
        [FromQuery] Guid? employeeId,
        [FromQuery] string? rank,
        [FromQuery] string? search,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new GetPerformanceReviewsQuery(cycleId, departmentId, employeeId, rank, search, pageNumber, pageSize);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<PerformanceReviewDto>>.SuccessResult(result, "Tải danh sách phiếu đánh giá thành công."));
    }

    /// <summary>
    /// Retrieves a single review by its ID.
    /// </summary>
    [HttpGet("reviews/{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<PerformanceReviewDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetReviewById([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetPerformanceReviewByIdQuery(id), cancellationToken);
        return Ok(ApiResponse<PerformanceReviewDto>.SuccessResult(result, "Tải chi tiết phiếu đánh giá thành công."));
    }

    /// <summary>
    /// Creates / assigns a performance review for an employee with KPI goals.
    /// </summary>
    [HttpPost("reviews")]
    [RequirePermission(PermissionNames.Performance.Evaluate)]
    [ProducesResponseType(typeof(ApiResponse<PerformanceReviewDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateReview([FromBody] CreatePerformanceReviewDto dto, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new CreatePerformanceReviewCommand(dto), cancellationToken);
        var response = ApiResponse<PerformanceReviewDto>.SuccessResult(result, "Giao chỉ tiêu KPI thành công.");
        return CreatedAtAction(nameof(GetReviewById), new { id = result.Id }, response);
    }

    /// <summary>
    /// Submits employee self-evaluation or manager review with auto score & rank calculation.
    /// </summary>
    [HttpPut("reviews/{id:guid}/evaluate")]
    [ProducesResponseType(typeof(ApiResponse<PerformanceReviewDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> EvaluateReview(
        [FromRoute] Guid id,
        [FromBody] EvaluatePerformanceReviewDto dto,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new EvaluatePerformanceReviewCommand(id, dto), cancellationToken);
        var message = dto.IsManagerEvaluation
            ? "Thẩm định và xếp loại KPI thành công."
            : "Nộp bản tự đánh giá KPI thành công.";
        return Ok(ApiResponse<PerformanceReviewDto>.SuccessResult(result, message));
    }
}

