namespace EmployeeManagement.Application.Interfaces;

/// <summary>
/// Represents the cached authorization snapshot (Active state, Roles, and atomic Permissions) of a user.
/// Stored in memory to provide microsecond-speed O(1) authorization lookups without querying SQL Server on every request.
/// </summary>
public sealed record UserAuthCacheEntry(
    Guid UserId,
    bool IsActive,
    HashSet<string> Roles,
    HashSet<string> Permissions);

/// <summary>
/// Abstraction for caching and invalidating user roles and atomic permissions in memory or distributed cache.
/// Synchronizes cache lifetime with the user's active session and supports instant invalidation on role/permission revocation.
/// </summary>
public interface IAuthCache
{
    /// <summary>
    /// Gets the cached authorization entry for a user, or loads it from the database on cache miss.
    /// </summary>
    Task<UserAuthCacheEntry?> GetOrSetUserAuthAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Synchronous lookup used by synchronous property/method callers (such as ICurrentUserService).
    ///</summary>
    UserAuthCacheEntry? GetOrSetUserAuth(Guid userId);

    /// <summary>
    /// Explicitly populates or refreshes the user's authorization entry in the cache (e.g., upon Login or Token Refresh).
    /// </summary>
    void SetUserAuth(Guid userId, bool isActive, IEnumerable<string> roles, IEnumerable<string> permissions, TimeSpan? expiration = null);

    /// <summary>
    /// Immediately invalidates the cached permissions and roles for a specific user
    /// (e.g., when Admin updates/revokes permissions, terminates an employee, or user logs out).
    /// </summary>
    void InvalidateUser(Guid userId);

    /// <summary>
    /// Invalidates the cached permissions for multiple users at once (e.g., when a Role's permissions are updated).
    /// </summary>
    void InvalidateUsers(IEnumerable<Guid> userIds);
}

