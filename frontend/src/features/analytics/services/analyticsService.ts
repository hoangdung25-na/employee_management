import { apiGet } from "@/lib/api/client";
import { HrAnalyticsDashboard } from "../types/analytics";

export const analyticsService = {
  getDashboard: async (params?: { year?: number; month?: number }): Promise<HrAnalyticsDashboard> => {
    return apiGet<HrAnalyticsDashboard>("/analytics/dashboard", params);
  },
};

