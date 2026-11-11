namespace EmployeeManagement.Application.Interfaces;

/// <summary>
/// High-performance permission checker that evaluates whether a user has been granted specific atomic permissions
/// by querying IAuthCache in microseconds instead of hitting the database on every API call.
/// </summary>
public interface IPermissionChecker
{
    /// <summary>
    /// Checks if the currently authenticated user has the specified atomic permission.
    /// </summary>
    Task<bool> IsGrantedAsync(string permissionName, CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if a specific user ID has the specified atomic permission.
    /// </summary>
    Task<bool> IsGrantedAsync(Guid userId, string permissionName, CancellationToken cancellationToken = default);

    /// <summary>
    /// Synchronous permission check for a specific user ID via IAuthCache.
    /// </summary>
    bool IsGranted(Guid userId, string permissionName);
}

