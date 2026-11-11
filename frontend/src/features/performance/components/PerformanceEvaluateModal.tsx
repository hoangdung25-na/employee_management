"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { PerformanceReview } from "../types/performance";
import { performanceService } from "../services/performanceService";

interface PerformanceEvaluateModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: PerformanceReview | null;
  onSuccess: () => void;
}

export function PerformanceEvaluateModal({
  isOpen,
  onClose,
  review,
  onSuccess,
}: PerformanceEvaluateModalProps) {
  const [isManager, setIsManager] = useState(true);
  const [overallScore, setOverallScore] = useState<number | "">("");
  const [comment, setComment] = useState("");
  const [developmentPlan, setDevelopmentPlan] = useState("");
  const [goalScores, setGoalScores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (review) {
      setOverallScore(review.finalScore ?? review.managerScore ?? review.selfScore ?? "");
      setComment(review.managerFeedback || review.employeeSelfComment || "");
      setDevelopmentPlan(review.developmentPlan || "");

      const initialGoalScores: Record<string, number> = {};
      review.goals.forEach((g) => {
        initialGoalScores[g.id] = g.managerAchievementScore ?? g.selfAchievementScore ?? 80;
      });
      setGoalScores(initialGoalScores);
    }
  }, [review]);

  if (!isOpen || !review) return null;

  const handleGoalScoreChange = (goalId: string, val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    const nextScores = { ...goalScores, [goalId]: clamped };
    setGoalScores(nextScores);

    const totalWeight = review.goals.reduce((acc, g) => acc + g.weightPercent, 0);
    if (totalWeight > 0) {
      const weightedSum = review.goals.reduce((acc, g) => {
        const s = nextScores[g.id] ?? 0;
        return acc + s * (g.weightPercent / totalWeight);
      }, 0);
      setOverallScore(Math.round(weightedSum * 10) / 10);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await performanceService.evaluateReview(review.id, {
        isManagerEvaluation: isManager,
        overallScore: overallScore === "" ? undefined : Number(overallScore),
        comment,
        developmentPlan: isManager ? developmentPlan : undefined,
        goalScores: Object.entries(goalScores).map(([goalId, score]) => ({
          goalId,
          score,
        })),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Có lỗi xảy ra khi cập nhật đánh giá.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-[#E5E7EB] w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#F3F4F6] flex items-center justify-between bg-[#FAFAFA] shrink-0">
          <div>
            <h2 className="font-heading text-[18px] font-semibold text-[#111827]">
              Thẩm định Điểm số & Xếp loại KPI
            </h2>
            <p className="text-[12px] text-[#6B7280]">
              Nhân sự: <strong>{review.employeeName}</strong> ({review.employeeCode}) • {review.departmentName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F3F4F6] flex items-center justify-center transition-colors cursor-pointer"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form
          id="evaluateKpiForm"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-5"
        >
          {error && (
            <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[13px] text-[#EF4444] flex items-center gap-2">
              <Icon name="warning" size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 p-1 bg-[#F3F4F6] rounded-lg">
            <button
              type="button"
              onClick={() => setIsManager(true)}
              className={`flex-1 py-1.5 text-[13px] font-medium rounded-md transition-all cursor-pointer ${isManager
                  ? "bg-white text-[#7C3AED] shadow-xs font-semibold"
                  : "text-[#6B7280] hover:text-[#111827]"
                }`}
            >
              Quản lý trực tiếp thẩm định
            </button>
            <button
              type="button"
              onClick={() => setIsManager(false)}
              className={`flex-1 py-1.5 text-[13px] font-medium rounded-md transition-all cursor-pointer ${!isManager
                  ? "bg-white text-[#7C3AED] shadow-xs font-semibold"
                  : "text-[#6B7280] hover:text-[#111827]"
                }`}
            >
              Nhân viên tự đánh giá
            </button>
          </div>

          {/* Goals scoring inputs */}
          <div className="space-y-3">
            <label className="text-[13px] font-semibold text-[#111827] block">
              Chấm điểm từng mục tiêu KPI (Thang điểm 0 - 100)
            </label>
            <div className="space-y-3">
              {review.goals.map((g) => (
                <div
                  key={g.id}
                  className="p-3.5 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-[#111827]">
                        {g.goalTitle}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#EDE9FE] text-[#7C3AED]">
                        Trọng số {g.weightPercent}%
                      </span>
                    </div>
                    <p className="text-[12px] text-[#6B7280] mt-0.5 line-clamp-1">
                      {g.targetDescription}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={goalScores[g.id] ?? ""}
                      onChange={(e) => handleGoalScoreChange(g.id, Number(e.target.value))}
                      className="w-20 h-9 px-2 text-center rounded-lg border border-[#D1D5DB] font-heading font-bold text-[14px] text-[#111827] focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
                    />
                    <span className="text-[12px] text-[#6B7280]">/ 100</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Overall score preview */}
          <div className="p-4 rounded-xl bg-[#F5F3FF] border border-[#DDD6FE] flex items-center justify-between">
            <div>
              <span className="text-[12px] font-semibold text-[#5B21B6] block">
                Điểm số tổng kết tính theo trọng số:
              </span>
              <span className="text-[11px] text-[#6B7280]">
                Tự động gán thứ hạng: A (≥90), B (≥80), C (≥65), D (&lt;65)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={overallScore}
                onChange={(e) => setOverallScore(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-24 h-10 px-2 text-center rounded-lg border border-[#7C3AED] bg-white font-heading font-bold text-[18px] text-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
              />
              <span className="text-[13px] font-mono font-bold text-[#7C3AED]">
                {overallScore !== "" && Number(overallScore) >= 90
                  ? "Hạng A (Xuất sắc)"
                  : overallScore !== "" && Number(overallScore) >= 80
                    ? "Hạng B (Tốt)"
                    : overallScore !== "" && Number(overallScore) >= 65
                      ? "Hạng C (Đạt)"
                      : "Hạng D (Cải thiện)"}
              </span>
            </div>
          </div>

          {/* Comment / Feedback */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-[#111827] block">
              {isManager ? "Nhận xét và góp ý của Quản lý" : "Ý kiến tự đánh giá của nhân viên"}
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Nhập nhận xét chi tiết về tiến độ, kết quả công việc và thái độ làm việc..."
              className="w-full p-3 rounded-lg border border-[#D1D5DB] text-[13px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
            />
          </div>

          {/* Development Plan - Manager only */}
          {isManager && (
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-[#111827] block">
                Kế hoạch phát triển cá nhân & Đề xuất đào tạo
              </label>
              <textarea
                rows={2}
                value={developmentPlan}
                onChange={(e) => setDevelopmentPlan(e.target.value)}
                placeholder="Gợi ý khóa học nội bộ, kỹ năng cần trau dồi hoặc dự án mới..."
                className="w-full p-3 rounded-lg border border-[#D1D5DB] text-[13px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
              />
            </div>
          )}
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#F3F4F6] bg-[#FAFAFA] flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-10 px-4 rounded-lg border border-[#D1D5DB] bg-white text-[#4B5563] hover:bg-[#F9FAFB] text-[13px] font-medium transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            form="evaluateKpiForm"
            disabled={loading}
            className="h-10 px-5 rounded-lg bg-[#7C3AED] hover:bg-[#5B21B6] text-white text-[13px] font-semibold shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Icon name="sync" size={16} className="animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Icon name="check_circle" size={16} />
                <span>Xác nhận & Lưu thẩm định</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
