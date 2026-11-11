"use client";

import React, { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { PerformanceSummaryMetrics } from "../types/performance";
import { formatCurrencyVND } from "@/lib/utils/format";

interface PerformanceSummaryCardsProps {
  metrics: PerformanceSummaryMetrics | null;
  loading?: boolean;
}

export function PerformanceSummaryCards({ metrics, loading }: PerformanceSummaryCardsProps) {
  const [showBonus, setShowBonus] = useState(false);

  const totalEmps = metrics?.totalEmployees ?? 248;
  const avgCompletion = metrics?.averageCompletionPercent ?? 88.6;
  const passRate = metrics?.passAndExcellentRate ?? 84.2;
  const rankA = metrics?.rankACount ?? 38;
  const rankB = metrics?.rankBCount ?? 171;
  const bonusAmount = metrics?.projectedBonusFund ?? 1485000000;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Card 1: Tổng nhân sự đánh giá */}
      <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
            Tổng nhân sự đánh giá
          </span>
          <span className="w-8 h-8 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center">
            <Icon name="groups" size={18} />
          </span>
        </div>
        <div className="mt-4">
          <div className="text-[26px] leading-[32px] font-heading font-bold text-[#111827]">
            {loading ? "..." : totalEmps}{" "}
            <span className="text-[13px] font-normal text-[#6B7280]">nhân sự</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[#0D9488] text-[12px] font-medium">
            <Icon name="check_circle" size={14} />
            <span>100% đã thiết lập mục tiêu</span>
          </div>
        </div>
      </div>

      {/* Card 2: Tiến độ hoàn thành TB */}
      <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
            Tiến độ hoàn thành TB
          </span>
          <span className="w-8 h-8 rounded-lg bg-[#F0FDFA] text-[#0D9488] flex items-center justify-center">
            <Icon name="trending_up" size={18} />
          </span>
        </div>
        <div className="mt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-[26px] leading-[32px] font-heading font-bold text-[#111827]">
              {loading ? "..." : `${avgCompletion}%`}
            </span>
            <span className="text-[12px] text-[#0D9488] font-medium">+4.2% so với Q3</span>
          </div>
          <div className="w-full h-2 bg-[#F3F4F6] rounded-full overflow-hidden mt-2.5">
            <div
              className="h-full bg-[#0D9488] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(avgCompletion, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Card 3: Tỷ lệ Đạt & Xuất sắc */}
      <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
            Tỷ lệ Đạt & Xuất sắc
          </span>
          <span className="w-8 h-8 rounded-lg bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center">
            <Icon name="military_tech" size={18} />
          </span>
        </div>
        <div className="mt-4">
          <div className="text-[26px] leading-[32px] font-heading font-bold text-[#111827]">
            {loading ? "..." : `${passRate}%`}
          </div>
          <div className="flex items-center gap-2 mt-2 text-[12px] text-[#6B7280]">
            <span className="font-semibold text-[#7C3AED]">Loại A: {rankA}</span>
            <span>•</span>
            <span className="font-semibold text-[#0D9488]">Loại B: {rankB}</span>
          </div>
        </div>
      </div>

      {/* Card 4: Quỹ thưởng KPI dự kiến */}
      <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
            Quỹ thưởng KPI dự kiến
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-[#F0FDFA] text-[#0D9488] border border-[#99F6E4] whitespace-nowrap shrink-0">
            <Icon name="attachment" size={12} />
            Bảng lương T12
          </span>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <span className="text-[24px] leading-[32px] font-heading font-bold text-[#111827] tracking-tight">
              {showBonus ? formatCurrencyVND(bonusAmount) : "•••••••••••• đ"}
            </span>
            <button
              type="button"
              onClick={() => setShowBonus(!showBonus)}
              className="w-7 h-7 rounded-lg text-[#9CA3AF] hover:text-[#111827] flex items-center justify-center hover:bg-[#F3F4F6] transition-colors"
              title={showBonus ? "Ẩn số tiền" : "Hiện số tiền"}
            >
              <Icon name={showBonus ? "visibility_off" : "visibility"} size={16} />
            </button>
          </div>
          <div className="text-[12px] text-[#6B7280] mt-1.5">
            Chi trả tự động sau ngày 25/12/2026
          </div>
        </div>
      </div>
    </div>
  );
}
