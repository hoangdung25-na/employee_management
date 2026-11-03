import React from "react";
import Link from "next/link";

export default function DashboardOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-[32px] leading-[40px] font-bold text-[#111827]">
          Tổng quan Nhân sự
        </h1>
        <p className="text-[14px] leading-[22px] text-[#6B7280] mt-1">
          Bảng điều khiển dành cho Ban Giám Đốc và Phòng Nhân sự .
        </p>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-6 shadow-xs">


        <Link
          href="/employees"
          className="inline-flex items-center justify-center h-10 px-4 rounded-[8px] bg-[#7C3AED] text-white text-[14px] font-medium hover:bg-[#5B21B6] transition-colors"
        >
          Đi tới Danh sách Thành viên Đội ngũ →
        </Link>
      </div>
    </div>
  );
}

