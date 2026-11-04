using EmployeeManagement.Application.Common.Exceptions;
using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Domain.Employees.Consts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Employees.Commands.DeleteDecision;

/// <summary>
/// Command handler for cancelling/soft-deleting an employee decision.
/// Sets Status to Cancelled and IsDeleted to true.
/// </summary>
public class DeleteDecisionCommandHandler : IRequestHandler<DeleteDecisionCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public DeleteDecisionCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(
        DeleteDecisionCommand request,
        CancellationToken cancellationToken)
    {
        var decision = await _context.EmployeeDecisions
            .FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken);

        if (decision is null)
        {
            throw new NotFoundException("Quyết định nhân sự", request.Id);
        }

        decision.Status = DecisionConsts.DecisionStatuses.Cancelled;
        decision.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
