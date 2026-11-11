export interface ReviewCycle {
  id: string;
  cycleCode: string;
  cycleName: string;
  cycleType: string;
  startDate: string;
  endDate: string;
  selfReviewDeadline: string;
  managerReviewDeadline: string;
  status: string;
  totalReviews: number;
  completedReviews: number;
}

export interface PerformanceGoal {
  id: string;
  performanceReviewId: string;
  goalTitle: string;
  targetDescription: string;
  weightPercent: number;
  selfAchievementScore?: number | null;
  managerAchievementScore?: number | null;
  comment?: string | null;
}

export interface PerformanceReview {
  id: string;
  reviewCycleId: string;
  cycleCode: string;
  cycleName: string;

  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentId?: string;
  departmentName: string;
  positionName: string;

  reviewerEmployeeId: string;
  reviewerName: string;

  selfScore?: number | null;
  managerScore?: number | null;
  finalScore?: number | null;
  ratingRank?: string | null;

  employeeSelfComment?: string | null;
  managerFeedback?: string | null;
  developmentPlan?: string | null;

  status: string;
  submittedAt?: string | null;
  reviewedAt?: string | null;

  goalsCount: number;
  averageProgressPercent: number;
  estimatedRewardAmount: number;

  goals: PerformanceGoal[];
}

export interface PerformanceSummaryMetrics {
  totalEmployees: number;
  averageCompletionPercent: number;
  passAndExcellentRate: number;
  rankACount: number;
  rankBCount: number;
  rankCCount: number;
  rankDCount: number;
  projectedBonusFund: number;
}

export interface CreateReviewCycleRequest {
  cycleCode: string;
  cycleName: string;
  cycleType: string;
  startDate: string;
  endDate: string;
  selfReviewDeadline: string;
  managerReviewDeadline: string;
}

export interface CreatePerformanceReviewRequest {
  reviewCycleId: string;
  employeeId: string;
  reviewerEmployeeId: string;
  goals: {
    goalTitle: string;
    targetDescription: string;
    weightPercent: number;
    selfAchievementScore?: number;
    managerAchievementScore?: number;
    comment?: string;
  }[];
}

export interface EvaluatePerformanceReviewRequest {
  isManagerEvaluation: boolean;
  overallScore?: number;
  comment?: string;
  developmentPlan?: string;
  goalScores: {
    goalId: string;
    score?: number;
    comment?: string;
  }[];
}

