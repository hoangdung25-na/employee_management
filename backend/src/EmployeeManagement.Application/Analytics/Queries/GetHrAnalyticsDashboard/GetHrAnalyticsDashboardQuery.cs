using System.Data;
using System.Data.Common;
using EmployeeManagement.Application.Analytics.DTOs;
using EmployeeManagement.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Analytics.Queries.GetHrAnalyticsDashboard;

public record GetHrAnalyticsDashboardQuery(int? Year = null, int? Month = null) : IRequest<HrAnalyticsDashboardDto>;

public class GetHrAnalyticsDashboardQueryHandler : IRequestHandler<GetHrAnalyticsDashboardQuery, HrAnalyticsDashboardDto>
{
    private readonly IApplicationDbContext _context;

    public GetHrAnalyticsDashboardQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<HrAnalyticsDashboardDto> Handle(GetHrAnalyticsDashboardQuery request, CancellationToken cancellationToken)
    {
        var targetYear = request.Year ?? DateTime.UtcNow.Year;
        var targetMonth = request.Month ?? DateTime.UtcNow.Month;

        var result = new HrAnalyticsDashboardDto();

        var connection = _context.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
        {
            await connection.OpenAsync(cancellationToken);
        }

        using var command = connection.CreateCommand();

        // 1. Query View 1: vw_HrHeadcountAndTurnover
        command.CommandText = "SELECT DepartmentId, DepartmentCode, DepartmentName, ManagerName, ActiveHeadcount, ProbationCount, TerminatedCount, TurnoverRatePercent, TotalActiveBaseSalary, AverageBaseSalary FROM dbo.vw_HrHeadcountAndTurnover ORDER BY TotalActiveBaseSalary DESC;";
        using (var reader = await command.ExecuteReaderAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                var dept = new HeadcountAndTurnoverDto
                {
                    DepartmentId = reader.GetGuid(0),
                    DepartmentCode = reader.GetString(1),
                    DepartmentName = reader.GetString(2),
                    ManagerName = reader.IsDBNull(3) ? null : reader.GetString(3),
                    ActiveHeadcount = reader.GetInt32(4),
                    ProbationCount = reader.GetInt32(5),
                    TerminatedCount = reader.GetInt32(6),
                    TurnoverRatePercent = reader.GetDecimal(7),
                    TotalActiveBaseSalary = reader.GetDecimal(8),
                    AverageBaseSalary = reader.GetDecimal(9)
                };
                result.DepartmentBreakdown.Add(dept);
            }
        }

        result.TotalActiveHeadcount = result.DepartmentBreakdown.Sum(d => d.ActiveHeadcount);
        result.TotalProbationCount = result.DepartmentBreakdown.Sum(d => d.ProbationCount);
        result.TotalTerminatedCount = result.DepartmentBreakdown.Sum(d => d.TerminatedCount);
        result.TotalActiveMonthlySalary = result.DepartmentBreakdown.Sum(d => d.TotalActiveBaseSalary);
        result.AverageEmployeeSalary = result.TotalActiveHeadcount > 0
            ? Math.Round(result.TotalActiveMonthlySalary / result.TotalActiveHeadcount, 0)
            : 0;

        var totalEmps = result.TotalActiveHeadcount + result.TotalTerminatedCount;
        result.OverallTurnoverRatePercent = totalEmps > 0
            ? Math.Round((decimal)result.TotalTerminatedCount / totalEmps * 100, 2)
            : 0;

        // 2. Query View 2: vw_AttendanceMonthlySummary
        command.CommandText = $@"
            SELECT 
                ISNULL(SUM(TotalOvertimeHours), 0) AS TotalOT,
                ISNULL(SUM(LateDays), 0) AS TotalLate,
                ISNULL(AVG(CAST(TotalLoggedDays AS FLOAT)), 0) AS AvgDays
            FROM dbo.vw_AttendanceMonthlySummary
            WHERE AttendanceYear = {targetYear} AND AttendanceMonth = {targetMonth};";
        using (var reader = await command.ExecuteReaderAsync(cancellationToken))
        {
            if (await reader.ReadAsync(cancellationToken))
            {
                result.TotalOvertimeHours = reader.GetDecimal(0);
                result.TotalLateIncidents = reader.GetInt32(1);
                result.AverageWorkingDays = (decimal)Math.Round(reader.GetDouble(2), 1);
            }
        }

        // 3. Query View 3: vw_PerformanceAndTrainingOverview
        command.CommandText = @"
            SELECT EmployeeId, EmployeeCode, FullName, DepartmentName, PositionName, LatestCycleCode, LatestKpiScore, LatestRatingRank, ReviewStatus, CompletedTrainingCourses, ActiveTrainingCourses
            FROM dbo.vw_PerformanceAndTrainingOverview
            ORDER BY LatestKpiScore DESC;";
        using (var reader = await command.ExecuteReaderAsync(cancellationToken))
        {
            var performers = new List<PerformanceAndTrainingOverviewDto>();
            while (await reader.ReadAsync(cancellationToken))
            {
                var item = new PerformanceAndTrainingOverviewDto
                {
                    EmployeeId = reader.GetGuid(0),
                    EmployeeCode = reader.GetString(1),
                    FullName = reader.GetString(2),
                    DepartmentName = reader.GetString(3),
                    PositionName = reader.GetString(4),
                    LatestCycleCode = reader.IsDBNull(5) ? null : reader.GetString(5),
                    LatestKpiScore = reader.IsDBNull(6) ? null : reader.GetDecimal(6),
                    LatestRatingRank = reader.IsDBNull(7) ? null : reader.GetString(7),
                    ReviewStatus = reader.IsDBNull(8) ? null : reader.GetString(8),
                    CompletedTrainingCourses = reader.GetInt32(9),
                    ActiveTrainingCourses = reader.GetInt32(10)
                };
                performers.Add(item);
            }

            result.TotalCompletedTrainings = performers.Sum(p => p.CompletedTrainingCourses);
            var evaluated = performers.Where(p => p.LatestKpiScore.HasValue).ToList();
            result.TotalEvaluatedEmployees = evaluated.Count;
            result.AverageKpiScore = evaluated.Any() ? Math.Round(evaluated.Average(p => p.LatestKpiScore!.Value), 1) : 0;
            result.RankACount = performers.Count(p => p.LatestRatingRank == "A");
            result.RankBCount = performers.Count(p => p.LatestRatingRank == "B");
            result.RankCCount = performers.Count(p => p.LatestRatingRank == "C");
            result.RankDCount = performers.Count(p => p.LatestRatingRank == "D");
            result.TopPerformers = performers.Take(5).ToList();
        }

        return result;
    }
}

