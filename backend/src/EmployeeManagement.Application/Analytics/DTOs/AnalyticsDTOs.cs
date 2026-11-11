namespace EmployeeManagement.Application.Analytics.DTOs;

public class HeadcountAndTurnoverDto
{
    public Guid DepartmentId { get; set; }
    public string DepartmentCode { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string? ManagerName { get; set; }
    public int ActiveHeadcount { get; set; }
    public int ProbationCount { get; set; }
    public int TerminatedCount { get; set; }
    public decimal TurnoverRatePercent { get; set; }
    public decimal TotalActiveBaseSalary { get; set; }
    public decimal AverageBaseSalary { get; set; }
}

public class AttendanceMonthlySummaryDto
{
    public Guid EmployeeId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public int AttendanceYear { get; set; }
    public int AttendanceMonth { get; set; }
    public int TotalLoggedDays { get; set; }
    public int OnTimeDays { get; set; }
    public int LateDays { get; set; }
    public int LeaveDays { get; set; }
    public decimal TotalWorkingHours { get; set; }
    public decimal TotalOvertimeHours { get; set; }
    public int TotalLateMinutes { get; set; }
}

public class PerformanceAndTrainingOverviewDto
{
    public Guid EmployeeId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string PositionName { get; set; } = string.Empty;
    public string? LatestCycleCode { get; set; }
    public decimal? LatestKpiScore { get; set; }
    public string? LatestRatingRank { get; set; }
    public string? ReviewStatus { get; set; }
    public int CompletedTrainingCourses { get; set; }
    public int ActiveTrainingCourses { get; set; }
}

public class HrAnalyticsDashboardDto
{
    // Overall Headcount
    public int TotalActiveHeadcount { get; set; }
    public int TotalProbationCount { get; set; }
    public int TotalTerminatedCount { get; set; }
    public decimal OverallTurnoverRatePercent { get; set; }
    public decimal TotalActiveMonthlySalary { get; set; }
    public decimal AverageEmployeeSalary { get; set; }

    // Attendance stats
    public decimal TotalOvertimeHours { get; set; }
    public int TotalLateIncidents { get; set; }
    public decimal AverageWorkingDays { get; set; }

    // Performance & Training stats
    public int TotalEvaluatedEmployees { get; set; }
    public decimal AverageKpiScore { get; set; }
    public int RankACount { get; set; }
    public int RankBCount { get; set; }
    public int RankCCount { get; set; }
    public int RankDCount { get; set; }
    public int TotalCompletedTrainings { get; set; }

    // Department breakdown
    public List<HeadcountAndTurnoverDto> DepartmentBreakdown { get; set; } = new();

    // Top performers
    public List<PerformanceAndTrainingOverviewDto> TopPerformers { get; set; } = new();
}

