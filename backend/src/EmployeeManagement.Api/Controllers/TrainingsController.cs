using EmployeeManagement.Api.Authorization;
using EmployeeManagement.Application.Common;
using EmployeeManagement.Application.Training.Commands.CreateTrainingCourse;
using EmployeeManagement.Application.Training.Commands.EnrollTraining;
using EmployeeManagement.Application.Training.Commands.UpdateTrainingProgress;
using EmployeeManagement.Application.Training.DTOs;
using EmployeeManagement.Application.Training.Queries.GetEmployeeTrainings;
using EmployeeManagement.Application.Training.Queries.GetTrainingCourses;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.Api.Controllers;

/// <summary>
/// RESTful Controller managing internal training courses, learning development, and employee progress (Phase 8).
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize]
public class TrainingsController : ControllerBase
{
    private readonly ISender _sender;

    public TrainingsController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Retrieves internal training course catalog with category filter and personal enrollment context.
    /// </summary>
    [HttpGet("courses")]
    [ProducesResponseType(typeof(ApiResponse<List<TrainingCourseDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCourses(
        [FromQuery] string? category,
        [FromQuery] string? search,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetTrainingCoursesQuery(category, search), cancellationToken);
        return Ok(ApiResponse<List<TrainingCourseDto>>.SuccessResult(result, "Tải danh mục khóa đào tạo thành công."));
    }

    /// <summary>
    /// Creates a new training course (HR Manager / Admin only).
    /// </summary>
    [HttpPost("courses")]
    [RequirePermission(PermissionNames.Training.Manage)]
    [ProducesResponseType(typeof(ApiResponse<TrainingCourseDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateCourse([FromBody] CreateTrainingCourseDto dto, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new CreateTrainingCourseCommand(dto), cancellationToken);
        var response = ApiResponse<TrainingCourseDto>.SuccessResult(result, "Tạo khóa đào tạo mới thành công.");
        return CreatedAtAction(nameof(GetCourses), new { id = result.Id }, response);
    }

    /// <summary>
    /// Retrieves enrolled training courses for the current employee or specified employee.
    /// </summary>
    [HttpGet("my-trainings")]
    [ProducesResponseType(typeof(ApiResponse<List<EmployeeTrainingDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyTrainings(
        [FromQuery] Guid? employeeId,
        [FromQuery] Guid? courseId,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetEmployeeTrainingsQuery(employeeId, courseId), cancellationToken);
        return Ok(ApiResponse<List<EmployeeTrainingDto>>.SuccessResult(result, "Tải tiến độ đào tạo thành công."));
    }

    /// <summary>
    /// Enrolls an employee into a training course.
    /// </summary>
    [HttpPost("enroll")]
    [ProducesResponseType(typeof(ApiResponse<EmployeeTrainingDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> Enroll([FromBody] EnrollTrainingDto dto, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new EnrollTrainingCommand(dto), cancellationToken);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<EmployeeTrainingDto>.SuccessResult(result, "Đăng ký tham gia khóa đào tạo thành công."));
    }

    /// <summary>
    /// Updates learning progress, exam score, and feedback for an enrolled course.
    /// </summary>
    [HttpPut("{id:guid}/progress")]
    [ProducesResponseType(typeof(ApiResponse<EmployeeTrainingDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateProgress(
        [FromRoute] Guid id,
        [FromBody] UpdateTrainingProgressDto dto,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new UpdateTrainingProgressCommand(id, dto), cancellationToken);
        return Ok(ApiResponse<EmployeeTrainingDto>.SuccessResult(result, "Cập nhật tiến độ học tập thành công."));
    }
}

