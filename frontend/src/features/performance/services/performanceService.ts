import { apiGet, apiPost, apiPut } from "@/lib/api/client";
import { PagedResult } from "@/types/api";
import {
  CreatePerformanceReviewRequest,
  CreateReviewCycleRequest,
  EvaluatePerformanceReviewRequest,
  PerformanceReview,
  PerformanceSummaryMetrics,
  ReviewCycle,
} from "../types/performance";

export const performanceService = {
  getCycles: async (): Promise<ReviewCycle[]> => {
    return apiGet<ReviewCycle[]>("/performance/cycles");
  },

  createCycle: async (dto: CreateReviewCycleRequest): Promise<ReviewCycle> => {
    return apiPost<ReviewCycle>("/performance/cycles", dto);
  },

  getSummaryMetrics: async (cycleId?: string, departmentId?: string): Promise<PerformanceSummaryMetrics> => {
    return apiGet<PerformanceSummaryMetrics>("/performance/reviews/summary", { cycleId, departmentId });
  },

  getReviews: async (params?: {
    cycleId?: string;
    departmentId?: string;
    employeeId?: string;
    rank?: string;
    search?: string;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<PagedResult<PerformanceReview>> => {
    return apiGet<PagedResult<PerformanceReview>>("/performance/reviews", params);
  },

  getReviewById: async (id: string): Promise<PerformanceReview> => {
    return apiGet<PerformanceReview>(`/performance/reviews/${id}`);
  },

  createReview: async (dto: CreatePerformanceReviewRequest): Promise<PerformanceReview> => {
    return apiPost<PerformanceReview>("/performance/reviews", dto);
  },

  evaluateReview: async (id: string, dto: EvaluatePerformanceReviewRequest): Promise<PerformanceReview> => {
    return apiPut<PerformanceReview>(`/performance/reviews/${id}/evaluate`, dto);
  },
};

