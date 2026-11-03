using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Employees.DTOs;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Domain.Codes.Consts;
using EmployeeManagement.Domain.Codes.Entities;
using EmployeeManagement.Domain.Employees.Consts;
using EmployeeManagement.Domain.Employees.Entities;
using EmployeeManagement.Domain.Employees.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Employees.Commands.CreateEmployee;

/// <summary>
/// Handles creating a new Employee record with concurrency-safe EmployeeCode generation (EMP-xxxxx) via CodeSequences.
/// </summary>
public class CreateEmployeeCommandHandler : IRequestHandler<CreateEmployeeCommand, EmployeeDetailDto>
{
    private const int MaxConcurrencyRetries = 3;
    private readonly IApplicationDbContext _context;

    public CreateEmployeeCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<EmployeeDetailDto> Handle(
        CreateEmployeeCommand request,
        CancellationToken cancellationToken)
    {
        var workEmail = request.WorkEmail.Trim().ToLowerInvariant();
        var citizenId = request.CitizenId.Trim();

        // 1. Check duplicate WorkEmail (AnyAsync per API_PERFORMANCE_RULES.md Rule #4)
        var emailExists = await _context.Employees
            .AnyAsync(e => e.WorkEmail == workEmail, cancellationToken);
        if (emailExists)
        {
            throw new ConflictException($"Email công ty '{workEmail}' đã tồn tại trong hệ thống.");
        }

        // 2. Check duplicate CitizenId
        var citizenIdExists = await _context.Employees
            .AnyAsync(e => e.CitizenId == citizenId, cancellationToken);
        if (citizenIdExists)
        {
            throw new ConflictException($"Số CCCD '{citizenId}' đã tồn tại trong hệ thống.");
        }

        // 3. Validate DepartmentId
        var departmentName = await _context.Departments
            .AsNoTracking()
            .Where(d => d.Id == request.DepartmentId && d.IsActive)
            .Select(d => d.DepartmentName)
            .FirstOrDefaultAsync(cancellationToken);

        if (departmentName is null)
        {
            throw new NotFoundException("Phòng ban", request.DepartmentId);
        }

        // 4. Validate PositionId
        var positionName = await _context.Positions
            .AsNoTracking()
            .Where(p => p.Id == request.PositionId && p.IsActive)
            .Select(p => p.PositionName)
            .FirstOrDefaultAsync(cancellationToken);

        if (positionName is null)
        {
            throw new NotFoundException("Chức danh", request.PositionId);
        }

        // 5. Validate DirectManagerId if provided
        string? directManagerName = null;
        if (request.DirectManagerId.HasValue)
        {
            directManagerName = await _context.Employees
                .AsNoTracking()
                .Where(e => e.Id == request.DirectManagerId.Value && e.Status != EmployeeStatus.Terminated)
                .Select(e => e.FullName)
                .FirstOrDefaultAsync(cancellationToken);

            if (directManagerName is null)
            {
                throw new BadRequestException("Quản lý trực tiếp được chọn không tồn tại hoặc đã thôi việc.");
            }
        }

        var status = Enum.Parse<EmployeeStatus>(request.Status, ignoreCase: true);

        // 6. Generate sequential EmployeeCode (EMP-xxxxx) with RowVersion optimistic concurrency retry (Rule #8)
        for (var attempt = 1; attempt <= MaxConcurrencyRetries; attempt++)
        {
            try
            {
                var codeSequence = await _context.CodeSequences
                    .FirstOrDefaultAsync(c => c.Id == CodeConsts.EmployeeCodeType, cancellationToken);

                if (codeSequence is null)
                {
                    var currentCount = await _context.Employees
                        .IgnoreQueryFilters()
                        .CountAsync(cancellationToken);

                    codeSequence = new CodeSequence(CodeConsts.EmployeeCodeType, currentCount);
                    await _context.CodeSequences.AddAsync(codeSequence, cancellationToken);
                }

                string nextEmployeeCode;
                do
                {
                    nextEmployeeCode = codeSequence.GenerateNextCode(EmployeeConsts.CodePrefix, 5);
                }
                while (await _context.Employees
                    .IgnoreQueryFilters()
                    .AnyAsync(e => e.EmployeeCode == nextEmployeeCode, cancellationToken));

                var employee = new Employee
                {
                    Id = Guid.NewGuid(),
                    EmployeeCode = nextEmployeeCode,
                    FullName = request.FullName.Trim(),
                    DateOfBirth = request.DateOfBirth,
                    Gender = request.Gender.Trim(),
                    CitizenId = citizenId,
                    PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim(),
                    WorkEmail = workEmail,
                    PersonalEmail = string.IsNullOrWhiteSpace(request.PersonalEmail) ? null : request.PersonalEmail.Trim(),
                    Address = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address.Trim(),
                    HireDate = request.HireDate,
                    ProbationEndDate = request.ProbationEndDate,
                    DepartmentId = request.DepartmentId,
                    PositionId = request.PositionId,
                    DirectManagerId = request.DirectManagerId,
                    BaseSalary = request.BaseSalary,
                    TaxCode = string.IsNullOrWhiteSpace(request.TaxCode) ? null : request.TaxCode.Trim(),
                    SocialInsuranceNumber = string.IsNullOrWhiteSpace(request.SocialInsuranceNumber) ? null : request.SocialInsuranceNumber.Trim(),
                    BankAccountNumber = string.IsNullOrWhiteSpace(request.BankAccountNumber) ? null : request.BankAccountNumber.Trim(),
                    BankName = string.IsNullOrWhiteSpace(request.BankName) ? null : request.BankName.Trim(),
                    AvatarUrl = string.IsNullOrWhiteSpace(request.AvatarUrl) ? null : request.AvatarUrl.Trim(),
                    Status = status,
                    IsDeleted = false,
                    CreatedAt = DateTime.UtcNow
                };

                await _context.Employees.AddAsync(employee, cancellationToken);

                // Auto-generate Onboarding Checklist from active OnboardingTemplates (Phase 5)
                var onboardingTemplates = await _context.OnboardingTemplates
                    .AsNoTracking()
                    .Where(t => t.ProcessType == OnboardingConsts.ProcessTypes.Onboarding && t.IsActive)
                    .OrderBy(t => t.SortOrder)
                    .ToListAsync(cancellationToken);

                foreach (var template in onboardingTemplates)
                {
                    Guid? assignedTo = null;
                    if (template.AssignedRole == OnboardingConsts.AssignedRoles.Employee)
                    {
                        assignedTo = employee.Id;
                    }
                    else if (template.AssignedRole == OnboardingConsts.AssignedRoles.Manager)
                    {
                        assignedTo = employee.DirectManagerId;
                    }

                    var onboardingTask = new EmployeeOnboardingTask
                    {
                        Id = Guid.NewGuid(),
                        EmployeeId = employee.Id,
                        ProcessType = OnboardingConsts.ProcessTypes.Onboarding,
                        TaskName = template.TaskName,
                        AssignedRole = template.AssignedRole,
                        AssignedToEmployeeId = assignedTo,
                        DueDate = employee.HireDate.AddDays(template.DefaultDueDays),
                        Status = OnboardingConsts.TaskStatuses.Pending,
                        Notes = template.Description,
                        IsDeleted = false,
                        CreatedAt = DateTime.UtcNow
                    };

                    await _context.EmployeeOnboardingTasks.AddAsync(onboardingTask, cancellationToken);
                }

                await _context.SaveChangesAsync(cancellationToken);

                return new EmployeeDetailDto(
                    employee.Id,
                    employee.EmployeeCode,
                    employee.FullName,
                    employee.DateOfBirth,
                    employee.Gender,
                    employee.CitizenId,
                    employee.PhoneNumber,
                    employee.WorkEmail,
                    employee.PersonalEmail,
                    employee.Address,
                    employee.HireDate,
                    employee.ProbationEndDate,
                    employee.DepartmentId,
                    departmentName,
                    employee.PositionId,
                    positionName,
                    employee.DirectManagerId,
                    directManagerName,
                    employee.BaseSalary,
                    employee.TaxCode,
                    employee.SocialInsuranceNumber,
                    employee.BankAccountNumber,
                    employee.BankName,
                    employee.AvatarUrl,
                    employee.Status.ToString(),
                    employee.TerminationDate,
                    employee.TerminationReason,
                    employee.CreatedAt,
                    employee.UpdatedAt);
            }
            catch (DbUpdateConcurrencyException) when (attempt < MaxConcurrencyRetries)
            {
                // Detach tracked entries and retry code allocation
                foreach (var entry in _context.CodeSequences.Local.ToList())
                {
                    _context.CodeSequences.Entry(entry).State = EntityState.Detached;
                }
            }
        }

        throw new ConflictException("Không thể cấp mã nhân viên do xung đột đồng thời. Vui lòng thử lại.");
    }
}

