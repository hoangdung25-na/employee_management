"use client";

import React, { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { ReviewCycle } from "../types/performance";
import { performanceService } from "../services/performanceService";

interface CreatePerformanceReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  cycles: ReviewCycle[];
  currentCycleId: string;
  employees: { id: string; fullName: string; employeeCode: string; departmentName: string }[];
  currentReviewerId: string;
  onSuccess: () => void;
}

interface GoalInput {
  goalTitle: string;
  targetDescription: string;
  weightPercent: number;
}

export function CreatePerformanceReviewModal({
  isOpen,
  onClose,
  cycles,
  currentCycleId,
  employees,
  currentReviewerId,
  onSuccess,
}: CreatePerformanceReviewModalProps) {
  const [cycleId, setCycleId] = useState(currentCycleId);
  const [employeeId, setEmployeeId] = useState(employees[0]?.id || "");
  const [goals, setGoals] = useState<GoalInput[]>([
    {
      goalTitle: "Hoàn thành dự án phần mềm trọng điểm",
      targetDescription: "Bàn giao đúng tiến độ, tỷ lệ lỗi dưới 1%",
      weightPercent: 50,
    },
    {
      goalTitle: "Nâng cao năng lực chuyên môn & Viết tài liệu",
      targetDescription: "Hoàn thiện 100% tài liệu kỹ thuật và chia sẻ nội bộ",
      weightPercent: 30,
    },
    {
      goalTitle: "Tuân thủ văn hóa & Quy trình làm việc",
      targetDescription: "Chấm công đúng giờ, hoàn thành timesheet tuần đúng hạn",
      weightPercent: 20,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalWeight = goals.reduce((acc, g) => acc + (Number(g.weightPercent) || 0), 0);

  const handleAddGoal = () => {
    setGoals([
      ...goals,
      {
        goalTitle: "",
        targetDescription: "",
        weightPercent: 10,
      },
    ]);
  };

  const handleRemoveGoal = (index: number) => {
    if (goals.length <= 1) return;
    setGoals(goals.filter((_, i) => i !== index));
  };

  const handleGoalChange = (index: number, field: keyof GoalInput, val: any) => {
    const updated = [...goals];
    updated[index] = { ...updated[index], [field]: val };
    setGoals(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!employeeId) {
      setError("Vui lòng chọn nhân sự.");
      return;
    }

    if (totalWeight !== 100) {
      setError(`Tổng trọng số các mục tiêu phải bằng đúng 100% (Hiện tại: ${totalWeight}%).`);
      return;
    }

    for (const g of goals) {
      if (!g.goalTitle.trim()) {
        setError("Vui lòng nhập đầy đủ tiêu đề cho tất cả mục tiêu.");
        return;
      }
    }

    setLoading(true);
    try {
      await performanceService.createReview({
        reviewCycleId: cycleId || currentCycleId,
        employeeId,
        reviewerEmployeeId: currentReviewerId,
        goals: goals.map((g) => ({
          goalTitle: g.goalTitle.trim(),
          targetDescription: g.targetDescription.trim(),
          weightPercent: Number(g.weightPercent),
        })),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Có lỗi xảy ra khi giao chỉ tiêu KPI.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-[#E5E7EB] w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#F3F4F6] flex items-center justify-between bg-[#FAFAFA] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center">
              <Icon name="military_tech" size={18} />
            </div>
            <div>
              <h2 className="font-heading text-[18px] font-semibold text-[#111827]">
                Giao chỉ tiêu KPI mới
              </h2>
              <p className="text-[12px] text-[#6B7280]">
                Thiết lập phiếu đánh giá mục tiêu và trọng số cho nhân sự theo chu kỳ.
              </p>
            </div>
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
          id="createKpiReviewForm"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-5"
        >
          {error && (
            <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[13px] text-[#EF4444] flex items-center gap-2">
              <Icon name="warning" size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Form Top Row: Cycle + Employee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-[#111827] block">
                Kỳ đánh giá <span className="text-[#EF4444]">*</span>
              </label>
              <select
                value={cycleId}
                onChange={(e) => setCycleId(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-[#D1D5DB] rounded-lg text-[13px] text-[#111827] focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
              >
                {cycles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.cycleName} ({c.cycleCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-[#111827] block">
                Nhân viên được giao KPI <span className="text-[#EF4444]">*</span>
              </label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-[#D1D5DB] rounded-lg text-[13px] text-[#111827] focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.employeeCode} • {emp.departmentName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Goals List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-[#111827]">
                  Danh sách chỉ tiêu & Trọng số
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                    totalWeight === 100
                      ? "bg-[#ECFDF5] text-[#059669]"
                      : "bg-[#FFFBEB] text-[#D97706]"
                  }`}
                >
                  Tổng: {totalWeight}% / 100%
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddGoal}
                className="text-[12px] text-[#7C3AED] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Icon name="add" size={14} />
                Thêm mục tiêu
              </button>
            </div>

            <div className="space-y-3">
              {goals.map((g, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] space-y-2.5 relative group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <input
                      type="text"
                      value={g.goalTitle}
                      onChange={(e) => handleGoalChange(idx, "goalTitle", e.target.value)}
                      placeholder={`Mục tiêu ${idx + 1}: VD. Tăng trưởng doanh thu, đảm bảo chất lượng dự án...`}
                      className="flex-1 h-9 px-3 rounded-lg border border-[#D1D5DB] text-[13px] text-[#111827] focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
                      required
                    />

                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={g.weightPercent}
                        onChange={(e) => handleGoalChange(idx, "weightPercent", Number(e.target.value))}
                        className="w-16 h-9 px-2 text-center rounded-lg border border-[#D1D5DB] text-[13px] font-bold font-mono text-[#111827] focus:outline-none focus:border-[#7C3AED]"
                        required
                      />
                      <span className="text-[12px] font-semibold text-[#6B7280]">%</span>

                      {goals.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveGoal(idx)}
                          className="w-8 h-8 rounded-lg text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#FEF2F2] flex items-center justify-center transition-colors ml-1 cursor-pointer"
                          title="Xóa mục tiêu này"
                        >
                          <Icon name="delete" size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  <input
                    type="text"
                    value={g.targetDescription}
                    onChange={(e) => handleGoalChange(idx, "targetDescription", e.target.value)}
                    placeholder="Mô tả chỉ tiêu định lượng hoặc kết quả cần đạt được..."
                    className="w-full h-8 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[12px] text-[#4B5563] focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>
              ))}
            </div>
          </div>
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
            form="createKpiReviewForm"
            disabled={loading || totalWeight !== 100}
            className="h-10 px-5 rounded-lg bg-[#7C3AED] hover:bg-[#5B21B6] text-white text-[13px] font-semibold shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Icon name="sync" size={16} className="animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <Icon name="add" size={16} />
                <span>Giao chỉ tiêu KPI</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
