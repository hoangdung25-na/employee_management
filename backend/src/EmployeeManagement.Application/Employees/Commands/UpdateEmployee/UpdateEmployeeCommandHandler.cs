using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Employees.DTOs;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Domain.Employees.Consts;
using EmployeeManagement.Domain.Employees.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Employees.Commands.UpdateEmployee;

/// <summary>
/// Handles updating an Employee's profile while preserving immutable EmployeeCode and WorkEmail.
/// </summary>
public class UpdateEmployeeCommandHandler : IRequestHandler<UpdateEmployeeCommand, EmployeeDetailDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IAuthCache _authCache;

    public UpdateEmployeeCommandHandler(
        IApplicationDbContext context,
        IAuthCache authCache)
    {
        _context = context;
        _authCache = authCache;
    }

    public async Task<EmployeeDetailDto> Handle(
        UpdateEmployeeCommand request,
        CancellationToken cancellationToken)
    {
        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == request.Id, cancellationToken);

        if (employee is null)
        {
            throw new NotFoundException("Nhân viên", request.Id);
        }

        var effectiveHireDate = request.HireDate ?? employee.HireDate;

        // Golden Rule #8: Exact Age Calculation (DateOfBirth.AddYears(18) <= HireDate)
        if (request.DateOfBirth.AddYears(EmployeeConsts.MinimumWorkingAge) > effectiveHireDate)
        {
            throw new BadRequestException("Nhân viên phải đủ 18 tuổi tính đến ngày bắt đầu làm việc (DateOfBirth + 18 năm <= HireDate).");
        }

        // Check duplicate CitizenId if modified
        if (!string.IsNullOrWhiteSpace(request.CitizenId))
        {
            var citizenId = request.CitizenId.Trim();
            if (!string.Equals(employee.CitizenId, citizenId, StringComparison.Ordinal))
            {
                var citizenIdExists = await _context.Employees
                    .AnyAsync(e => e.CitizenId == citizenId && e.Id != request.Id, cancellationToken);

                if (citizenIdExists)
                {
                    throw new ConflictException($"Số CCCD '{citizenId}' đã tồn tại trên hồ sơ nhân sự khác.");
                }

                employee.CitizenId = citizenId;
            }
        }

        // Validate DepartmentId
        var departmentName = await _context.Departments
            .AsNoTracking()
            .Where(d => d.Id == request.DepartmentId && d.IsActive)
            .Select(d => d.DepartmentName)
            .FirstOrDefaultAsync(cancellationToken);

        if (departmentName is null)
        {
            throw new NotFoundException("Phòng ban", request.DepartmentId);
        }

        // Validate PositionId
        var positionName = await _context.Positions
            .AsNoTracking()
            .Where(p => p.Id == request.PositionId && p.IsActive)
            .Select(p => p.PositionName)
            .FirstOrDefaultAsync(cancellationToken);

        if (positionName is null)
        {
            throw new NotFoundException("Chức danh", request.PositionId);
        }

        // Validate DirectManagerId & Cấp bậc quản lý
        string? directManagerName = null;
        var targetPosition = await _context.Positions.FirstOrDefaultAsync(p => p.Id == request.PositionId, cancellationToken);
        var isExecutive = targetPosition != null && targetPosition.JobLevel == 1;

        // Kiểm tra xem nhân sự này có phải Trưởng phòng của phòng ban hay không
        var isDeptHead = await _context.Departments
            .AnyAsync(d => d.Id == request.DepartmentId && d.ManagerId == employee.Id, cancellationToken);

        if (isExecutive)
        {
            // Ban Giám đốc không có sếp trực tiếp (Báo cáo HĐQT)
            employee.DirectManagerId = null;
            directManagerName = null;
        }
        else if (isDeptHead)
        {
            // Trưởng phòng mặc định báo cáo trực tiếp cho Giám đốc điều hành cấp cao nhất (CEO / JobLevel == 1)
            var highestDirector = await _context.Employees
                .Include(e => e.Position)
                .Where(e => !e.IsDeleted && e.Position.JobLevel == 1)
                .OrderBy(e => e.HireDate)
                .FirstOrDefaultAsync(cancellationToken);

            if (highestDirector != null && employee.Id != highestDirector.Id)
            {
                employee.DirectManagerId = highestDirector.Id;
                directManagerName = highestDirector.FullName;
            }
            else
            {
                employee.DirectManagerId = null;
                directManagerName = null;
            }
        }
        else if (request.DirectManagerId.HasValue)
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
            employee.DirectManagerId = request.DirectManagerId;
        }
        else
        {
            employee.DirectManagerId = null;
        }

        employee.FullName = request.FullName.Trim();
        employee.DateOfBirth = request.DateOfBirth;
        employee.Gender = request.Gender.Trim();
        employee.PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim();
        employee.PersonalEmail = string.IsNullOrWhiteSpace(request.PersonalEmail) ? null : request.PersonalEmail.Trim();
        employee.Address = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address.Trim();
        employee.HireDate = effectiveHireDate;
        employee.ProbationEndDate = request.ProbationEndDate ?? employee.ProbationEndDate;
        employee.DepartmentId = request.DepartmentId;
        employee.PositionId = request.PositionId;
        // employee.DirectManagerId is already assigned according to hierarchy rules above
        employee.BaseSalary = request.BaseSalary;
        employee.TaxCode = request.TaxCode is not null ? (string.IsNullOrWhiteSpace(request.TaxCode) ? null : request.TaxCode.Trim()) : employee.TaxCode;
        employee.SocialInsuranceNumber = request.SocialInsuranceNumber is not null ? (string.IsNullOrWhiteSpace(request.SocialInsuranceNumber) ? null : request.SocialInsuranceNumber.Trim()) : employee.SocialInsuranceNumber;
        employee.BankAccountNumber = request.BankAccountNumber is not null ? (string.IsNullOrWhiteSpace(request.BankAccountNumber) ? null : request.BankAccountNumber.Trim()) : employee.BankAccountNumber;
        employee.BankName = request.BankName is not null ? (string.IsNullOrWhiteSpace(request.BankName) ? null : request.BankName.Trim()) : employee.BankName;
        employee.AvatarUrl = string.IsNullOrWhiteSpace(request.AvatarUrl) ? null : request.AvatarUrl.Trim();
        var newStatus = Enum.Parse<EmployeeStatus>(request.Status, ignoreCase: true);
        var previousStatus = employee.Status;
        employee.Status = newStatus;
        employee.UpdatedAt = DateTime.UtcNow;

        // Synchronize linked User account status when Employee status changes
        var linkedUser = await _context.Users
            .FirstOrDefaultAsync(u => u.EmployeeId == employee.Id, cancellationToken);

        if (linkedUser is not null)
        {
            if (newStatus == EmployeeStatus.Suspended || newStatus == EmployeeStatus.Terminated)
            {
                linkedUser.IsActive = false;
                linkedUser.RefreshToken = null;
                linkedUser.RefreshTokenExpiryTime = null;
                linkedUser.UpdatedAt = DateTime.UtcNow;
            }
            else if ((previousStatus == EmployeeStatus.Suspended || !linkedUser.IsActive) &&
                     (newStatus == EmployeeStatus.Active || newStatus == EmployeeStatus.Probation))
            {
                linkedUser.IsActive = true;
                linkedUser.IsLocked = false;
                linkedUser.LockedUntil = null;
                linkedUser.FailedLoginAttempts = 0;
                linkedUser.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        if (linkedUser is not null)
        {
            _authCache.InvalidateUser(linkedUser.Id);
        }

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
            employee.UpdatedAt,
            isDeptHead);
    }
}

