using EmployeeManagement.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Auth.Commands.Logout;

/// <summary>
/// Handles user logout by revoking their RefreshToken and expiration time in the database.
/// </summary>
public class LogoutCommandHandler : IRequestHandler<LogoutCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAuthCache _authCache;

    public LogoutCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IAuthCache authCache)
    {
        _context = context;
        _currentUserService = currentUserService;
        _authCache = authCache;
    }

    public async Task<bool> Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        if (!_currentUserService.UserId.HasValue)
        {
            return true;
        }

        var userId = _currentUserService.UserId.Value;
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user != null)
        {
            user.RefreshToken = null;
            user.RefreshTokenExpiryTime = null;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
        }

        // Immediately evict cached permissions upon logout
        _authCache.InvalidateUser(userId);

        return true;
    }
}

