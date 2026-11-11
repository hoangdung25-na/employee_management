export interface HeadcountAndTurnover {
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  managerName?: string | null;
  activeHeadcount: number;
  probationCount: number;
  terminatedCount: number;
  turnoverRatePercent: number;
  totalActiveBaseSalary: number;
  averageBaseSalary: number;
}

export interface AttendanceMonthlySummary {
  employeeId: string;
  employeeCode: string;
  fullName: string;
  departmentName: string;
  attendanceYear: number;
  attendanceMonth: number;
  totalLoggedDays: number;
  onTimeDays: number;
  lateDays: number;
  leaveDays: number;
  totalWorkingHours: number;
  totalOvertimeHours: number;
  totalLateMinutes: number;
}

export interface PerformanceAndTrainingOverview {
  employeeId: string;
  employeeCode: string;
  fullName: string;
  departmentName: string;
  positionName: string;
  latestCycleCode?: string | null;
  latestKpiScore?: number | null;
  latestRatingRank?: string | null;
  reviewStatus?: string | null;
  completedTrainingCourses: number;
  activeTrainingCourses: number;
}

export interface HrAnalyticsDashboard {
  totalActiveHeadcount: number;
  totalProbationCount: number;
  totalTerminatedCount: number;
  overallTurnoverRatePercent: number;
  totalActiveMonthlySalary: number;
  averageEmployeeSalary: number;

  totalOvertimeHours: number;
  totalLateIncidents: number;
  averageWorkingDays: number;

  totalEvaluatedEmployees: number;
  averageKpiScore: number;
  rankACount: number;
  rankBCount: number;
  rankCCount: number;
  rankDCount: number;
  totalCompletedTrainings: number;

  departmentBreakdown: HeadcountAndTurnover[];
  topPerformers: PerformanceAndTrainingOverview[];
}

