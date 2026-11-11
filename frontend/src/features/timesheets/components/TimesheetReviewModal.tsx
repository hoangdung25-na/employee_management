"use client";

import React, { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { formatDateVN } from "@/lib/utils/format";
import { TimesheetEntry } from "../types/timesheet";

interface TimesheetReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: TimesheetEntry | null;
  onReview: (id: string, isApproved: boolean, rejectionReason?: string) => Promise<void>;
}

export function TimesheetReviewModal({
  isOpen,
  onClose,
  entry,
  onReview,
}: TimesheetReviewModalProps) {
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRejectMode, setIsRejectMode] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !entry) return null;

  const handleApprove = async () => {
    setError(null);
    try {
      setIsSubmitting(true);
      await onReview(entry.id, true);
      onClose();
    } catch (err: unknown) {
      const errMessage =
        err instanceof Error ? err.message : "Đã có lỗi khi phê duyệt.";
      setError(errMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setError(null);
    if (!rejectionReason.trim()) {
      setError("Vui lòng nhập lý do từ chối bản ghi timesheet.");
      return;
    }
    try {
      setIsSubmitting(true);
      await onReview(entry.id, false, rejectionReason.trim());
      onClose();
    } catch (err: unknown) {
      const errMessage =
        err instanceof Error ? err.message : "Đã có lỗi khi từ chối.";
      setError(errMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/50 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-[#E5E7EB] w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FAFAFA] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#F0FDFA] text-[#0D9488] flex items-center justify-center">
              <Icon name="verified" size={20} />
            </div>
            <div>
              <h3 className="font-heading text-[18px] font-bold text-[#111827]">
                Xét duyệt bản ghi Timesheet
              </h3>
              <p className="text-[12px] text-[#6B7280]">
                Kiểm tra nội dung công việc và số giờ thực tế đã kê khai.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F3F4F6] transition-all cursor-pointer"
            type="button"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-[13px] flex-1 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] flex items-center gap-2">
              <Icon name="warning" size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Details Card */}
          <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#111827]">
                  {entry.employeeFullName}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-white border border-[#E5E7EB] text-[11px] font-mono font-medium text-[#6B7280]">
                  {entry.employeeCode}
                </span>
              </div>
              <span className="font-mono text-[12px] text-[#6B7280]">
                {formatDateVN(entry.workDate)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#EDE9FE] text-[#7C3AED]">
                {entry.projectCode}
              </span>
              <span className="font-medium text-[#374151]">
                {entry.projectName}
              </span>
            </div>

            <div className="pt-2 border-t border-[#E5E7EB] flex items-start justify-between">
              <div>
                <p className="text-[11px] text-[#9CA3AF] uppercase font-semibold">
                  Nội dung công việc
                </p>
                <p className="text-[#111827] font-medium mt-0.5">
                  {entry.taskTitle}
                </p>
                {entry.description && (
                  <p className="text-[#6B7280] text-[12px] mt-1 whitespace-pre-wrap">
                    {entry.description}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="text-[11px] text-[#9CA3AF] uppercase font-semibold">
                  Giờ làm
                </p>
                <p className="text-[18px] font-mono font-bold text-[#0D9488]">
                  {entry.hoursWorked.toFixed(2)}h
                </p>
                <span className="text-[10px] font-semibold text-[#6B7280]">
                  {entry.isBillable ? "Tính phí" : "Nội bộ"}
                </span>
              </div>
            </div>
          </div>

          {/* Rejection Reason Form */}
          {isRejectMode && (
            <div className="space-y-1.5 animate-fade-in">
              <label className="block font-medium text-[#DC2626]">
                Lý do từ chối bản ghi <span className="text-[#EF4444]">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Nhập lý do cụ thể (sai dự án, thiếu giờ làm, nội dung chưa rõ ràng...)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-3 rounded-lg border border-[#FECACA] bg-[#FEF2F2]/30 text-[#111827] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-[#4B5563] font-medium hover:bg-[#F3F4F6] transition-all cursor-pointer"
          >
            Đóng
          </button>

          <div className="flex items-center gap-2">
            {!isRejectMode ? (
              <>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsRejectMode(true)}
                  className="px-4 py-2 rounded-lg border border-[#FECACA] bg-white text-[#DC2626] font-medium hover:bg-[#FEF2F2] transition-all disabled:opacity-50 cursor-pointer"
                >
                  Từ chối...
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleApprove}
                  className="px-5 py-2 rounded-lg bg-[#059669] text-white font-medium hover:bg-[#047857] shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Icon name="check_circle" size={16} />
                  <span>{isSubmitting ? "Đang xử lý..." : "Phê duyệt"}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsRejectMode(false)}
                  className="px-3 py-2 text-[#6B7280] hover:text-[#111827] text-[12px] cursor-pointer"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleReject}
                  className="px-5 py-2 rounded-lg bg-[#DC2626] text-white font-medium hover:bg-[#B91C1C] shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Icon name="close" size={16} />
                  <span>{isSubmitting ? "Đang gửi..." : "Xác nhận từ chối"}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
