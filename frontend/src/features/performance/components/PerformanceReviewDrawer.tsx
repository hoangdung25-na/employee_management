"use client";

import React from "react";
import { Icon } from "@/components/ui/Icon";
import { PerformanceReview } from "../types/performance";
import { formatCurrencyVND } from "@/lib/utils/format";

interface PerformanceReviewDrawerProps {
  review: PerformanceReview | null;
  onOpenEvaluateModal: () => void;
  onClose?: () => void;
}

export function PerformanceReviewDrawer({
  review,
  onOpenEvaluateModal,
  onClose,
}: PerformanceReviewDrawerProps) {
  if (!review) {
    return (
      <aside className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-8 text-center text-[#6B7280] flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 rounded-full bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center mb-3">
          <Icon name="military_tech" size={24} />
        </div>
        <h3 className="font-heading font-semibold text-[#111827] text-[15px]">
          Chưa chọn nhân sự
        </h3>
        <p className="text-[13px] text-[#6B7280] mt-1 max-w-xs">
          Vui lòng bấm vào một dòng nhân viên trong bảng để xem chi tiết chỉ tiêu KPI và thẩm định điểm số.
        </p>
      </aside>
    );
  }

  const getRankBadgeClass = (rank?: string | null) => {
    switch (rank) {
      case "A":
        return "bg-[#EDE9FE] text-[#7C3AED] border-[#DDD6FE]";
      case "B":
        return "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]";
      case "C":
        return "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]";
      case "D":
        return "bg-[#FEF2F2] text-[#EF4444] border-[#FECACA]";
      default:
        return "bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]";
    }
  };

  return (
    <aside className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5 flex flex-col gap-4 border-t-4 border-t-[#7C3AED]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-full bg-[#EDE9FE] text-[#7C3AED] font-heading font-bold flex items-center justify-center text-[16px] ring-2 ring-[#7C3AED]/20 shrink-0">
            {review.employeeName
              .split(" ")
              .slice(-2)
              .map((n) => n[0])
              .join("")
              .toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <h3 className="font-heading text-[16px] font-semibold text-[#111827] truncate">
              {review.employeeName}
            </h3>
            <span className="text-[12px] text-[#6B7280] truncate">
              {review.positionName} • {review.departmentName}
            </span>
            <span className="font-mono text-[11px] text-[#7C3AED] font-medium mt-0.5">
              Mã NV: {review.employeeCode}
            </span>
          </div>
        </div>

        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${
            review.status === "Completed"
              ? "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]"
              : "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]"
          }`}
        >
          {review.status === "Completed" ? "Đã thẩm định" : "Đang chờ duyệt"}
        </span>
      </div>

      {/* Score Overview Card */}
      <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider block">
            Điểm thẩm định tổng kết
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-[28px] font-heading font-bold text-[#111827]">
              {review.finalScore !== null && review.finalScore !== undefined
                ? review.finalScore
                : (review.selfScore ?? "--")}
            </span>
            <span className="text-[13px] text-[#9CA3AF]">/ 100</span>
          </div>
          <span className="text-[11px] text-[#6B7280] mt-0.5 block">
            Điểm tự đánh giá: <strong>{review.selfScore ?? "--"}</strong>
          </span>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span
            className={`px-3 py-1 rounded-full text-[13px] font-heading font-bold border ${getRankBadgeClass(
              review.ratingRank
            )}`}
          >
            Hạng {review.ratingRank ?? "Chưa xếp loại"}
          </span>
          <span className="text-[11px] text-[#0D9488] font-mono">
            Thưởng: +{formatCurrencyVND(review.estimatedRewardAmount)}
          </span>
        </div>
      </div>

      {/* Goals Breakdown List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-heading text-[13px] font-semibold text-[#111827]">
            Chi tiết mục tiêu KPI ({review.goals.length})
          </span>
          <span className="text-[11px] font-mono text-[#6B7280]">
            Tổng trọng số: {review.goals.reduce((acc, g) => acc + g.weightPercent, 0)}%
          </span>
        </div>

        <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
          {review.goals.map((goal, index) => {
            const score = goal.managerAchievementScore ?? goal.selfAchievementScore ?? 0;
            return (
              <div
                key={goal.id || index}
                className="p-3 rounded-lg border border-[#E5E7EB] bg-white flex flex-col gap-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[12px] font-semibold text-[#111827] leading-snug">
                    {goal.goalTitle}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#EDE9FE] text-[#7C3AED] font-semibold shrink-0">
                    {goal.weightPercent}%
                  </span>
                </div>
                <p className="text-[11px] text-[#6B7280] line-clamp-2">
                  {goal.targetDescription}
                </p>

                <div className="flex items-center justify-between text-[11px] mt-1 pt-1.5 border-t border-[#F3F4F6]">
                  <span className="text-[#6B7280]">
                    Tự chấm: <strong>{goal.selfAchievementScore ?? "--"}</strong> • QL chấm:{" "}
                    <strong>{goal.managerAchievementScore ?? "--"}</strong>
                  </span>
                  <span className="font-semibold text-[#7C3AED] font-mono">
                    {score}%
                  </span>
                </div>
                <div className="w-full h-1 bg-[#F3F4F6] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#7C3AED] rounded-full"
                    style={{ width: `${Math.min(score, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feedback & Development Plan */}
      <div className="space-y-2.5 pt-2 border-t border-[#F3F4F6] text-[12px]">
        {review.managerFeedback && (
          <div>
            <span className="font-semibold text-[#111827] block mb-0.5">
              Nhận xét của Quản lý:
            </span>
            <p className="text-[#4B5563] bg-[#F9FAFB] p-2 rounded-lg border border-[#E5E7EB] text-[11px] leading-relaxed">
              {review.managerFeedback}
            </p>
          </div>
        )}

        {review.developmentPlan && (
          <div>
            <span className="font-semibold text-[#111827] block mb-0.5">
              Kế hoạch phát triển cá nhân:
            </span>
            <p className="text-[#0D9488] bg-[#F0FDFA] p-2 rounded-lg border border-[#99F6E4] text-[11px] leading-relaxed">
              {review.developmentPlan}
            </p>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="pt-2 border-t border-[#F3F4F6]">
        <button
          type="button"
          onClick={onOpenEvaluateModal}
          className="w-full h-10 px-4 rounded-lg bg-[#7C3AED] hover:bg-[#5B21B6] text-white font-medium text-[13px] flex items-center justify-center gap-2 shadow-xs transition-colors"
        >
          <Icon name="edit_square" size={16} />
          <span>Thẩm định & Chấm điểm KPI</span>
        </button>
      </div>
    </aside>
  );
}
