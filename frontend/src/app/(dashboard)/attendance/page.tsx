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
  { label: string; bg: string; text: string; dot: string }
> = {
  Present: {
    label: "Đúng giờ",
    bg: "bg-[#ECFDF5]",
    text: "text-[#059669]",
    dot: "bg-[#059669]",
  },
  Late: {
    label: "Đi muộn",
    bg: "bg-[#FFFBEB]",
    text: "text-[#D97706]",
    dot: "bg-[#D97706]",
  },
  EarlyLeave: {
    label: "Về sớm",
    bg: "bg-[#FEF3C7]",
    text: "text-[#B45309]",
    dot: "bg-[#B45309]",
  },
  HalfDay: {
    label: "Nửa ngày",
    bg: "bg-[#EFF6FF]",
    text: "text-[#2563EB]",
    dot: "bg-[#2563EB]",
  },
  Absent: {
    label: "Vắng mặt",
    bg: "bg-[#FEF2F2]",
    text: "text-[#DC2626]",
    dot: "bg-[#DC2626]",
  },
  OnLeave: {
    label: "Nghỉ phép",
    bg: "bg-[#F3E8FF]",
    text: "text-[#7C3AED]",
    dot: "bg-[#7C3AED]",
  },
};

export default function AttendancePage() {
  const [todayStatus, setTodayStatus] = useState<TodayAttendanceStatus | null>(null);
  const [history, setHistory] = useState<AttendanceHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPunching, setIsPunching] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Month & Year Filter
  const [selectedMonth, setSelectedMonth] = useState<number>(11);
  const [selectedYear, setSelectedYear] = useState<number>(2026);

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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-[24px] font-bold text-[#111827]">
            Chấm công & Ca làm việc
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            Cổng ghi nhận vào/ra ca làm việc thời gian thực và theo dõi bảng công hàng tháng.
          </p>
        </div>
      </div>

      {/* Real-time Clock Punch Widget */}
      <div className="bg-gradient-to-br from-[#4C1D95] via-[#5B21B6] to-[#7C3AED] rounded-[20px] p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        {/* Background Decorative Rings */}
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
                    ? new Date(todayStatus.checkInTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
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
                    ? new Date(todayStatus.checkOutTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
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
                  <span>{isPunching ? "Đang xử lý..." : todayStatus?.hasCheckedOut ? "CẬP NHẬT CHECK-OUT" : "CHECK-OUT HẾT CA"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Metrics Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0">
            <Icon name="check_circle" size={24} />
          </div>
          <div>
            <p className="text-[12px] font-medium text-[#6B7280]">Ngày đi làm đúng giờ</p>
            <p className="font-heading text-[22px] font-bold text-[#111827] mt-0.5">
              {history?.totalPresent ?? 0}
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] bg-[#FFFBEB] text-[#D97706] flex items-center justify-center shrink-0">
            <Icon name="warning" size={24} />
          </div>
          <div>
            <p className="text-[12px] font-medium text-[#6B7280]">Số lần đi muộn</p>
            <p className="font-heading text-[22px] font-bold text-[#D97706] mt-0.5">
              {history?.totalLate ?? 0}
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center shrink-0">
            <Icon name="more_time" size={24} />
          </div>
          <div>
            <p className="text-[12px] font-medium text-[#6B7280]">Số lần về sớm</p>
            <p className="font-heading text-[22px] font-bold text-[#DC2626] mt-0.5">
              {history?.totalEarlyLeave ?? 0}
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center shrink-0">
            <Icon name="trending_up" size={24} />
          </div>
          <div>
            <p className="text-[12px] font-medium text-[#6B7280]">Tổng giờ công lũy kế</p>
            <p className="font-heading text-[22px] font-bold text-[#7C3AED] mt-0.5">
              {history?.totalWorkingHours ?? 0} <span className="text-[13px] font-normal text-[#6B7280]">giờ</span>
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Attendance Table & Filters */}
      <div className="bg-white border border-[#E5E7EB] rounded-[16px] shadow-xs overflow-hidden">
        {/* Table Filter Header */}
        <div className="p-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-heading text-[16px] font-semibold text-[#111827]">
              Bảng chấm công chi tiết theo ngày
            </h2>
            <p className="text-[12px] text-[#6B7280] mt-0.5">
              Tháng {selectedMonth}/{selectedYear} ({history?.items.length ?? 0} bản ghi)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              className="h-9 px-3 border border-[#E5E7EB] rounded-[8px] text-[13px] bg-white text-[#374151] focus:border-[#7C3AED] focus:outline-none"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  Tháng {m}
                </option>
              ))}
            </select>

            <select
              className="h-9 px-3 border border-[#E5E7EB] rounded-[8px] text-[13px] bg-white text-[#374151] focus:border-[#7C3AED] focus:outline-none"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  Năm {y}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={loadData}
              className="h-9 px-3 rounded-[8px] border border-[#E5E7EB] text-[12px] font-medium text-[#4B5563] hover:bg-[#F9FAFB] transition-colors cursor-pointer"
            >
              Làm mới
            </button>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="p-8 space-y-3 animate-pulse">
            <div className="h-6 bg-[#F3F4F6] rounded w-1/4" />
            <div className="h-10 bg-[#F3F4F6] rounded" />
            <div className="h-10 bg-[#F3F4F6] rounded" />
            <div className="h-10 bg-[#F3F4F6] rounded" />
          </div>
        )}

        {/* Error state */}
        {!isLoading && errorMessage && (
          <div className="p-6 text-center text-[#EF4444]">
            <p className="font-semibold text-[14px]">{errorMessage}</p>
            <button
              type="button"
              onClick={loadData}
              className="mt-3 px-4 py-1.5 rounded-[8px] bg-[#EF4444] text-white text-[12px] font-medium cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !errorMessage && (!history?.items || history.items.length === 0) && (
          <div className="p-12 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#F3F4F6] text-[#9CA3AF] flex items-center justify-center">
              <Icon name="more_time" size={24} />
            </div>
            <p className="font-semibold text-[15px] text-[#111827]">
              Không có dữ liệu chấm công cho tháng {selectedMonth}/{selectedYear}
            </p>
            <p className="text-[13px] text-[#6B7280] mt-1">
              Bạn chưa có lượt chấm công nào được ghi nhận trong khoảng thời gian này.
            </p>
          </div>
        )}

        {/* Table content */}
        {!isLoading && !errorMessage && history?.items && history.items.length > 0 && (
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
                  <th className="px-6 py-3">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-[13px] text-[#111827]">
                {history.items.map((row) => {
                  const badge = STATUS_BADGES[row.status] || STATUS_BADGES.Present;
                  return (
                    <tr key={row.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-[#111827] whitespace-nowrap">
                        {formatDateVN(row.attendanceDate)}
                      </td>
                      <td className="px-6 py-4 text-[#4B5563] whitespace-nowrap">
                        {row.shiftName}
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold text-[#111827] whitespace-nowrap">
                        {row.checkInTime
                          ? new Date(row.checkInTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
                          : "--:--"}
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold text-[#111827] whitespace-nowrap">
                        {row.checkOutTime
                          ? new Date(row.checkOutTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
                          : "--:--"}
                      </td>
                      <td className="px-6 py-4 font-mono whitespace-nowrap">
                        <span className="font-bold text-[#7C3AED]">{row.workingHours}</span> giờ
                        {row.overtimeHours > 0 && (
                          <span className="text-[11px] text-[#059669] ml-1.5 font-semibold">
                            (+{row.overtimeHours}h OT)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[12px]">
                        {row.lateMinutes > 0 && (
                          <span className="text-[#D97706] font-medium">Muộn {row.lateMinutes}p</span>
                        )}
                        {row.earlyLeaveMinutes > 0 && (
                          <span className="text-[#DC2626] font-medium ml-2">Về sớm {row.earlyLeaveMinutes}p</span>
                        )}
                        {row.lateMinutes === 0 && row.earlyLeaveMinutes === 0 && (
                          <span className="text-[#9CA3AF]">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${badge.bg} ${badge.text}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#6B7280] text-[12px] max-w-xs truncate">
                        {row.notes || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
