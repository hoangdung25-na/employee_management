using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Employees.DTOs;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Domain.Codes.Consts;
using EmployeeManagement.Domain.Codes.Entities;
using EmployeeManagement.Domain.Employees.Consts;
using EmployeeManagement.Domain.Employees.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Employees.Commands.CreateEmployeeContract;

/// <summary>
/// Command handler for executing a new labor contract for an employee:
/// 1. Concurrency-safe generation of sequential ContractNumber (HDLD-YYYY-xxx).
/// 2. Sets previous Active contract(s) to Expired.
/// 3. Updates Employee.BaseSalary to match the new ContractSalary.
/// </summary>
public class CreateEmployeeContractCommandHandler : IRequestHandler<CreateEmployeeContractCommand, EmployeeContractDto>
{
    private const int MaxConcurrencyRetries = 3;
    private readonly IApplicationDbContext _context;

    public CreateEmployeeContractCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<EmployeeContractDto> Handle(
        CreateEmployeeContractCommand request,
        CancellationToken cancellationToken)
    {
        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == request.EmployeeId, cancellationToken);

        if (employee is null)
        {
            throw new NotFoundException("Nhân viên", request.EmployeeId);
        }

        var year = DateTime.UtcNow.Year;
        var prefix = $"HDLD-{year}-";
        var sequenceKey = $"{CodeConsts.ContractCodeType}-{year}";

        for (var attempt = 1; attempt <= MaxConcurrencyRetries; attempt++)
        {
            try
            {
                var codeSequence = await _context.CodeSequences
                    .FirstOrDefaultAsync(c => c.Id == sequenceKey, cancellationToken);

                if (codeSequence is null)
                {
                    var existingCount = await _context.EmployeeContracts
                        .IgnoreQueryFilters()
                        .CountAsync(c => c.ContractNumber.StartsWith(prefix), cancellationToken);

                    codeSequence = new CodeSequence(sequenceKey, existingCount);
                    await _context.CodeSequences.AddAsync(codeSequence, cancellationToken);
                }

                string nextContractNumber;
                do
                {
                    nextContractNumber = codeSequence.GenerateNextCode(prefix, 3);
                }
                while (await _context.EmployeeContracts
                    .IgnoreQueryFilters()
                    .AnyAsync(c => c.ContractNumber == nextContractNumber, cancellationToken));

                var strategy = _context.Database.CreateExecutionStrategy();
                EmployeeContract contract = null!;

                await strategy.ExecuteAsync(async () =>
                {
                    await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
                    var nowUtc = DateTime.UtcNow;

                    // 1. Expire existing Active contract(s) for this employee
                    var activeContracts = await _context.EmployeeContracts
                        .Where(c => c.EmployeeId == request.EmployeeId && c.Status == ContractConsts.ContractStatuses.Active)
                        .ToListAsync(cancellationToken);

                    foreach (var activeContract in activeContracts)
                    {
                        activeContract.Status = ContractConsts.ContractStatuses.Expired;
                        activeContract.UpdatedAt = nowUtc;
                    }

                    // 2. Synchronize employee BaseSalary with new contract
                    employee.BaseSalary = request.ContractSalary;
                    employee.UpdatedAt = nowUtc;

                    // 3. Create new contract
                    contract = new EmployeeContract
                    {
                        Id = Guid.NewGuid(),
                        ContractNumber = nextContractNumber,
                        EmployeeId = request.EmployeeId,
                        ContractType = request.ContractType.Trim(),
                        StartDate = request.StartDate,
                        EndDate = request.EndDate,
                        SignedDate = request.SignedDate ?? DateOnly.FromDateTime(DateTime.UtcNow),
                        ContractSalary = request.ContractSalary,
                        Allowances = request.Allowances,
                        FileUrl = string.IsNullOrWhiteSpace(request.FileUrl) ? null : request.FileUrl.Trim(),
                        Status = ContractConsts.ContractStatuses.Active,
                        Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
                        IsDeleted = false,
                        CreatedAt = nowUtc
                    };

                    await _context.EmployeeContracts.AddAsync(contract, cancellationToken);
                    await _context.SaveChangesAsync(cancellationToken);
                    await transaction.CommitAsync(cancellationToken);
                });

                return new EmployeeContractDto(
                    contract.Id,
                    contract.ContractNumber,
                    contract.EmployeeId,
                    contract.ContractType,
                    contract.StartDate,
                    contract.EndDate,
                    contract.SignedDate,
                    contract.ContractSalary,
                    contract.Allowances,
                    contract.FileUrl,
                    contract.Status,
                    contract.Notes,
                    contract.CreatedAt);
            }
            catch (DbUpdateConcurrencyException) when (attempt < MaxConcurrencyRetries)
            {
                foreach (var entry in _context.CodeSequences.Local.ToList())
                {
                    _context.CodeSequences.Entry(entry).State = EntityState.Detached;
                }
            }
        }

        throw new ConflictException("Không thể cấp số hợp đồng do xung đột đồng thời. Vui lòng thử lại.");
    }
}
