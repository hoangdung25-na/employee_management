using System.Reflection;
using EmployeeManagement.Application.Common.Behaviors;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace EmployeeManagement.Application;

/// <summary>
/// Dependency Injection registration for the Application Layer.
/// Registers MediatR handlers, pipeline behaviors, and FluentValidation validators.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();

        // Register FluentValidation validators automatically from this assembly
        services.AddValidatorsFromAssembly(assembly);

        // Register MediatR Queries/Commands and attach pipeline behaviors
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(assembly);
            cfg.AddOpenBehavior(typeof(LoggingBehavior<,>));
            cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
        });

        return services;
    }
}

