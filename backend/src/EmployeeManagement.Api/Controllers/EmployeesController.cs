using EmployeeManagement.Api.Authorization;
using EmployeeManagement.Application.Common;
using EmployeeManagement.Application.Employees.Commands.CreateDecision;
using EmployeeManagement.Application.Employees.Commands.CreateEmployee;
using EmployeeManagement.Application.Employees.Commands.CreateEmployeeContract;
using EmployeeManagement.Application.Employees.Commands.CreateEmployeeDocument;
using EmployeeManagement.Application.Employees.Commands.DeleteEmployeeDocument;
using EmployeeManagement.Application.Employees.Commands.TerminateEmployee;
using EmployeeManagement.Application.Employees.Commands.UpdateEmployee;
using EmployeeManagement.Application.Employees.DTOs;
using EmployeeManagement.Application.Employees.Queries.GetDepartmentManagers;
using EmployeeManagement.Application.Employees.Queries.GetDecisionById;
using EmployeeManagement.Application.Employees.Queries.GetEmployeeById;
using EmployeeManagement.Application.Employees.Queries.GetEmployeeContracts;
using EmployeeManagement.Application.Employees.Queries.GetEmployeeDecisions;
using EmployeeManagement.Application.Employees.Queries.GetEmployeeDocuments;
using EmployeeManagement.Application.Employees.Queries.GetEmployees;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.Api.Controllers;

/// <summary>
/// Thin RESTful Controller for Core Employee HRM & ESS Profile operations.
/// Enforces 5-Role RBAC policies, Row-Level Data Ownership (ESS Self-Only), and Salary Privacy.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class EmployeesController : ControllerBase
{
    private readonly ISender _sender;

    public EmployeesController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Retrieves a paginated list of employees with optional search, department, and status filtering.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<EmployeeSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEmployees(
        [FromQuery] GetEmployeesQuery query,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<EmployeeSummaryDto>>.SuccessResult(result, "Lấy danh sách nhân viên thành công."));
    }

    /// <summary>
    /// Retrieves eligible Direct Manager candidates filtered by Department and JobLevel hierarchy.
    /// Excludes non-managerial staff to maintain organization structure integrity.
    /// </summary>
    [HttpGet("managers")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ManagerOptionDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDepartmentManagers(
        [FromQuery] Guid? departmentId,
        [FromQuery] Guid? excludeEmployeeId,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetDepartmentManagersQuery(departmentId, excludeEmployeeId), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<ManagerOptionDto>>.SuccessResult(result, "Lấy danh sách người quản lý hợp lệ thành công."));
    }

    /// <summary>
    /// Retrieves the full profile of a single employee by GUID.
    /// Enforces Row-Level Data Ownership for EMPLOYEE role and masks BaseSalary for HR_STAFF.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<EmployeeDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetEmployeeById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetEmployeeByIdQuery(id), cancellationToken);
        return Ok(ApiResponse<EmployeeDetailDto>.SuccessResult(result, "Lấy thông tin chi tiết nhân viên thành công."));
    }

    /// <summary>
    /// Onboards a new employee and automatically generates a sequential EmployeeCode (EMP-xxxxx).
    /// </summary>
    [HttpPost]
    [RequirePermission(PermissionNames.Employees.Create)]
    [ProducesResponseType(typeof(ApiResponse<EmployeeDetailDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateEmployee(
        [FromBody] CreateEmployeeCommand command,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(command, cancellationToken);
        var response = ApiResponse<EmployeeDetailDto>.SuccessResult(result, "Tiếp nhận nhân viên mới thành công.");

        return CreatedAtAction(nameof(GetEmployeeById), new { id = result.Id }, response);
    }

    /// <summary>
    /// Updates an existing employee's profile and compensation by GUID.
    /// </summary>
    [HttpPut("{id:guid}")]
    [RequirePermission(PermissionNames.Employees.Update)]
    [ProducesResponseType(typeof(ApiResponse<EmployeeDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateEmployee(
        Guid id,
        [FromBody] UpdateEmployeeRequestDto dto,
        CancellationToken cancellationToken)
    {
        var command = new UpdateEmployeeCommand(
            id,
            dto.FullName,
            dto.DateOfBirth,
            dto.Gender,
            dto.PhoneNumber,
            dto.PersonalEmail,
            dto.Address,
            dto.DepartmentId,
            dto.PositionId,
            dto.DirectManagerId,
            dto.BaseSalary,
            dto.AvatarUrl,
            dto.Status,
            dto.CitizenId,
            dto.HireDate,
            dto.ProbationEndDate,
            dto.TaxCode,
            dto.SocialInsuranceNumber,
            dto.BankAccountNumber,
            dto.BankName);

        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<EmployeeDetailDto>.SuccessResult(result, "Cập nhật hồ sơ nhân viên thành công."));
    }

    /// <summary>
    /// Executes the employee termination (offboarding) procedure, unassigning department leadership
    /// and immediately deactivating the linked User account.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [RequirePermission(PermissionNames.Employees.Terminate)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> TerminateEmployee(
        Guid id,
        [FromBody] TerminateEmployeeRequestDto dto,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(
            new TerminateEmployeeCommand(id, dto.TerminationDate, dto.TerminationReason),
            cancellationToken);

        return Ok(ApiResponse<bool>.SuccessResult(result, "Thực hiện thủ tục thôi việc và thu hồi quyền truy cập thành công."));
    }

    /// <summary>
    /// Retrieves all digital documents attached to an employee.
    /// Accessible by HR roles or the employee themselves (ESS).
    /// </summary>
    [HttpGet("{id:guid}/documents")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<EmployeeDocumentDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetEmployeeDocuments(Guid id, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetEmployeeDocumentsQuery(id), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<EmployeeDocumentDto>>.SuccessResult(result, "Lấy danh sách tài liệu thành công."));
    }

    /// <summary>
    /// Adds a new digital document to an employee's profile.
    /// </summary>
    [HttpPost("{id:guid}/documents")]
    [RequirePermission(PermissionNames.Employees.DocumentManage)]
    [ProducesResponseType(typeof(ApiResponse<EmployeeDocumentDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateEmployeeDocument(
        Guid id,
        [FromBody] CreateEmployeeDocumentDto dto,
        CancellationToken cancellationToken)
    {
        var command = new CreateEmployeeDocumentCommand(
            id,
            dto.DocumentType,
            dto.DocumentTitle,
            dto.FileName,
            dto.FileUrl,
            dto.FileSizeBytes,
            dto.IssueDate,
            dto.ExpiryDate,
            dto.IsVerified,
            dto.Notes);

        var result = await _sender.Send(command, cancellationToken);
        var response = ApiResponse<EmployeeDocumentDto>.SuccessResult(result, "Thêm tài liệu vào hồ sơ thành công.");

        return CreatedAtAction(nameof(GetEmployeeDocuments), new { id }, response);
    }

    /// <summary>
    /// Soft-deletes a digital document by ID.
    /// </summary>
    [HttpDelete("{id:guid}/documents/{docId:guid}")]
    [RequirePermission(PermissionNames.Employees.DocumentManage)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteEmployeeDocument(
        Guid id,
        Guid docId,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new DeleteEmployeeDocumentCommand(id, docId), cancellationToken);
        return Ok(ApiResponse<bool>.SuccessResult(result, "Xóa tài liệu thành công."));
    }

    /// <summary>
    /// Retrieves employment contracts history for an employee.
    /// Accessible by HR roles or the employee themselves (ESS).
    /// </summary>
    [HttpGet("{id:guid}/contracts")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<EmployeeContractDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetEmployeeContracts(Guid id, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetEmployeeContractsQuery(id), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<EmployeeContractDto>>.SuccessResult(result, "Lấy lịch sử hợp đồng thành công."));
    }

    /// <summary>
    /// Signs and executes a new employment contract for an employee.
    /// Automatically marks previous Active contract as Expired and synchronizes employee base salary.
    /// </summary>
    [HttpPost("{id:guid}/contracts")]
    [RequirePermission(PermissionNames.Employees.DocumentManage)]
    [ProducesResponseType(typeof(ApiResponse<EmployeeContractDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateEmployeeContract(
        Guid id,
        [FromBody] CreateEmployeeContractDto dto,
        CancellationToken cancellationToken)
    {
        var command = new CreateEmployeeContractCommand(
            id,
            dto.ContractType,
            dto.StartDate,
            dto.EndDate,
            dto.SignedDate,
            dto.ContractSalary,
            dto.Allowances,
            dto.FileUrl,
            dto.Notes);

        var result = await _sender.Send(command, cancellationToken);
        var response = ApiResponse<EmployeeContractDto>.SuccessResult(result, "Ký hợp đồng lao động mới thành công.");

        return CreatedAtAction(nameof(GetEmployeeContracts), new { id }, response);
    }

    /// <summary>
    /// Retrieves all official legal/organizational decisions issued for an employee.
    /// Accessible by HR roles or the employee themselves (ESS).
    /// </summary>
    [HttpGet("{id:guid}/decisions")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<EmployeeDecisionDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetEmployeeDecisions(Guid id, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetEmployeeDecisionsQuery(id), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<EmployeeDecisionDto>>.SuccessResult(result, "Lấy danh sách quyết định nhân sự thành công."));
    }

    /// <summary>
    /// Issues a new official decision for an employee.
    /// Automatically updates employee Department, Position, and BaseSalary on Transfer or Promotion.
    /// </summary>
    [HttpPost("{id:guid}/decisions")]
    [RequirePermission(PermissionNames.Decisions.Manage)]
    [ProducesResponseType(typeof(ApiResponse<EmployeeDecisionDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateEmployeeDecision(
        Guid id,
        [FromBody] CreateDecisionDto dto,
        CancellationToken cancellationToken)
    {
        var effectiveDate = dto.EffectiveDate != default ? dto.EffectiveDate : DateOnly.FromDateTime(DateTime.UtcNow);
        var signDate = dto.SignDate.HasValue && dto.SignDate.Value != default ? dto.SignDate.Value : effectiveDate;

        var command = new CreateDecisionCommand(
            id,
            dto.DecisionType,
            dto.Title,
            effectiveDate,
            signDate,
            dto.SignerName,
            dto.SignerPosition,
            dto.Amount,
            dto.NewDepartmentId,
            dto.NewPositionId,
            dto.NewSalary,
            dto.Reason,
            dto.AttachmentUrl,
            dto.DecisionNumber);

        var result = await _sender.Send(command, cancellationToken);
        var response = ApiResponse<EmployeeDecisionDto>.SuccessResult(result, "Ban hành quyết định nhân sự thành công.");

        return CreatedAtAction(nameof(GetEmployeeDecisions), new { id }, response);
    }
}
