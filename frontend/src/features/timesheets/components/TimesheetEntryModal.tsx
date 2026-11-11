"use client";

import React, { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  CreateTimesheetEntryInput,
  TimesheetEntry,
  UpdateTimesheetEntryInput,
} from "../types/timesheet";

interface TimesheetEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: CreateTimesheetEntryInput | UpdateTimesheetEntryInput,
    isEdit: boolean,
    submitImmediately: boolean
  ) => Promise<void>;
  initialEntry?: TimesheetEntry | null;
  defaultDate?: string;
}

const PRESET_PROJECTS = [
  { code: "PRJ-HRFLOW", name: "Hệ thống Quản trị Nhân sự HRFlow" },
  { code: "PRJ-CORE", name: "Nền tảng Dịch vụ Lõi Doanh nghiệp" },
  { code: "PRJ-ERP", name: "Phân hệ Kế toán & Tài chính Doanh nghiệp" },
  { code: "PRJ-CRM", name: "Nền tảng Quản trị Quan hệ Khách hàng" },
  { code: "PRJ-MOBILE", name: "Ứng dụng Di động Nhân viên" },
];

export function TimesheetEntryModal({
  isOpen,
  onClose,
  onSubmit,
  initialEntry,
  defaultDate,
}: TimesheetEntryModalProps) {
  const isEdit = Boolean(initialEntry);

  const [workDate, setWorkDate] = useState<string>(
    initialEntry?.workDate || defaultDate || "2026-11-04"
  );
  const [projectCode, setProjectCode] = useState<string>(
    initialEntry?.projectCode || "PRJ-HRFLOW"
  );
  const [projectName, setProjectName] = useState<string>(
    initialEntry?.projectName || "Hệ thống Quản trị Nhân sự HRFlow"
  );
  const [taskTitle, setTaskTitle] = useState<string>(
    initialEntry?.taskTitle || ""
  );
  const [hoursWorked, setHoursWorked] = useState<number>(
    initialEntry?.hoursWorked || 8
  );
  const [isBillable, setIsBillable] = useState<boolean>(
    initialEntry ? initialEntry.isBillable : true
  );
  const [description, setDescription] = useState<string>(
    initialEntry?.description || ""
  );

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (code: string, name: string) => {
    setProjectCode(code);
    setProjectName(name);
  };

  const handleQuickHours = (hrs: number) => {
    setHoursWorked(hrs);
  };

  const handleSave = async (submitImmediately: boolean) => {
    setError(null);
    if (!workDate) {
      setError("Vui lòng chọn ngày làm việc.");
      return;
    }
    if (!projectCode.trim() || !projectName.trim()) {
      setError("Vui lòng chọn hoặc nhập mã và tên dự án.");
      return;
    }
    if (!taskTitle.trim()) {
      setError("Vui lòng nhập nội dung công việc.");
      return;
    }
    if (hoursWorked <= 0 || hoursWorked > 24) {
      setError("Số giờ làm việc phải từ 0.25 đến 24 giờ.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(
        {
          workDate,
          projectCode: projectCode.trim().toUpperCase(),
          projectName: projectName.trim(),
          taskTitle: taskTitle.trim(),
          hoursWorked: Number(hoursWorked),
          isBillable,
          description: description.trim() || undefined,
          submitImmediately,
        },
        isEdit,
        submitImmediately
      );
      onClose();
    } catch (err: unknown) {
      const errMessage =
        err instanceof Error ? err.message : "Đã có lỗi xảy ra khi lưu timesheet.";
      setError(errMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/50 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-[#E5E7EB] w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FAFAFA] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center">
              <Icon name="schedule" size={20} />
            </div>
            <div>
              <h3 className="font-heading text-[18px] font-bold text-[#111827]">
                {isEdit ? "Chỉnh sửa dòng Timesheet" : "Kê khai giờ làm mới"}
              </h3>
              <p className="text-[12px] text-[#6B7280]">
                Ghi nhận chi tiết công việc, số giờ và phân bổ dự án.
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

        {/* Form Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4 text-[13px]">
          {error && (
            <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] flex items-center gap-2">
              <Icon name="warning" size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Row: WorkDate & HoursWorked */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-[#111827] mb-1.5">
                Ngày làm việc <span className="text-[#EF4444]">*</span>
              </label>
              <input
                type="date"
                value={workDate}
                onChange={(e) => setWorkDate(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
              />
            </div>

            <div>
              <label className="block font-medium text-[#111827] mb-1.5">
                Số giờ làm <span className="text-[#EF4444]">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  max="24"
                  value={hoursWorked}
                  onChange={(e) => setHoursWorked(parseFloat(e.target.value) || 0)}
                  className="w-24 h-10 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] font-mono font-semibold focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                />
                <div className="flex items-center gap-1">
                  {[2, 4, 7.5, 8].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => handleQuickHours(h)}
                      className={`px-2 py-1.5 rounded text-[11px] font-mono font-medium transition-all cursor-pointer ${
                        hoursWorked === h
                          ? "bg-[#7C3AED] text-white"
                          : "bg-[#F3F4F6] text-[#4B5563] hover:bg-[#EDE9FE] hover:text-[#7C3AED]"
                      }`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Project Presets */}
          <div>
            <label className="block font-medium text-[#111827] mb-1.5">
              Dự án áp dụng <span className="text-[#EF4444]">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_PROJECTS.map((proj) => (
                <button
                  key={proj.code}
                  type="button"
                  onClick={() => handleSelectPreset(proj.code, proj.name)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border cursor-pointer ${
                    projectCode === proj.code
                      ? "bg-[#EDE9FE] text-[#7C3AED] border-[#7C3AED]"
                      : "bg-[#F9FAFB] text-[#4B5563] border-[#E5E7EB] hover:bg-[#F3F4F6]"
                  }`}
                >
                  <span className="font-mono font-bold mr-1">{proj.code}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Mã dự án (VD: PRJ-HRFLOW)"
                value={projectCode}
                onChange={(e) => setProjectCode(e.target.value.toUpperCase())}
                className="h-10 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] font-mono uppercase focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
              />
              <input
                type="text"
                placeholder="Tên dự án đầy đủ"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="sm:col-span-2 h-10 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
              />
            </div>
          </div>

          {/* Task Title */}
          <div>
            <label className="block font-medium text-[#111827] mb-1.5">
              Nội dung công việc <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Thiết kế giao diện phân hệ quản lý chấm công..."
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-medium text-[#111827] mb-1.5">
              Mô tả chi tiết (tùy chọn)
            </label>
            <textarea
              rows={3}
              placeholder="Ghi chú chi tiết kết quả công việc, hạng mục đã hoàn thiện hoặc vấn đề cần xử lý..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 resize-none"
            />
          </div>

          {/* Billable Checkbox */}
          <div className="pt-2 flex items-center justify-between border-t border-[#F3F4F6]">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isBillable}
                onChange={(e) => setIsBillable(e.target.checked)}
                className="w-4 h-4 rounded text-[#7C3AED] focus:ring-[#7C3AED]"
              />
              <span className="font-medium text-[#111827]">
                Công việc tính phí theo dự án
              </span>
            </label>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                isBillable
                  ? "bg-[#F0FDFA] text-[#0D9488] border border-[#99F6E4]"
                  : "bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]"
              }`}
            >
              {isBillable ? "Tính phí" : "Nội bộ"}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-[#4B5563] font-medium hover:bg-[#F3F4F6] transition-all cursor-pointer"
          >
            Hủy bỏ
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave(false)}
              className="px-4 py-2 rounded-lg border border-[#7C3AED] bg-white text-[#7C3AED] font-medium hover:bg-[#F5F3FF] transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Đang lưu..." : "Lưu bản nháp"}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave(true)}
              className="px-5 py-2 rounded-lg bg-[#7C3AED] text-white font-medium hover:bg-[#5B21B6] shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Icon name="check_circle" size={16} />
              <span>{isSubmitting ? "Đang gửi..." : "Nộp phê duyệt ngay"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
