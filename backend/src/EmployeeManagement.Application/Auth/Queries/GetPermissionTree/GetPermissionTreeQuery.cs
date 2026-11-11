using EmployeeManagement.Application.Auth.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Auth.Queries.GetPermissionTree;

/// <summary>
/// Query to retrieve the complete hierarchical permission tree of the system.
/// Used to populate dynamic Role permission assignment matrices in Back-Office UI.
/// </summary>
public record GetPermissionTreeQuery : IRequest<IReadOnlyList<PermissionModuleGroupDto>>;

