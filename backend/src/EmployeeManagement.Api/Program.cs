using EmployeeManagement.Api;
using EmployeeManagement.Api.Middlewares;
using EmployeeManagement.Application;
using EmployeeManagement.Infrastructure;
using Serilog;

// Load environment variables from .env file using DotNetEnv
DotNetEnv.Env.TraversePath().Load();

// Initialize Serilog Bootstrap Logger to capture startup errors
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    Log.Information("Starting Enterprise Employee Management API host...");

    var builder = WebApplication.CreateBuilder(args);

    // 1. Configure Serilog Logging (Console & Daily Rolling Files)
    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext());

    // 2. Register Layer Dependencies (Clean Architecture Modular Registration)
    builder.Services
        .AddApplicationServices()
        .AddInfrastructureServices(builder.Configuration)
        .AddApiServices(builder.Configuration);

    var app = builder.Build();

    // Ensure CustomPermissions column exists on dbo.Users for per-user dynamic feature checkboxes
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<EmployeeManagement.Infrastructure.Data.AppDbContext>();
        await Microsoft.EntityFrameworkCore.RelationalDatabaseFacadeExtensions.ExecuteSqlRawAsync(
            db.Database,
            "IF COL_LENGTH('dbo.Users', 'CustomPermissions') IS NULL ALTER TABLE dbo.Users ADD CustomPermissions VARCHAR(MAX) NULL;");
    }

    // 3. Configure HTTP Request Pipeline & Security Middlewares
    app.UseMiddleware<ExceptionMiddleware>();
    app.UseMiddleware<SecurityHeadersMiddleware>();
    app.UseSerilogRequestLogging();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "HRM API v1");
            c.RoutePrefix = "swagger";
        });
    }

    app.UseCors(EmployeeManagement.Api.DependencyInjection.NextJsCorsPolicyName);
    app.UseRateLimiter();
    app.UseHttpsRedirection();
    app.UseMiddleware<CsrfProtectionMiddleware>();
    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();

    Log.Information("Enterprise Employee Management API started successfully in {Environment} mode.", app.Environment.EnvironmentName);

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly during startup.");
}
finally
{
    Log.CloseAndFlush();
}
