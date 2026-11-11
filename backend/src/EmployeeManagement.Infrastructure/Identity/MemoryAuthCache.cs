using EmployeeManagement.Application.Interfaces;
using EmployeeManagement.Domain.Users.Consts;
using EmployeeManagement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace EmployeeManagement.Infrastructure.Identity;

/// <summary>
/// In-memory implementation of <see cref="IAuthCache"/> using <see cref="IMemoryCache"/>.
/// Loads a user's roles and atomic permissions into RAM upon login or first request (cache miss),
/// and provides microsecond O(1) lookups with instant cache invalidation when permissions change.
/// </summary>
public sealed class MemoryAuthCache : IAuthCache
{
    private const string CacheKeyPrefix = "auth:user_permissions:";

    private readonly IMemoryCache _memoryCache;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly JwtSettings _jwtSettings;

    public MemoryAuthCache(
        IMemoryCache memoryCache,
        IServiceScopeFactory scopeFactory,
        IOptions<JwtSettings> jwtOptions)
    {
        _memoryCache = memoryCache;
        _scopeFactory = scopeFactory;
        _jwtSettings = jwtOptions.Value;
    }

    private static string GetCacheKey(Guid userId) => $"{CacheKeyPrefix}{userId:N}";

    private TimeSpan GetDefaultSlidingExpiration()
    {
        var minutes = _jwtSettings.AccessTokenExpirationMinutes > 0
            ? _jwtSettings.AccessTokenExpirationMinutes
            : 30;
        return TimeSpan.FromMinutes(minutes);
    }

    private TimeSpan GetDefaultAbsoluteExpiration()
    {
        var hours = _jwtSettings.RefreshTokenExpirationHours > 0
            ? _jwtSettings.RefreshTokenExpirationHours
            : 3;
        return TimeSpan.FromHours(hours);
    }

    public async Task<UserAuthCacheEntry?> GetOrSetUserAuthAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        if (userId == Guid.Empty)
        {
            return null;
        }

        var cacheKey = GetCacheKey(userId);
        if (_memoryCache.TryGetValue(cacheKey, out UserAuthCacheEntry? cachedEntry) && cachedEntry is not null)
        {
            return cachedEntry;
        }

        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var userStatus = await dbContext.Users
            .AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new
            {
                u.Id,
                u.Username,
                u.IsActive,
                u.IsLocked,
                u.LockedUntil,
                u.CustomPermissions
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (userStatus is null)
        {
            return null;
        }

        var nowUtc = DateTime.UtcNow;
        var isEffectivelyActive = userStatus.IsActive &&
                                  (!userStatus.IsLocked || !userStatus.LockedUntil.HasValue || userStatus.LockedUntil.Value <= nowUtc);

        if (!isEffectivelyActive)
        {
            var inactiveEntry = new UserAuthCacheEntry(
                userId,
                IsActive: false,
                new HashSet<string>(StringComparer.OrdinalIgnoreCase),
                new HashSet<string>(StringComparer.OrdinalIgnoreCase));

            StoreEntry(cacheKey, inactiveEntry);
            return inactiveEntry;
        }

        var roleData = await dbContext.UserRoles
            .AsNoTracking()
            .Where(ur => ur.UserId == userId && ur.Role.IsActive)
            .Select(ur => new
            {
                ur.Role.RoleCode,
                Permissions = ur.Role.RolePermissions.Select(rp => rp.Permission.PermissionCode)
            })
            .ToListAsync(cancellationToken);

        var roles = new HashSet<string>(
            roleData.Select(r => r.RoleCode),
            StringComparer.OrdinalIgnoreCase);

        var resolvedPermissions = PermissionNames.ResolveEffectivePermissions(
            userStatus.CustomPermissions,
            roles,
            roleData.SelectMany(r => r.Permissions),
            userStatus.Username);

        var permissions = new HashSet<string>(
            resolvedPermissions,
            StringComparer.OrdinalIgnoreCase);

        var entry = new UserAuthCacheEntry(userId, IsActive: true, roles, permissions);
        StoreEntry(cacheKey, entry);

        return entry;
    }

    public UserAuthCacheEntry? GetOrSetUserAuth(Guid userId)
    {
        if (userId == Guid.Empty)
        {
            return null;
        }

        var cacheKey = GetCacheKey(userId);
        if (_memoryCache.TryGetValue(cacheKey, out UserAuthCacheEntry? cachedEntry) && cachedEntry is not null)
        {
            return cachedEntry;
        }

        return GetOrSetUserAuthAsync(userId).GetAwaiter().GetResult();
    }

    public void SetUserAuth(
        Guid userId,
        bool isActive,
        IEnumerable<string> roles,
        IEnumerable<string> permissions,
        TimeSpan? expiration = null)
    {
        if (userId == Guid.Empty)
        {
            return;
        }

        var cacheKey = GetCacheKey(userId);
        var entry = new UserAuthCacheEntry(
            userId,
            isActive,
            new HashSet<string>(roles, StringComparer.OrdinalIgnoreCase),
            new HashSet<string>(permissions, StringComparer.OrdinalIgnoreCase));

        StoreEntry(cacheKey, entry, expiration);
    }

    public void InvalidateUser(Guid userId)
    {
        if (userId == Guid.Empty)
        {
            return;
        }

        _memoryCache.Remove(GetCacheKey(userId));
    }

    public void InvalidateUsers(IEnumerable<Guid> userIds)
    {
        foreach (var userId in userIds)
        {
            InvalidateUser(userId);
        }
    }

    private void StoreEntry(string cacheKey, UserAuthCacheEntry entry, TimeSpan? customExpiration = null)
    {
        var options = new MemoryCacheEntryOptions
        {
            SlidingExpiration = customExpiration ?? GetDefaultSlidingExpiration(),
            AbsoluteExpirationRelativeToNow = customExpiration ?? GetDefaultAbsoluteExpiration(),
            Priority = CacheItemPriority.High
        };

        _memoryCache.Set(cacheKey, entry, options);
    }
}

