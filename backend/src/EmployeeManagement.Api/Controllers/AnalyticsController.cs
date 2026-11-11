using EmployeeManagement.Api.Authorization;
using EmployeeManagement.Application.Analytics.DTOs;
using EmployeeManagement.Application.Analytics.Queries.GetHrAnalyticsDashboard;
using EmployeeManagement.Application.Common;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.Api.Controllers;

/// <summary>
/// RESTful Controller querying 3 SQL Views to deliver comprehensive HR Analytics and metrics (Phase 8).
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize]
public class AnalyticsController : ControllerBase
{
    private readonly ISender _sender;

    public AnalyticsController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Retrieves consolidated HR Analytics dashboard combining Headcount & Turnover, Monthly Attendance & OT, and KPI & Training overview.
    /// </summary>
    [HttpGet("dashboard")]
    [RequirePermission(PermissionNames.Analytics.View)]
    [ProducesResponseType(typeof(ApiResponse<HrAnalyticsDashboardDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboard(
        [FromQuery] int? year,
        [FromQuery] int? month,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetHrAnalyticsDashboardQuery(year, month), cancellationToken);
        return Ok(ApiResponse<HrAnalyticsDashboardDto>.SuccessResult(result, "Tải số liệu phân tích HR Analytics thành công."));
    }
}

