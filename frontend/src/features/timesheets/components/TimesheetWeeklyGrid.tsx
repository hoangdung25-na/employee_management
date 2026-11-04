"use client";

import React from "react";
import { Icon } from "@/components/ui/Icon";
import { TimesheetEntry } from "../types/timesheet";

interface WeekDayInfo {
  date: string; // 'YYYY-MM-DD'
  dayName: string; // 'T2', 'T3', ...
  dayNumber: number; // 2, 3, 4, ...
  isToday: boolean;
  isWeekend: boolean;
}

interface TimesheetWeeklyGridProps {
  days: WeekDayInfo[];
  entries: TimesheetEntry[];
  onOpenCreate: (defaultDate?: string, projectCode?: string, projectName?: string, taskTitle?: string) => void;
  onOpenEdit: (entry: TimesheetEntry) => void;
  onOpenReview?: (entry: TimesheetEntry) => void;
  canReview?: boolean;
}

export function TimesheetWeeklyGrid({
  days,
  entries,
  onOpenCreate,
  onOpenEdit,
  onOpenReview,
  canReview,
}: TimesheetWeeklyGridProps) {
  // Group entries by ProjectCode + TaskTitle
  interface RowGroup {
    key: string;
    projectCode: string;
    projectName: string;
    taskTitle: string;
    isBillable: boolean;
    entriesByDate: Record<string, TimesheetEntry>;
    totalHours: number;
  }

  const rowGroupsMap = new Map<string, RowGroup>();

  entries.forEach((entry) => {
    const key = `${entry.projectCode}:::${entry.taskTitle}`;
    if (!rowGroupsMap.has(key)) {
      rowGroupsMap.set(key, {
        key,
        projectCode: entry.projectCode,
        projectName: entry.projectName,
        taskTitle: entry.taskTitle,
        isBillable: entry.isBillable,
        entriesByDate: {},
        totalHours: 0,
      });
    }

    const group = rowGroupsMap.get(key)!;
    group.entriesByDate[entry.workDate] = entry;
    group.totalHours += entry.hoursWorked;
  });

  const rowGroups = Array.from(rowGroupsMap.values());

  // Calculate daily totals
  const dailyTotals: Record<string, number> = {};
  days.forEach((d) => {
    dailyTotals[d.date] = entries
      .filter((e) => e.workDate === d.date)
      .reduce((sum, e) => sum + e.hoursWorked, 0);
  });

  const weeklyGrandTotal = entries.reduce((sum, e) => sum + e.hoursWorked, 0);

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]";
      case "Submitted":
        return "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]";
      case "Draft":
        return "bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]";
      case "Rejected":
        return "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]";
      default:
        return "bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col">
      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          {/* Table Header */}
          <thead>
            <tr className="bg-[#FAFAFA] border-b border-[#E5E7EB] text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">
              <th className="py-3 px-4 w-[340px]">Dự án & Nhiệm vụ</th>
              {days.map((d) => (
                <th
                  key={d.date}
                  className={`py-3 px-2 text-center w-[95px] transition-colors ${
                    d.isToday
                      ? "bg-[#EDE9FE] text-[#7C3AED] font-bold"
                      : d.isWeekend
                      ? "bg-[#F9FAFB] text-[#9CA3AF]"
                      : ""
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] font-medium">{d.dayName}</span>
                    <span
                      className={`w-7 h-7 mt-0.5 rounded-full flex items-center justify-center font-mono text-[13px] ${
                        d.isToday
                          ? "bg-[#7C3AED] text-white font-bold shadow-sm"
                          : "text-[#111827]"
                      }`}
                    >
                      {d.dayNumber}
                    </span>
                  </div>
                </th>
              ))}
              <th className="py-3 px-4 text-right w-[110px] font-mono">
                Tổng giờ
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[#E5E7EB] text-[13px]">
            {rowGroups.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="py-12 text-center text-[#9CA3AF] bg-[#FAFAFA]/50"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center">
                      <Icon name="schedule" size={24} />
                    </div>
                    <p className="font-medium text-[#111827]">
                      Chưa có dòng kê khai giờ làm nào trong tuần này
                    </p>
                    <p className="text-[12px] text-[#6B7280]">
                      Nhấn nút bên dưới hoặc chọn ngày để bắt đầu ghi nhận công việc.
                    </p>
                    <button
                      type="button"
                      onClick={() => onOpenCreate(days[0]?.date)}
                      className="mt-2 px-4 py-2 rounded-lg bg-[#7C3AED] text-white font-medium text-[13px] hover:bg-[#5B21B6] transition-all flex items-center gap-1.5"
                    >
                      <Icon name="add" size={16} />
                      <span>Kê khai giờ làm đầu tiên</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              rowGroups.map((group) => (
                <tr
                  key={group.key}
                  className="hover:bg-[#F9FAFB] transition-colors group"
                >
                  {/* Project & Task Column */}
                  <td className="py-3 px-4">
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EDE9FE] text-[#7C3AED] shrink-0 border border-[#DDD6FE]">
                        {group.projectCode}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[#111827] truncate">
                          {group.taskTitle}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#6B7280]">
                          <span className="truncate">{group.projectName}</span>
                          {group.isBillable && (
                            <span className="text-[#0D9488] font-medium shrink-0">
                              • Billable
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 7 Days Columns */}
                  {days.map((d) => {
                    const entry = group.entriesByDate[d.date];
                    return (
                      <td
                        key={d.date}
                        className={`py-2 px-1 text-center align-middle ${
                          d.isToday ? "bg-[#EDE9FE]/20" : ""
                        }`}
                      >
                        {entry ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (canReview && entry.status === "Submitted" && onOpenReview) {
                                onOpenReview(entry);
                              } else {
                                onOpenEdit(entry);
                              }
                            }}
                            title={`${entry.taskTitle} (${entry.hoursWorked}h) - Trạng thái: ${entry.status}${entry.description ? `\nGhi chú: ${entry.description}` : ""}`}
                            className={`w-full py-1.5 px-1 rounded-lg border font-mono font-bold text-[12px] shadow-xs transition-all hover:scale-105 ${getStatusBadgeStyle(
                              entry.status
                            )}`}
                          >
                            <span>{entry.hoursWorked.toFixed(1)}h</span>
                            <span className="block text-[9px] font-normal opacity-80 uppercase tracking-tighter">
                              {entry.status === "Approved"
                                ? "Đã duyệt"
                                : entry.status === "Submitted"
                                ? "Chờ duyệt"
                                : entry.status === "Draft"
                                ? "Nháp"
                                : "Từ chối"}
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              onOpenCreate(
                                d.date,
                                group.projectCode,
                                group.projectName,
                                group.taskTitle
                              )
                            }
                            className="w-full py-2 rounded-lg text-transparent group-hover:text-[#9CA3AF] hover:!text-[#7C3AED] hover:bg-[#EDE9FE] transition-all flex items-center justify-center"
                            title={`Ghi giờ cho ${d.dayName} (${d.date})`}
                          >
                            <Icon name="add" size={14} />
                          </button>
                        )}
                      </td>
                    );
                  })}

                  {/* Row Total */}
                  <td className="py-3 px-4 text-right font-mono font-bold text-[14px] text-[#111827]">
                    {group.totalHours.toFixed(1)}h
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* Table Footer: Daily Totals */}
          {rowGroups.length > 0 && (
            <tfoot>
              <tr className="bg-[#FAFAFA] border-t-2 border-[#E5E7EB] font-mono text-[13px] font-bold">
                <td className="py-3 px-4 text-[#111827] uppercase text-[12px] font-sans">
                  Tổng giờ theo ngày
                </td>
                {days.map((d) => {
                  const total = dailyTotals[d.date] || 0;
                  return (
                    <td
                      key={d.date}
                      className={`py-3 px-1 text-center ${
                        d.isToday ? "bg-[#EDE9FE] text-[#7C3AED]" : "text-[#111827]"
                      }`}
                    >
                      <span className={total > 8 ? "text-[#D97706]" : ""}>
                        {total > 0 ? `${total.toFixed(1)}h` : "-"}
                      </span>
                    </td>
                  );
                })}
                <td className="py-3 px-4 text-right text-[15px] text-[#7C3AED]">
                  {weeklyGrandTotal.toFixed(1)}h
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Quick Legend & Status Summary */}
      <div className="px-5 py-3 border-t border-[#E5E7EB] bg-[#FAFAFA] flex flex-wrap items-center justify-between gap-3 text-[12px] text-[#6B7280]">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-[#111827]">Trạng thái:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#059669]"></span>
            <span>Đã phê duyệt (Approved)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]"></span>
            <span>Chờ duyệt (Submitted)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#9CA3AF]"></span>
            <span>Bản nháp (Draft)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]"></span>
            <span>Từ chối (Rejected)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[12px]">
          <span>Định mức tiêu chuẩn tuần: <strong>40.0h</strong></span>
          <span>•</span>
          <span className={weeklyGrandTotal >= 40 ? "text-[#059669] font-bold" : "text-[#D97706]"}>
            {((weeklyGrandTotal / 40) * 100).toFixed(0)}% hoàn thành
          </span>
        </div>
      </div>
    </div>
  );
}

