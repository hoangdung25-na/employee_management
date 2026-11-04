"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { formatDateVN } from "@/lib/utils/format";
import { useAuth } from "@/features/auth/context/AuthContext";
import {
  CreateTimesheetEntryInput,
  TimesheetEntry,
  TimesheetSummary,
  UpdateTimesheetEntryInput,
} from "@/features/timesheets/types/timesheet";
import {
  batchSubmitTimesheets,
  createTimesheetEntry,
  deleteTimesheetEntry,
  getTimesheets,
  getTimesheetSummary,
  reviewTimesheetEntry,
  updateTimesheetEntry,
} from "@/features/timesheets/services/timesheetService";
import { TimesheetEntryModal } from "@/features/timesheets/components/TimesheetEntryModal";
import { TimesheetReviewModal } from "@/features/timesheets/components/TimesheetReviewModal";
import { TimesheetWeeklyGrid } from "@/features/timesheets/components/TimesheetWeeklyGrid";

// Helper to get Monday of the week
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const VI_WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const DEFAULT_ACTIVE_MONDAY = new Date(2026, 10, 2); // 2026-11-02

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  Approved: {
    label: "Đã phê duyệt",
    bg: "bg-[#ECFDF5]",
    text: "text-[#059669]",
    border: "border-[#A7F3D0]",
    dot: "bg-[#059669]",
  },
  Submitted: {
    label: "Chờ phê duyệt",
    bg: "bg-[#FFFBEB]",
    text: "text-[#D97706]",
    border: "border-[#FDE68A]",
    dot: "bg-[#D97706]",
  },
  Draft: {
    label: "Bản nháp",
    bg: "bg-[#F3F4F6]",
    text: "text-[#4B5563]",
    border: "border-[#E5E7EB]",
    dot: "bg-[#9CA3AF]",
  },
  Rejected: {
    label: "Từ chối",
    bg: "bg-[#FEF2F2]",
    text: "text-[#DC2626]",
    border: "border-[#FECACA]",
    dot: "bg-[#DC2626]",
  },
};

export default function TimesheetsPage() {
  const { session, hasPermission, hasRole } = useAuth();
  const canReview =
    hasPermission("Timesheet.Approve") ||
    hasRole("SUPER_ADMIN") ||
    hasRole("HR_MANAGER") ||
    hasRole("MANAGER");

  // Date State: Reference Monday of active week (prerender-safe constant)
  const [currentMonday, setCurrentMonday] = useState<Date>(DEFAULT_ACTIVE_MONDAY);
  const [todayDateString, setTodayDateString] = useState<string>("2026-11-04");

  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [summary, setSummary] = useState<TimesheetSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active View Mode: 'matrix' | 'list' | 'queue'
  const [viewMode, setViewMode] = useState<"matrix" | "list" | "queue">("matrix");

  // Filter States
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [projectFilter, setProjectFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals
  const [isEntryModalOpen, setIsEntryModalOpen] = useState<boolean>(false);
  const [selectedEntryForEdit, setSelectedEntryForEdit] = useState<TimesheetEntry | null>(null);
  const [entryModalDefaultDate, setEntryModalDefaultDate] = useState<string | undefined>();

  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [selectedEntryForReview, setSelectedEntryForReview] = useState<TimesheetEntry | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Client-side date initialization
  useEffect(() => {
    const now = new Date();
    setTodayDateString(formatDateISO(now));
    if (now.getFullYear() === 2026) {
      setCurrentMonday(getMonday(now));
    }
  }, []);

  // Calculate 7 days for the active week
  const weekDays = useMemo(() => {
    return VI_WEEKDAYS.map((dayName, idx) => {
      const d = addDays(currentMonday, idx);
      const iso = formatDateISO(d);
      return {
        date: iso,
        dayName,
        dayNumber: d.getDate(),
        isToday: iso === todayDateString,
        isWeekend: idx >= 5,
      };
    });
  }, [currentMonday, todayDateString]);

  const fromDateISO = weekDays[0].date;
  const toDateISO = weekDays[6].date;

  // Load Data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [listRes, sumRes] = await Promise.all([
        getTimesheets({
          fromDate: viewMode === "queue" ? undefined : fromDateISO,
          toDate: viewMode === "queue" ? undefined : toDateISO,
          status: viewMode === "queue" ? "Submitted" : undefined,
        }),
        getTimesheetSummary({
          fromDate: fromDateISO,
          toDate: toDateISO,
        }),
      ]);
      setEntries(listRes);
      setSummary(sumRes);
    } catch (err: unknown) {
      const errMessage =
        err instanceof Error ? err.message : "Không thể tải danh sách timesheet.";
      setErrorMessage(errMessage);
    } finally {
      setIsLoading(false);
    }
  }, [fromDateISO, toDateISO, viewMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Toast Auto-dismiss
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Week Navigation handlers
  const handlePrevWeek = () => {
    setCurrentMonday((prev) => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setCurrentMonday((prev) => addDays(prev, 7));
  };

  const handleTodayWeek = () => {
    const today = new Date();
    if (today.getFullYear() === 2026) {
      setCurrentMonday(getMonday(today));
    } else {
      setCurrentMonday(DEFAULT_ACTIVE_MONDAY);
    }
  };

  // Entry Modal Triggers
  const handleOpenCreate = (
    defaultDate?: string,
    presetProjectCode?: string,
    presetProjectName?: string,
    presetTaskTitle?: string
  ) => {
    setSelectedEntryForEdit(null);
    setEntryModalDefaultDate(defaultDate || fromDateISO);
    setIsEntryModalOpen(true);
  };

  const handleOpenEdit = (entry: TimesheetEntry) => {
    setSelectedEntryForEdit(entry);
    setEntryModalDefaultDate(entry.workDate);
    setIsEntryModalOpen(true);
  };

  const handleOpenReview = (entry: TimesheetEntry) => {
    setSelectedEntryForReview(entry);
    setIsReviewModalOpen(true);
  };

  // Create or Update Submit Handler
  const handleSubmitEntry = async (
    data: CreateTimesheetEntryInput | UpdateTimesheetEntryInput,
    isEdit: boolean,
    submitImmediately: boolean
  ) => {
    if (isEdit && selectedEntryForEdit) {
      await updateTimesheetEntry(selectedEntryForEdit.id, data as UpdateTimesheetEntryInput);
      setToastMessage(
        submitImmediately
          ? "Đã cập nhật và nộp phê duyệt timesheet thành công."
          : "Đã cập nhật bản nháp timesheet."
      );
    } else {
      await createTimesheetEntry(data as CreateTimesheetEntryInput);
      setToastMessage(
        submitImmediately
          ? "Đã kê khai và nộp phê duyệt timesheet thành công."
          : "Đã lưu bản nháp timesheet mới."
      );
    }
    await loadData();
  };

  // Review Handler
  const handleReviewEntry = async (
    id: string,
    isApproved: boolean,
    rejectionReason?: string
  ) => {
    await reviewTimesheetEntry(id, { isApproved, rejectionReason });
    setToastMessage(
      isApproved
        ? "Đã phê duyệt bản ghi timesheet thành công."
        : "Đã từ chối bản ghi timesheet."
    );
    await loadData();
  };

  // Delete Handler
  const handleDeleteEntry = async (entry: TimesheetEntry) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa bản ghi timesheet "${entry.taskTitle}" (${entry.hoursWorked}h)?`
      )
    ) {
      return;
    }
    try {
      await deleteTimesheetEntry(entry.id);
      setToastMessage("Đã xóa bản ghi timesheet thành công.");
      await loadData();
    } catch (err: unknown) {
      const errMessage =
        err instanceof Error ? err.message : "Không thể xóa bản ghi timesheet.";
      alert(errMessage);
    }
  };

  // Batch Submit Drafts
  const draftCount = useMemo(() => {
    return entries.filter((e) => e.status === "Draft").length;
  }, [entries]);

  const handleBatchSubmitWeek = async () => {
    if (draftCount === 0) return;
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn nộp phê duyệt toàn bộ ${draftCount} bản ghi nháp trong tuần này?`
      )
    ) {
      return;
    }
    try {
      const count = await batchSubmitTimesheets({
        fromDate: fromDateISO,
        toDate: toDateISO,
      });
      setToastMessage(`Đã nộp phê duyệt thành công ${count} bản ghi timesheet.`);
      await loadData();
    } catch (err: unknown) {
      const errMessage =
        err instanceof Error ? err.message : "Đã có lỗi khi nộp hàng loạt.";
      alert(errMessage);
    }
  };

  // Distinct Project Codes for filter
  const distinctProjects = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => set.add(e.projectCode));
    return Array.from(set);
  }, [entries]);

  // Filtered Entries for List View
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Status
      if (statusFilter !== "ALL" && entry.status !== statusFilter) {
        return false;
      }
      // Project
      if (projectFilter !== "ALL" && entry.projectCode !== projectFilter) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = entry.taskTitle.toLowerCase().includes(q);
        const matchProj = entry.projectName.toLowerCase().includes(q) || entry.projectCode.toLowerCase().includes(q);
        const matchEmp = entry.employeeFullName.toLowerCase().includes(q) || entry.employeeCode.toLowerCase().includes(q);
        if (!matchTitle && !matchProj && !matchEmp) return false;
      }
      return true;
    });
  }, [entries, statusFilter, projectFilter, searchQuery]);

  // Pending count for approval tab badge
  const pendingQueueCount = useMemo(() => {
    return entries.filter((e) => e.status === "Submitted").length;
  }, [entries]);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#059669] text-white shadow-xl text-[13px] font-medium animate-slide-in">
          <Icon name="check_circle" size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-[26px] leading-[34px] font-bold text-[#111827]">
              Kê khai & Phê duyệt Timesheet
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#EDE9FE] text-[#7C3AED] border border-[#DDD6FE]">
              Giai đoạn 7
            </span>
          </div>
          <p className="text-[13px] text-[#6B7280] mt-1">
            Ghi nhận giờ làm dự án, theo dõi định mức tiêu chuẩn tuần (40h) &amp; luồng xét duyệt công việc đa vai trò.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5">
          {draftCount > 0 && (
            <button
              type="button"
              onClick={handleBatchSubmitWeek}
              className="px-3.5 py-2 rounded-lg border border-[#7C3AED] bg-white text-[#7C3AED] hover:bg-[#F5F3FF] text-[13px] font-medium transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Icon name="done_all" size={16} />
              <span>Nộp duyệt tuần ({draftCount} nháp)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleOpenCreate()}
            className="px-4 py-2 rounded-lg bg-[#7C3AED] text-white hover:bg-[#5B21B6] text-[13px] font-medium shadow-sm transition-all flex items-center gap-1.5"
          >
            <Icon name="add" size={16} />
            <span>Kê khai giờ làm</span>
          </button>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng giờ tuần */}
        <div className="bg-white rounded-xl p-4 border border-[#E5E7EB] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[12px] font-medium text-[#6B7280]">Tổng giờ tuần này</p>
            <p className="font-mono text-[24px] font-bold text-[#111827] mt-1">
              {(summary?.totalHours || 0).toFixed(1)}
              <span className="text-[13px] font-sans font-normal text-[#6B7280] ml-1">/ 40h</span>
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#6B7280]">
              <span className="font-semibold text-[#7C3AED]">
                {(((summary?.totalHours || 0) / 40) * 100).toFixed(0)}%
              </span>
              <span>đạt định mức chuẩn</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center shrink-0">
            <Icon name="schedule" size={22} />
          </div>
        </div>

        {/* Card 2: Giờ tính phí (Billable) */}
        <div className="bg-white rounded-xl p-4 border border-[#E5E7EB] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[12px] font-medium text-[#6B7280]">Giờ tính phí (Billable)</p>
            <p className="font-mono text-[24px] font-bold text-[#0D9488] mt-1">
              {(summary?.billableHours || 0).toFixed(1)}
              <span className="text-[13px] font-sans font-normal text-[#6B7280] ml-1">h</span>
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#0D9488]">
              <span className="font-semibold">
                {summary?.totalHours
                  ? (((summary.billableHours || 0) / summary.totalHours) * 100).toFixed(0)
                  : 0}
                %
              </span>
              <span>tỷ lệ phân bổ tính phí</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#F0FDFA] text-[#0D9488] flex items-center justify-center shrink-0">
            <Icon name="payments" size={22} />
          </div>
        </div>

        {/* Card 3: Chờ phê duyệt */}
        <div className="bg-white rounded-xl p-4 border border-[#E5E7EB] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[12px] font-medium text-[#6B7280]">Chờ phê duyệt</p>
            <p className="font-mono text-[24px] font-bold text-[#D97706] mt-1">
              {(summary?.pendingHours || 0).toFixed(1)}
              <span className="text-[13px] font-sans font-normal text-[#6B7280] ml-1">h</span>
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#6B7280]">
              <span>Đang chờ quản lý kiểm tra</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#FFFBEB] text-[#D97706] flex items-center justify-center shrink-0">
            <Icon name="hourglass_top" size={22} />
          </div>
        </div>

        {/* Card 4: Đã phê duyệt */}
        <div className="bg-white rounded-xl p-4 border border-[#E5E7EB] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[12px] font-medium text-[#6B7280]">Đã phê duyệt</p>
            <p className="font-mono text-[24px] font-bold text-[#059669] mt-1">
              {(summary?.approvedHours || 0).toFixed(1)}
              <span className="text-[13px] font-sans font-normal text-[#6B7280] ml-1">h</span>
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#059669]">
              <span className="font-semibold">Sẵn sàng chốt kỳ lương</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0">
            <Icon name="check_circle" size={22} />
          </div>
        </div>
      </div>

      {/* Toolbar: Week Navigation & View Tabs */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs p-4 flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Week Selector */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevWeek}
            className="w-8 h-8 rounded-lg border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-all"
            title="Tuần trước"
          >
            <Icon name="chevron_left" size={18} />
          </button>

          <div className="px-3 py-1.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] text-center">
            <span className="font-heading font-bold text-[14px] text-[#111827]">
              {formatDateVN(fromDateISO)} - {formatDateVN(toDateISO)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleNextWeek}
            className="w-8 h-8 rounded-lg border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-all"
            title="Tuần sau"
          >
            <Icon name="chevron_right" size={18} />
          </button>

          <button
            type="button"
            onClick={handleTodayWeek}
            className="px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-[#7C3AED] hover:bg-[#F5F3FF] transition-all"
          >
            Tuần này
          </button>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center p-1 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] text-[13px] font-medium">
          <button
            type="button"
            onClick={() => setViewMode("matrix")}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              viewMode === "matrix"
                ? "bg-white text-[#7C3AED] shadow-xs font-semibold"
                : "text-[#6B7280] hover:text-[#111827]"
            }`}
          >
            <Icon name="dashboard" size={15} />
            <span>Ma trận tuần (Grid)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              viewMode === "list"
                ? "bg-white text-[#7C3AED] shadow-xs font-semibold"
                : "text-[#6B7280] hover:text-[#111827]"
            }`}
          >
            <Icon name="description" size={15} />
            <span>Bảng kê chi tiết ({entries.length})</span>
          </button>

          {canReview && (
            <button
              type="button"
              onClick={() => setViewMode("queue")}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                viewMode === "queue"
                  ? "bg-white text-[#7C3AED] shadow-xs font-semibold"
                  : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              <Icon name="verified" size={15} />
              <span>Chờ duyệt</span>
              {pendingQueueCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[#D97706] text-white">
                  {pendingQueueCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-[13px]">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Tìm theo task, dự án hoặc nhân sự..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] text-[13px] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
          />
          <div className="absolute left-2.5 top-2.5 text-[#9CA3AF]">
            <Icon name="search" size={16} />
          </div>
        </div>

        {/* Filter Chips & Project Select */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Project Dropdown */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] text-[12px] font-medium focus:outline-none focus:border-[#7C3AED]"
          >
            <option value="ALL">Tất cả dự án</option>
            {distinctProjects.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Status Pills */}
          <div className="flex items-center gap-1 bg-[#F9FAFB] p-0.5 rounded-lg border border-[#E5E7EB]">
            {["ALL", "Approved", "Submitted", "Draft", "Rejected"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                  statusFilter === st
                    ? "bg-white text-[#7C3AED] shadow-xs font-semibold"
                    : "text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                {st === "ALL"
                  ? "Tất cả"
                  : st === "Approved"
                  ? "Đã duyệt"
                  : st === "Submitted"
                  ? "Chờ duyệt"
                  : st === "Draft"
                  ? "Nháp"
                  : "Từ chối"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 bg-white rounded-xl border border-[#E5E7EB]">
          <div className="w-8 h-8 border-3 border-[#7C3AED] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[13px] text-[#6B7280]">Đang đồng bộ dữ liệu timesheet...</span>
        </div>
      ) : errorMessage ? (
        <div className="p-6 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-center">
          <p className="font-semibold text-[15px]">Không thể tải timesheet</p>
          <p className="text-[13px] mt-1">{errorMessage}</p>
          <button
            type="button"
            onClick={loadData}
            className="mt-3 px-4 py-1.5 rounded-lg bg-[#DC2626] text-white text-[12px] font-medium hover:bg-[#B91C1C]"
          >
            Thử lại
          </button>
        </div>
      ) : viewMode === "matrix" ? (
        /* View 1: Weekly Matrix */
        <TimesheetWeeklyGrid
          days={weekDays}
          entries={filteredEntries}
          onOpenCreate={handleOpenCreate}
          onOpenEdit={handleOpenEdit}
          onOpenReview={handleOpenReview}
          canReview={canReview}
        />
      ) : (
        /* View 2: Detailed List / Table View & View 3: Queue */
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-[#E5E7EB] text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                  <th className="py-3 px-4">Ngày làm</th>
                  <th className="py-3 px-4">Nhân sự</th>
                  <th className="py-3 px-4">Dự án</th>
                  <th className="py-3 px-4">Nhiệm vụ / Task</th>
                  <th className="py-3 px-4 text-center">Giờ làm</th>
                  <th className="py-3 px-4 text-center">Tính phí</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4">Người duyệt</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-12 text-center text-[#9CA3AF] bg-[#FAFAFA]/50"
                    >
                      Không có bản ghi timesheet nào khớp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((item) => {
                    const st = STATUS_CONFIG[item.status] || STATUS_CONFIG.Draft;
                    const isOwner = item.employeeId === session?.employeeId;
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-[#F9FAFB] transition-colors"
                      >
                        {/* WorkDate */}
                        <td className="py-3 px-4 font-mono font-medium text-[#111827] whitespace-nowrap">
                          {formatDateVN(item.workDate)}
                        </td>

                        {/* Employee */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <p className="font-semibold text-[#111827]">
                            {item.employeeFullName}
                          </p>
                          <p className="text-[11px] font-mono text-[#6B7280]">
                            {item.employeeCode}
                            {item.departmentName ? ` • ${item.departmentName}` : ""}
                          </p>
                        </td>

                        {/* Project */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EDE9FE] text-[#7C3AED] border border-[#DDD6FE]">
                            {item.projectCode}
                          </span>
                          <p className="text-[11px] text-[#6B7280] mt-0.5 max-w-[160px] truncate">
                            {item.projectName}
                          </p>
                        </td>

                        {/* Task Title & Description */}
                        <td className="py-3 px-4 max-w-[260px]">
                          <p className="font-medium text-[#111827] truncate">
                            {item.taskTitle}
                          </p>
                          {item.description && (
                            <p className="text-[11px] text-[#6B7280] truncate mt-0.5">
                              {item.description}
                            </p>
                          )}
                          {item.rejectionReason && (
                            <p className="text-[11px] text-[#DC2626] mt-0.5 bg-[#FEF2F2] p-1 rounded">
                              Lý do: {item.rejectionReason}
                            </p>
                          )}
                        </td>

                        {/* Hours */}
                        <td className="py-3 px-4 text-center font-mono font-bold text-[#111827]">
                          {item.hoursWorked.toFixed(2)}h
                        </td>

                        {/* Billable */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              item.isBillable
                                ? "bg-[#F0FDFA] text-[#0D9488] border border-[#99F6E4]"
                                : "bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]"
                            }`}
                          >
                            {item.isBillable ? "Billable" : "Non-bill"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${st.bg} ${st.text} ${st.border}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}></span>
                            {st.label}
                          </span>
                        </td>

                        {/* Approver */}
                        <td className="py-3 px-4 text-[12px] text-[#6B7280] whitespace-nowrap">
                          {item.approverFullName ? (
                            <div>
                              <p className="font-medium text-[#111827]">
                                {item.approverFullName}
                              </p>
                              {item.approvedAt && (
                                <p className="text-[11px] text-[#9CA3AF]">
                                  {formatDateVN(item.approvedAt)}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#9CA3AF]">-</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Review action for Manager/HR */}
                            {canReview && item.status === "Submitted" && (
                              <button
                                type="button"
                                onClick={() => handleOpenReview(item)}
                                className="px-2.5 py-1 rounded-md bg-[#059669] text-white hover:bg-[#047857] text-[11px] font-medium transition-all shadow-xs"
                                title="Phê duyệt hoặc từ chối"
                              >
                                Xét duyệt
                              </button>
                            )}

                            {/* Edit action */}
                            {item.status !== "Approved" && (isOwner || canReview) && (
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(item)}
                                className="w-7 h-7 rounded-md border border-[#E5E7EB] text-[#4B5563] hover:text-[#7C3AED] hover:bg-[#F5F3FF] flex items-center justify-center transition-all"
                                title="Chỉnh sửa"
                              >
                                <Icon name="edit_square" size={14} />
                              </button>
                            )}

                            {/* Delete action */}
                            {(item.status !== "Approved" || hasRole("SUPER_ADMIN") || hasRole("HR_MANAGER")) && (
                              <button
                                type="button"
                                onClick={() => handleDeleteEntry(item)}
                                className="w-7 h-7 rounded-md border border-[#E5E7EB] text-[#DC2626] hover:bg-[#FEF2F2] flex items-center justify-center transition-all"
                                title="Xóa"
                              >
                                <Icon name="delete" size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Entry Modal */}
      <TimesheetEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        onSubmit={handleSubmitEntry}
        initialEntry={selectedEntryForEdit}
        defaultDate={entryModalDefaultDate}
      />

      {/* Review Modal */}
      <TimesheetReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        entry={selectedEntryForReview}
        onReview={handleReviewEntry}
      />
    </div>
  );
}
