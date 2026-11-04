using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Employees.DTOs;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Domain.Codes.Consts;
using EmployeeManagement.Domain.Codes.Entities;
using EmployeeManagement.Domain.Employees.Consts;
using EmployeeManagement.Domain.Employees.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Employees.Commands.CreateDecision;

/// <summary>
/// Command handler for issuing a new legal or organizational decision:
/// 1. Concurrency-safe generation of sequential DecisionNumber (QD-YYYY-xxx).
/// 2. Records previous state (OldDepartment, OldPosition, OldSalary).
/// 3. Automatically updates employee Department, Position, and BaseSalary on Transfer or Promotion.
/// </summary>
public class CreateDecisionCommandHandler : IRequestHandler<CreateDecisionCommand, EmployeeDecisionDto>
{
    private const int MaxConcurrencyRetries = 3;
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CreateDecisionCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<EmployeeDecisionDto> Handle(
        CreateDecisionCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Verify employee exists and load current department & position
        var employee = await _context.Employees
            .Include(e => e.Department)
            .Include(e => e.Position)
            .FirstOrDefaultAsync(e => e.Id == request.EmployeeId, cancellationToken);

        if (employee is null)
        {
            throw new NotFoundException("Nhân viên", request.EmployeeId);
        }

        // 2. Validate NewDepartmentId and NewPositionId if specified
        string? newDepartmentName = null;
        if (request.NewDepartmentId.HasValue)
        {
            var dept = await _context.Departments
                .AsNoTracking()
                .FirstOrDefaultAsync(d => d.Id == request.NewDepartmentId.Value, cancellationToken);

            if (dept is null)
            {
                throw new NotFoundException("Phòng ban mới", request.NewDepartmentId.Value);
            }

            newDepartmentName = dept.DepartmentName;
        }

        string? newPositionName = null;
        if (request.NewPositionId.HasValue)
        {
            var pos = await _context.Positions
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == request.NewPositionId.Value, cancellationToken);

            if (pos is null)
            {
                throw new NotFoundException("Chức vụ mới", request.NewPositionId.Value);
            }

            newPositionName = pos.PositionName;
        }

        // 3. Normalize DecisionType
        var normalizedType = DecisionConsts.DecisionTypes.All
            .FirstOrDefault(t => string.Equals(t, request.DecisionType, StringComparison.OrdinalIgnoreCase))
            ?? DecisionConsts.DecisionTypes.Reward;

        var year = DateTime.UtcNow.Year;
        var prefix = $"QD-{year}-";
        var sequenceKey = $"{CodeConsts.DecisionCodeType}-{year}";

        for (var attempt = 1; attempt <= MaxConcurrencyRetries; attempt++)
        {
            try
            {
                string finalDecisionNumber;

                if (!string.IsNullOrWhiteSpace(request.DecisionNumber))
                {
                    var cleanNumber = request.DecisionNumber.Trim();
                    var isDuplicate = await _context.EmployeeDecisions
                        .IgnoreQueryFilters()
                        .AnyAsync(d => d.DecisionNumber == cleanNumber, cancellationToken);

                    if (isDuplicate)
                    {
                        throw new BadRequestException($"Số quyết định '{cleanNumber}' đã tồn tại trong hệ thống.");
                    }

                    finalDecisionNumber = cleanNumber;
                }
                else
                {
                    var codeSequence = await _context.CodeSequences
                        .FirstOrDefaultAsync(c => c.Id == sequenceKey, cancellationToken);

                    if (codeSequence is null)
                    {
                        var existingCount = await _context.EmployeeDecisions
                            .IgnoreQueryFilters()
                            .CountAsync(d => d.DecisionNumber.StartsWith(prefix), cancellationToken);

                        codeSequence = new CodeSequence(sequenceKey, existingCount);
                        await _context.CodeSequences.AddAsync(codeSequence, cancellationToken);
                    }

                    do
                    {
                        finalDecisionNumber = codeSequence.GenerateNextCode(prefix, 3);
                    }
                    while (await _context.EmployeeDecisions
                        .IgnoreQueryFilters()
                        .AnyAsync(d => d.DecisionNumber == finalDecisionNumber, cancellationToken));
                }

                var strategy = _context.Database.CreateExecutionStrategy();
                EmployeeDecision decision = null!;

                await strategy.ExecuteAsync(async () =>
                {
                    await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
                    var nowUtc = DateTime.UtcNow;

                    // Capture previous state
                    var oldDeptId = employee.DepartmentId;
                    var oldPosId = employee.PositionId;
                    var oldSalary = employee.BaseSalary;

                    // Apply organizational / financial updates to Employee
                    if (normalizedType == DecisionConsts.DecisionTypes.Transfer)
                    {
                        if (request.NewDepartmentId.HasValue)
                        {
                            employee.DepartmentId = request.NewDepartmentId.Value;
                        }
                        if (request.NewPositionId.HasValue)
                        {
                            employee.PositionId = request.NewPositionId.Value;
                        }
                        if (request.NewSalary.HasValue && request.NewSalary.Value > 0)
                        {
                            employee.BaseSalary = request.NewSalary.Value;
                        }
                        employee.UpdatedAt = nowUtc;
                    }
                    else if (normalizedType == DecisionConsts.DecisionTypes.Promotion)
                    {
                        if (request.NewPositionId.HasValue)
                        {
                            employee.PositionId = request.NewPositionId.Value;
                        }
                        if (request.NewSalary.HasValue && request.NewSalary.Value > 0)
                        {
                            employee.BaseSalary = request.NewSalary.Value;
                        }
                        if (request.NewDepartmentId.HasValue)
                        {
                            employee.DepartmentId = request.NewDepartmentId.Value;
                        }
                        employee.UpdatedAt = nowUtc;
                    }

                    // Create Decision entity
                    decision = new EmployeeDecision
                    {
                        Id = Guid.NewGuid(),
                        DecisionNumber = finalDecisionNumber,
                        EmployeeId = employee.Id,
                        DecisionType = normalizedType,
                        Title = request.Title.Trim(),
                        EffectiveDate = request.EffectiveDate,
                        SignDate = request.SignDate,
                        SignerName = request.SignerName?.Trim(),
                        SignerPosition = request.SignerPosition?.Trim(),
                        Amount = request.Amount,
                        OldDepartmentId = oldDeptId,
                        NewDepartmentId = request.NewDepartmentId,
                        OldPositionId = oldPosId,
                        NewPositionId = request.NewPositionId,
                        OldSalary = oldSalary,
                        NewSalary = request.NewSalary,
                        Reason = request.Reason?.Trim(),
                        AttachmentUrl = request.AttachmentUrl?.Trim(),
                        Status = DecisionConsts.DecisionStatuses.Active,
                        CreatedByUserId = _currentUserService.UserId,
                        CreatedAt = nowUtc
                    };

                    await _context.EmployeeDecisions.AddAsync(decision, cancellationToken);
                    await _context.SaveChangesAsync(cancellationToken);
                    await transaction.CommitAsync(cancellationToken);
                });

                return new EmployeeDecisionDto(
                    decision.Id,
                    decision.DecisionNumber,
                    decision.EmployeeId,
                    employee.FullName,
                    employee.EmployeeCode,
                    decision.DecisionType,
                    decision.Title,
                    decision.EffectiveDate,
                    decision.SignDate,
                    decision.SignerName,
                    decision.SignerPosition,
                    decision.Amount,
                    decision.OldDepartmentId,
                    employee.Department?.DepartmentName,
                    decision.NewDepartmentId,
                    newDepartmentName,
                    decision.OldPositionId,
                    employee.Position?.PositionName,
                    decision.NewPositionId,
                    newPositionName,
                    decision.OldSalary,
                    decision.NewSalary,
                    decision.Reason,
                    decision.AttachmentUrl,
                    decision.Status,
                    decision.CreatedAt);
            }
            catch (DbUpdateException) when (attempt < MaxConcurrencyRetries)
            {
                // Concurrency retry on code collision
                await Task.Delay(50 * attempt, cancellationToken);
            }
        }

        throw new BadRequestException("Không thể cấp mã quyết định tự động do xung đột dữ liệu đồng thời. Vui lòng thử lại.");
    }
}
