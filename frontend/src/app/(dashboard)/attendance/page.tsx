"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { formatDateVN } from "@/lib/utils/format";
import {
  AttendanceHistoryResponse,
  TodayAttendanceStatus,
} from "@/features/attendance/types/attendance";
import {
  checkIn,
  checkOut,
  getAttendanceHistory,
  getTodayAttendance,
} from "@/features/attendance/services/attendanceService";

const STATUS_BADGES: Record<
  string,
  { label: string; bg: string; text: string; dot: string; code: string }
> = {
  Present: {
    label: "Đúng giờ",
    bg: "bg-[#ECFDF5]",
    text: "text-[#059669]",
    dot: "bg-[#059669]",
    code: "X",
  },
  Late: {
    label: "Đi muộn",
    bg: "bg-[#FFFBEB]",
    text: "text-[#D97706]",
    dot: "bg-[#D97706]",
    code: "M",
  },
  EarlyLeave: {
    label: "Về sớm",
    bg: "bg-[#FEF3C7]",
    text: "text-[#B45309]",
    dot: "bg-[#B45309]",
    code: "VS",
  },
  HalfDay: {
    label: "Nửa ngày",
    bg: "bg-[#EFF6FF]",
    text: "text-[#2563EB]",
    dot: "bg-[#2563EB]",
    code: "1/2",
  },
  Absent: {
    label: "Vắng mặt",
    bg: "bg-[#FEF2F2]",
    text: "text-[#DC2626]",
    dot: "bg-[#DC2626]",
    code: "V",
  },
  OnLeave: {
    label: "Nghỉ phép",
    bg: "bg-[#F3E8FF]",
    text: "text-[#7C3AED]",
    dot: "bg-[#7C3AED]",
    code: "P",
  },
};

export default function AttendancePage() {
  const [todayStatus, setTodayStatus] = useState<TodayAttendanceStatus | null>(null);
  const [history, setHistory] = useState<AttendanceHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPunching, setIsPunching] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active View Tab: 'matrix' (Stitch Matrix Table) | 'punch' (Clock Punch & Daily Log)
  const [viewMode, setViewMode] = useState<"matrix" | "punch">("matrix");

  // Month & Year Filter
  const [selectedMonth, setSelectedMonth] = useState<number>(11);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Selected Matrix Cell Popover State
  const [selectedDayPopover, setSelectedDayPopover] = useState<{
    day: number;
    weekday: string;
    status: string;
    checkInTime?: string;
    checkOutTime?: string;
    lateMinutes?: number;
    device?: string;
  } | null>(null);

  // Real-time Clock
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDateString, setCurrentDateString] = useState<string>("");

  useEffect(() => {
    const now = new Date();
    setSelectedMonth(now.getMonth() + 1);
    setSelectedYear(now.getFullYear());

    const updateTime = () => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString("vi-VN", { hour12: false }));
      setCurrentDateString(
        d.toLocaleDateString("vi-VN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [todayData, historyData] = await Promise.all([
        getTodayAttendance(),
        getAttendanceHistory({ month: selectedMonth, year: selectedYear }),
      ]);
      setTodayStatus(todayData);
      setHistory(historyData);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Không thể tải dữ liệu chấm công. Vui lòng thử lại."
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleCheckIn = async () => {
    setIsPunching(true);
    try {
      const result = await checkIn();
      setToastMessage(
        `Check-in thành công lúc ${
          result.checkInTime ? new Date(result.checkInTime).toLocaleTimeString("vi-VN") : ""
        }! ${result.lateMinutes > 0 ? `(Đi muộn ${result.lateMinutes} phút)` : "Đúng giờ chuẩn!"}`
      );
      setTimeout(() => setToastMessage(null), 5000);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Check-in không thành công.");
    } finally {
      setIsPunching(false);
    }
  };

  const handleCheckOut = async () => {
    setIsPunching(true);
    try {
      const result = await checkOut();
      setToastMessage(
        `Check-out thành công lúc ${
          result.checkOutTime ? new Date(result.checkOutTime).toLocaleTimeString("vi-VN") : ""
        }! Tổng giờ công: ${result.workingHours} giờ.`
      );
      setTimeout(() => setToastMessage(null), 5000);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Check-out không thành công.");
    } finally {
      setIsPunching(false);
    }
  };

  // Generate days in selected month
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(selectedYear, selectedMonth - 1, i + 1);
    const dayOfWeek = d.getDay(); // 0: CN, 1: T2, ... 6: T7
    const label =
      dayOfWeek === 0
        ? "CN"
        : `T${dayOfWeek + 1}`;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    return { day: i + 1, label, isWeekend };
  });

  // Map history records by date number (e.g. "2026-11-04" -> day 4)
  const historyByDay = React.useMemo(() => {
    const map: Record<number, any> = {};
    if (history?.items) {
      for (const item of history.items) {
        const d = new Date(item.attendanceDate).getDate();
        map[d] = item;
      }
    }
    return map;
  }, [history?.items]);

  return (
    <div className="space-y-6">
      {/* Toast message */}
      {toastMessage && (
        <div className="p-4 rounded-[12px] bg-[#ECFDF5] border border-[#059669] text-[#065F46] flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
            <p className="text-[14px] font-medium">{toastMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-[13px] font-bold text-[#065F46] hover:opacity-75 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Breadcrumb & Top Bar Navigation Info (Stitch HRFlow Screen 1) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280]">
          <span className="hover:text-[#7C3AED] transition-colors cursor-pointer">Chấm công</span>
          <Icon name="chevron_right" size={14} className="text-[#9CA3AF]" />
          <span className="font-medium text-[#111827]">Bảng chấm công tổng hợp</span>
          <Icon name="chevron_right" size={14} className="text-[#9CA3AF]" />
          <span className="text-[#7C3AED] font-semibold">
            Tháng {selectedMonth}/{selectedYear}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[#4B5563] text-[12px] font-mono">
          <span className="inline-block w-2 h-2 rounded-full bg-[#0D9488] animate-pulse" />
          <span>Hệ thống chấm công trực tuyến: Ổn định</span>
        </div>
      </div>

      {/* Header & Primary Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-heading text-[26px] font-bold text-[#111827] tracking-tight">
              Bảng chấm công tổng hợp
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDE9FE] text-[#5B21B6] text-[12px] font-medium">
              <Icon name="calendar" size={14} />
              Kỳ công: 01/{selectedMonth.toString().padStart(2, "0")}/{selectedYear} –{" "}
              {daysInMonth}/{selectedMonth.toString().padStart(2, "0")}/{selectedYear}
            </span>
          </div>
          <p className="text-[13px] text-[#6B7280]">
            Tổng hợp dữ liệu hiện diện, đi muộn, vắng mặt và số giờ tăng ca của toàn bộ nhân viên công ty.
          </p>
        </div>

        {/* Actions Group */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {/* View Mode Switcher */}
          <div className="inline-flex p-1 bg-[#F3F4F6] rounded-[10px] border border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => setViewMode("matrix")}
              className={`px-3 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all cursor-pointer ${
                viewMode === "matrix"
                  ? "bg-white text-[#7C3AED] shadow-xs"
                  : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              Bảng Matrix 30 ngày
            </button>
            <button
              type="button"
              onClick={() => setViewMode("punch")}
              className={`px-3 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all cursor-pointer ${
                viewMode === "punch"
                  ? "bg-white text-[#7C3AED] shadow-xs"
                  : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              Cổng Check-in & Nhật ký
            </button>
          </div>

          <button
            type="button"
            onClick={() => alert("Đang xuất file Excel bảng chấm công...")}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-[10px] bg-white border border-[#E5E7EB] text-[#111827] hover:bg-[#F9FAFB] transition-all shadow-xs text-[13px] font-medium cursor-pointer"
          >
            <Icon name="download" size={16} className="text-[#0D9488]" />
            <span>Xuất Excel</span>
          </button>
          <button
            type="button"
            onClick={() => alert(`Đã chốt công tháng ${selectedMonth}/${selectedYear} thành công!`)}
            className="inline-flex items-center gap-2 px-5 h-10 rounded-[10px] bg-[#7C3AED] hover:bg-[#6D28D9] text-white transition-all shadow-xs text-[13px] font-medium cursor-pointer"
          >
            <Icon name="lock" size={16} />
            <span>Chốt công tháng {selectedMonth}</span>
          </button>
        </div>
      </div>

      {/* Filter & Month Navigation Bar */}
      <div className="bg-white p-4 rounded-[16px] border border-[#E5E7EB] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Stepper Selector */}
          <div className="inline-flex items-center bg-[#F9FAFB] border border-[#E5E7EB] rounded-[10px] p-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[#6B7280] hover:bg-[#EDE9FE] hover:text-[#7C3AED] transition-all cursor-pointer"
              title="Tháng trước"
            >
              <Icon name="chevron_left" size={16} />
            </button>
            <div className="px-3 flex items-center gap-1.5 font-heading text-[14px] font-semibold text-[#111827]">
              <Icon name="calendar" size={16} className="text-[#7C3AED]" />
              <span>
                Tháng {selectedMonth}/{selectedYear}
              </span>
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[#6B7280] hover:bg-[#EDE9FE] hover:text-[#7C3AED] transition-all cursor-pointer"
              title="Tháng sau"
            >
              <Icon name="chevron_right" size={16} />
            </button>
          </div>

          {/* Department Filter */}
          <div className="relative min-w-[200px]">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full h-10 pl-3 pr-8 bg-[#F9FAFB] border border-[#E5E7EB] rounded-[10px] text-[13px] text-[#111827] focus:outline-none focus:border-[#7C3AED] cursor-pointer"
            >
              <option value="all">Khối / Phòng ban: Tất cả</option>
              <option value="tech">Khối Công nghệ & Dữ liệu (IT)</option>
              <option value="finance">Khối Tài chính & Kế toán</option>
              <option value="hr">Khối Vận hành & Nhân sự</option>
              <option value="business">Khối Tiếp thị & Tăng trưởng</option>
            </select>
          </div>

          {/* Status Quick Filter */}
          <div className="relative min-w-[160px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 pl-3 pr-8 bg-[#F9FAFB] border border-[#E5E7EB] rounded-[10px] text-[13px] text-[#111827] focus:outline-none focus:border-[#7C3AED] cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="late">Có lượt đi muộn</option>
              <option value="leave">Nghỉ phép</option>
              <option value="absent">Vắng mặt</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <span className="absolute left-3 top-2.5 text-[#9CA3AF]">
            <Icon name="search" size={18} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên hoặc mã NV..."
            className="w-full h-10 pl-10 pr-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-[10px] text-[13px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all"
          />
        </div>
      </div>

      {/* Information Notification Banner (Stitch Screen 1) */}
      <div className="bg-[#EDE9FE]/50 border border-[#DDD6FE] rounded-[16px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center shrink-0">
            <Icon name="info" size={22} />
          </div>
          <div className="min-w-0 text-[#111827]">
            <p className="text-[13px] font-medium leading-relaxed">
              Dữ liệu đồng bộ tự động từ máy chấm công vân tay, ứng dụng mobile GPS và thiết bị nhận diện FaceID lúc{" "}
              <strong className="text-[#7C3AED] font-bold">08:30 hôm nay</strong>.
            </p>
            <p className="text-[12px] text-[#6B7280]">
              Thời hạn chốt công dự kiến và chuyển giao bảng lương:{" "}
              <strong className="text-[#111827]">05/12/2026</strong>. Vui lòng hoàn tất phê duyệt giải trình trước ngày 03/12.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={loadData}
          className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-white border border-[#DDD6FE] hover:bg-[#F3E8FF] text-[12px] font-semibold text-[#7C3AED] shadow-xs transition-all cursor-pointer"
        >
          <Icon name="sync" size={15} />
          <span>Đồng bộ lại</span>
        </button>
      </div>

      {/* 4 Summary KPI Cards (Directly matching Stitch Screen 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Standard Working Days */}
        <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-[#6B7280]">Ngày công chuẩn</span>
            <div className="w-9 h-9 rounded-[10px] bg-[#EDE9FE] flex items-center justify-center text-[#7C3AED]">
              <Icon name="calendar" size={18} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-[28px] text-[#111827] font-bold">
                {daysInMonth - 8}
              </span>
              <span className="text-[13px] text-[#6B7280]">ngày</span>
            </div>
            <p className="text-[12px] text-[#6B7280] mt-1">
              Định mức làm việc tháng {selectedMonth}/{selectedYear}
            </p>
          </div>
          <div className="mt-4 pt-3 bg-[#F9FAFB] rounded-[8px] px-3 py-1.5 flex items-center justify-between text-[12px]">
            <span className="text-[#6B7280]">Số ngày nghỉ T7/CN:</span>
            <span className="font-semibold text-[#111827]">8 ngày</span>
          </div>
        </div>

        {/* Card 2: Total Late Instances */}
        <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-[#6B7280]">Tổng lượt đi muộn</span>
            <div className="w-9 h-9 rounded-[10px] bg-[#FEF3C7] flex items-center justify-center text-[#D97706]">
              <Icon name="warning" size={18} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-[28px] text-[#D97706] font-bold">
                {history?.totalLate ?? 0}
              </span>
              <span className="text-[13px] text-[#6B7280]">lượt</span>
            </div>
            <p className="text-[12px] text-[#059669] mt-1 flex items-center gap-1 font-medium">
              <span>Đang kiểm soát tốt</span>
            </p>
          </div>
          <div className="mt-4 pt-3 bg-[#F9FAFB] rounded-[8px] px-3 py-1.5 flex items-center justify-between text-[12px]">
            <span className="text-[#6B7280]">Tổng giờ công lũy kế:</span>
            <span className="font-semibold text-[#D97706]">
              {history?.totalWorkingHours ?? 0} giờ
            </span>
          </div>
        </div>

        {/* Card 3: Approved Leaves */}
        <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-[#6B7280]">Lượt nghỉ phép</span>
            <div className="w-9 h-9 rounded-[10px] bg-[#CCFBF1] flex items-center justify-center text-[#0D9488]">
              <Icon name="beach_access" size={18} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-[28px] text-[#111827] font-bold">
                {history?.items.filter((i) => i.status === "OnLeave").length ?? 0}
              </span>
              <span className="text-[13px] text-[#6B7280]">ngày</span>
            </div>
            <p className="text-[12px] text-[#6B7280] mt-1">
              Phép năm có hưởng lương & nghỉ bù
            </p>
          </div>
          <div className="mt-4 pt-3 bg-[#F9FAFB] rounded-[8px] px-3 py-1.5 flex items-center justify-between text-[12px]">
            <span className="text-[#6B7280]">Tỷ lệ chuyên cần:</span>
            <span className="font-semibold text-[#0D9488]">98.2%</span>
          </div>
        </div>

        {/* Card 4: Unexplained Violations */}
        <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-[#6B7280]">Chưa giải trình</span>
            <span className="px-2 py-0.5 rounded-full bg-[#FEE2E2] text-[#DC2626] text-[11px] font-bold">
              Cần xử lý
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-[28px] text-[#DC2626] font-bold">
                {history?.items.filter((i) => i.status === "Absent").length ?? 0}
              </span>
              <span className="text-[13px] text-[#6B7280]">trường hợp</span>
            </div>
            <p className="text-[12px] text-[#DC2626] mt-1 flex items-center gap-1">
              <Icon name="warning" size={14} />
              Quá hạn chưa gửi giải trình
            </p>
          </div>
          <div className="mt-4 pt-3 bg-[#F9FAFB] rounded-[8px] px-3 py-1.5 flex items-center justify-between text-[12px]">
            <span className="text-[#6B7280]">Hạn nhắc nhở:</span>
            <span className="font-semibold text-[#111827]">17:00 chiều nay</span>
          </div>
        </div>
      </div>

      {/* MATRIX TABLE VIEW (Exact layout from Stitch Screen 1) */}
      {viewMode === "matrix" && (
        <div className="bg-white border border-[#E5E7EB] rounded-[16px] shadow-xs overflow-hidden relative">
          {/* Table Subheader */}
          <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3 bg-[#F9FAFB] border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2.5 text-[#111827]">
              <h3 className="font-heading text-[16px] font-bold">
                Bảng điểm danh tháng {selectedMonth}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-[#EDE9FE] text-[#7C3AED] text-[11px] font-mono font-bold">
                Toàn công ty ({history?.items.length ?? 0} lượt ghi nhận)
              </span>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-[#6B7280]">
              <Icon name="info" size={16} className="text-[#7C3AED]" />
              <span>Nhấp chuột vào ô trạng thái để xem chi tiết log quẹt thẻ hoặc điều chỉnh công</span>
            </div>
          </div>

          {/* Scrollable Matrix Table */}
          <div className="overflow-x-auto relative w-full">
            <table className="w-full text-left border-collapse select-none">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider h-12">
                  {/* Sticky Left Employee Column */}
                  <th className="sticky left-0 z-20 bg-[#F9FAFB] px-4 py-3 min-w-[260px] shadow-[4px_0_10px_-2px_rgba(0,0,0,0.06)] border-r border-[#E5E7EB]">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded text-[#7C3AED] focus:ring-[#7C3AED]/25 cursor-pointer accent-[#7C3AED]"
                      />
                      <span>Nhân viên</span>
                    </div>
                  </th>

                  {/* Days 1 to N Columns */}
                  {daysArray.map((d) => (
                    <th
                      key={d.day}
                      className={`text-center px-1.5 py-2 w-9 min-w-9 border-r border-[#E5E7EB]/70 ${
                        d.isWeekend
                          ? "bg-[#F3F4F6] text-[#9CA3AF]"
                          : "text-[#374151]"
                      }`}
                    >
                      <span className={`block text-[10px] ${d.isWeekend ? "text-[#DC2626] font-bold" : "text-[#6B7280]"}`}>
                        {d.label}
                      </span>
                      <span className="block text-[12px] font-bold mt-0.5">{d.day}</span>
                    </th>
                  ))}

                  {/* Sticky Right Calculation Columns */}
                  <th className="sticky right-[210px] z-20 bg-[#F9FAFB] px-3 py-3 text-center min-w-[70px] shadow-[-4px_0_10px_-2px_rgba(0,0,0,0.04)] border-l border-[#E5E7EB]">
                    Tổng công
                  </th>
                  <th className="sticky right-[140px] z-20 bg-[#F9FAFB] px-3 py-3 text-center min-w-[70px] border-r border-[#E5E7EB]">
                    Đi muộn
                  </th>
                  <th className="sticky right-[70px] z-20 bg-[#F9FAFB] px-3 py-3 text-center min-w-[70px] border-r border-[#E5E7EB]">
                    Tăng ca
                  </th>
                  <th className="sticky right-0 z-20 bg-[#F9FAFB] px-3 py-3 text-center min-w-[70px]">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E5E7EB] text-[13px]">
                {/* Employee Row: Current User */}
                <tr className="hover:bg-[#F9FAFB] transition-colors group">
                  {/* Sticky Employee Left Column */}
                  <td className="sticky left-0 z-10 bg-white group-hover:bg-[#F9FAFB] px-4 py-3 min-w-[260px] shadow-[4px_0_10px_-2px_rgba(0,0,0,0.06)] border-r border-[#E5E7EB]">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-4 h-4 rounded text-[#7C3AED] focus:ring-[#7C3AED]/25 cursor-pointer accent-[#7C3AED]"
                      />
                      <div className="w-8 h-8 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center font-bold text-[12px] shrink-0">
                        NV
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-[#111827] truncate">
                          {todayStatus?.employeeName || "Nhân viên của bạn"}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
                          <span className="font-mono text-[#7C3AED]">
                            NV-2026-001
                          </span>
                          <span>•</span>
                          <span className="truncate">Chính thức</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Day cells 1 to N */}
                  {daysArray.map((d) => {
                    const record = historyByDay[d.day];
                    const badge = record ? STATUS_BADGES[record.status] : null;

                    return (
                      <td
                        key={d.day}
                        onClick={() => {
                          if (record) {
                            setSelectedDayPopover({
                              day: d.day,
                              weekday: d.label,
                              status: record.status,
                              checkInTime: record.checkInTime,
                              checkOutTime: record.checkOutTime,
                              lateMinutes: record.lateMinutes,
                              device: "FaceID Tầng 12",
                            });
                          }
                        }}
                        className={`text-center px-1 py-2 border-r border-[#E5E7EB]/50 transition-colors ${
                          d.isWeekend
                            ? "bg-[#F9FAFB]/70 text-[#9CA3AF]"
                            : record
                            ? "cursor-pointer hover:bg-[#EDE9FE]/50"
                            : ""
                        }`}
                      >
                        {d.isWeekend ? (
                          <span className="text-[#9CA3AF] text-[11px]">–</span>
                        ) : record ? (
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-[6px] font-bold text-[11px] shadow-2xs ${
                              badge ? `${badge.bg} ${badge.text}` : "bg-[#ECFDF5] text-[#059669]"
                            } ${record.lateMinutes > 0 ? "ring-1 ring-[#D97706]" : ""}`}
                          >
                            {badge?.code || "X"}
                          </span>
                        ) : (
                          <span className="text-[#D1D5DB] text-[11px]">·</span>
                        )}
                      </td>
                    );
                  })}

                  {/* Sticky Right Stats */}
                  <td className="sticky right-[210px] z-10 bg-white group-hover:bg-[#F9FAFB] px-3 py-3 text-center font-bold text-[#111827] shadow-[-4px_0_10px_-2px_rgba(0,0,0,0.04)] border-l border-[#E5E7EB]">
                    {history?.totalPresent ?? 0}
                  </td>
                  <td className="sticky right-[140px] z-10 bg-white group-hover:bg-[#F9FAFB] px-3 py-3 text-center font-bold text-[#D97706] border-r border-[#E5E7EB]">
                    {history?.totalLate ?? 0}
                  </td>
                  <td className="sticky right-[70px] z-10 bg-white group-hover:bg-[#F9FAFB] px-3 py-3 text-center font-bold text-[#0D9488] border-r border-[#E5E7EB]">
                    0h
                  </td>
                  <td className="sticky right-0 z-10 bg-white group-hover:bg-[#F9FAFB] px-3 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => setViewMode("punch")}
                      className="px-2.5 py-1 text-[11px] font-semibold text-[#7C3AED] hover:bg-[#EDE9FE] rounded-[6px] transition-colors cursor-pointer"
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Interactive Cell Popover Modal */}
          {selectedDayPopover && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
              <div className="bg-white rounded-[16px] max-w-sm w-full shadow-2xl border border-[#E5E7EB] overflow-hidden">
                <div className="p-4 bg-[#EDE9FE]/50 border-b border-[#DDD6FE] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name="calendar" size={18} className="text-[#7C3AED]" />
                    <span className="font-heading font-bold text-[#111827]">
                      Ngày {selectedDayPopover.day}/{selectedMonth}/{selectedYear} ({selectedDayPopover.weekday})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDayPopover(null)}
                    className="w-7 h-7 rounded-full text-[#6B7280] hover:bg-white flex items-center justify-center cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-5 space-y-3 text-[13px]">
                  <div className="flex items-center justify-between p-3 bg-[#F9FAFB] rounded-[10px]">
                    <span className="text-[#6B7280]">Trạng thái:</span>
                    <span className="font-bold text-[#111827]">
                      {STATUS_BADGES[selectedDayPopover.status]?.label || selectedDayPopover.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 bg-[#F9FAFB] rounded-[10px]">
                      <p className="text-[11px] text-[#6B7280]">Giờ vào thực tế</p>
                      <p className="font-mono text-[16px] font-bold text-[#111827] mt-1">
                        {selectedDayPopover.checkInTime
                          ? new Date(selectedDayPopover.checkInTime).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "--:--"}
                      </p>
                    </div>

                    <div className="p-3 bg-[#F9FAFB] rounded-[10px]">
                      <p className="text-[11px] text-[#6B7280]">Giờ ra thực tế</p>
                      <p className="font-mono text-[16px] font-bold text-[#111827] mt-1">
                        {selectedDayPopover.checkOutTime
                          ? new Date(selectedDayPopover.checkOutTime).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "--:--"}
                      </p>
                    </div>
                  </div>

                  {selectedDayPopover.lateMinutes ? (
                    <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] rounded-[10px] flex items-center gap-2">
                      <Icon name="warning" size={16} />
                      <span>Ghi nhận đi muộn {selectedDayPopover.lateMinutes} phút.</span>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between text-[12px] text-[#6B7280] pt-2">
                    <span>Thiết bị quẹt thẻ:</span>
                    <span className="font-mono text-[#111827] font-medium">FaceID Tầng 12</span>
                  </div>
                </div>

                <div className="p-4 bg-[#F9FAFB] border-t border-[#E5E7EB] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDayPopover(null)}
                    className="px-4 py-2 rounded-[8px] border border-[#E5E7EB] text-[13px] font-medium text-[#374151] hover:bg-white cursor-pointer"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      alert("Mở form đề xuất giải trình chấm công");
                      setSelectedDayPopover(null);
                    }}
                    className="px-4 py-2 rounded-[8px] bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[13px] font-medium shadow-xs cursor-pointer"
                  >
                    Gửi giải trình
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CLOCK PUNCH & DAILY LOG VIEW */}
      {viewMode === "punch" && (
        <>
          {/* Real-time Clock Punch Widget */}
          <div className="bg-gradient-to-br from-[#4C1D95] via-[#5B21B6] to-[#7C3AED] rounded-[20px] p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute right-20 bottom-0 -mb-16 w-56 h-56 rounded-full bg-white/5 pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Digital Clock & Date */}
              <div className="lg:col-span-7 space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-[12px] font-medium backdrop-blur-xs">
                  <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
                  <span className="capitalize">{currentDateString || "Đang tải ngày..."}</span>
                </div>

                <div className="font-mono text-[48px] sm:text-[60px] font-extrabold tracking-tight leading-none text-white drop-shadow-sm">
                  {currentTime || "--:--:--"}
                </div>

                {todayStatus?.assignedShift && (
                  <div className="flex items-center gap-3 text-white/90 text-[13px] pt-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/20 font-medium">
                      <Icon name="more_time" size={14} />
                      <span>{todayStatus.assignedShift.shiftName}</span>
                    </span>
                    <span>
                      Chuẩn: {todayStatus.assignedShift.startTime.slice(0, 5)} - {todayStatus.assignedShift.endTime.slice(0, 5)}
                    </span>
                    <span>(Cho phép trễ: {todayStatus.assignedShift.gracePeriodMinutes}p)</span>
                  </div>
                )}
              </div>

              {/* Right Column: Check-in / Check-out Action Card */}
              <div className="lg:col-span-5 bg-white/10 backdrop-blur-md rounded-[16px] p-6 border border-white/20 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-white/80">Trạng thái ca hôm nay</span>
                  {todayStatus && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white">
                      {todayStatus.hasCheckedOut
                        ? "Đã hoàn thành ca"
                        : todayStatus.hasCheckedIn
                        ? "Đang trong ca làm việc"
                        : "Chưa vào ca"}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  <div className="bg-white/10 rounded-[10px] p-3">
                    <p className="text-white/70">Giờ vào (Check-in)</p>
                    <p className="text-[16px] font-mono font-bold mt-0.5">
                      {todayStatus?.checkInTime
                        ? new Date(todayStatus.checkInTime).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "--:--"}
                    </p>
                    {todayStatus?.lateMinutes ? (
                      <p className="text-[#FBBF24] text-[11px] mt-0.5 font-medium">
                        Muộn {todayStatus.lateMinutes} phút
                      </p>
                    ) : null}
                  </div>

                  <div className="bg-white/10 rounded-[10px] p-3">
                    <p className="text-white/70">Giờ ra (Check-out)</p>
                    <p className="text-[16px] font-mono font-bold mt-0.5">
                      {todayStatus?.checkOutTime
                        ? new Date(todayStatus.checkOutTime).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "--:--"}
                    </p>
                    {todayStatus?.workingHours ? (
                      <p className="text-[#34D399] text-[11px] mt-0.5 font-medium">
                        {todayStatus.workingHours} giờ làm
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center gap-3">
                  {todayStatus?.canCheckIn ? (
                    <button
                      type="button"
                      disabled={isPunching}
                      onClick={handleCheckIn}
                      className="w-full h-12 rounded-[10px] bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-[14px] shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] cursor-pointer"
                    >
                      <Icon name="check_circle" size={18} />
                      <span>{isPunching ? "Đang xử lý..." : "CHECK-IN VÀO CA"}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isPunching}
                      onClick={handleCheckOut}
                      className="w-full h-12 rounded-[10px] bg-white text-[#7C3AED] hover:bg-white/95 font-semibold text-[14px] shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] cursor-pointer"
                    >
                      <Icon name="more_time" size={18} />
                      <span>
                        {isPunching
                          ? "Đang xử lý..."
                          : todayStatus?.hasCheckedOut
                          ? "CẬP NHẬT CHECK-OUT"
                          : "CHECK-OUT HẾT CA"}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Detailed Log Table */}
          <div className="bg-white border border-[#E5E7EB] rounded-[16px] shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="font-heading text-[16px] font-semibold text-[#111827]">
                  Nhật ký chấm công chi tiết theo ngày
                </h2>
                <p className="text-[12px] text-[#6B7280] mt-0.5">
                  Tháng {selectedMonth}/{selectedYear} ({history?.items.length ?? 0} bản ghi)
                </p>
              </div>

              <button
                type="button"
                onClick={loadData}
                className="h-9 px-3.5 rounded-[8px] border border-[#E5E7EB] text-[12px] font-medium text-[#4B5563] hover:bg-[#F9FAFB] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Icon name="sync" size={14} />
                <span>Làm mới</span>
              </button>
            </div>

            {isLoading && (
              <div className="p-8 space-y-3 animate-pulse">
                <div className="h-6 bg-[#F3F4F6] rounded w-1/4" />
                <div className="h-10 bg-[#F3F4F6] rounded" />
                <div className="h-10 bg-[#F3F4F6] rounded" />
              </div>
            )}

            {!isLoading && (!history?.items || history.items.length === 0) && (
              <div className="p-12 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#F3F4F6] text-[#9CA3AF] flex items-center justify-center">
                  <Icon name="more_time" size={24} />
                </div>
                <p className="font-semibold text-[15px] text-[#111827]">
                  Không có dữ liệu chấm công cho tháng {selectedMonth}/{selectedYear}
                </p>
              </div>
            )}

            {!isLoading && history?.items && history.items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FAFAFA] border-b border-[#E5E7EB] text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider h-11">
                      <th className="px-6 py-3">Ngày</th>
                      <th className="px-6 py-3">Ca làm việc</th>
                      <th className="px-6 py-3">Giờ vào</th>
                      <th className="px-6 py-3">Giờ ra</th>
                      <th className="px-6 py-3">Số giờ làm</th>
                      <th className="px-6 py-3">Đi muộn / Về sớm</th>
                      <th className="px-6 py-3">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] text-[13px] text-[#111827]">
                    {history.items.map((row) => {
                      const badge = STATUS_BADGES[row.status] || STATUS_BADGES.Present;
                      return (
                        <tr key={row.id} className="hover:bg-[#F9FAFB] transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-[#111827]">
                            {formatDateVN(row.attendanceDate)}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-medium text-[#374151]">{row.shiftName}</span>
                          </td>
                          <td className="px-6 py-4 font-mono text-[#059669]">
                            {row.checkInTime
                              ? new Date(row.checkInTime).toLocaleTimeString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "--:--"}
                          </td>
                          <td className="px-6 py-4 font-mono text-[#2563EB]">
                            {row.checkOutTime
                              ? new Date(row.checkOutTime).toLocaleTimeString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "--:--"}
                          </td>
                          <td className="px-6 py-4 font-semibold text-[#111827]">
                            {row.workingHours} giờ
                          </td>
                          <td className="px-6 py-4">
                            {row.lateMinutes > 0 && (
                              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-[#FFFBEB] text-[#D97706] mr-1">
                                Trễ {row.lateMinutes}p
                              </span>
                            )}
                            {row.earlyLeaveMinutes > 0 && (
                              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-[#FEF3C7] text-[#B45309]">
                                Sớm {row.earlyLeaveMinutes}p
                              </span>
                            )}
                            {row.lateMinutes === 0 && row.earlyLeaveMinutes === 0 && (
                              <span className="text-[12px] text-[#059669]">Chuẩn giờ</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium ${badge.bg} ${badge.text}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                              {badge.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
