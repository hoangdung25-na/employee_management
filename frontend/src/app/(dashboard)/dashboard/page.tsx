"use client";

import React from "react";
import Link from "next/link";
import { MetricCard } from "@/components/ui/MetricCard";
import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function DashboardOverviewPage() {
  const pendingApprovals = [
    {
      id: "REQ-001",
      name: "Nguyễn Văn Hùng",
      dept: "Công nghệ Thông tin",
      type: "Nghỉ phép năm (2 ngày)",
      date: "04/11 - 05/11/2026",
      status: "Probation",
    },
    {
      id: "REQ-002",
      name: "Trần Thị Mai",
      dept: "Khối Kinh doanh",
      type: "Đăng ký làm thêm ngoài giờ (OT 3h)",
      date: "03/11/2026",
      status: "Probation",
    },
    {
      id: "REQ-003",
      name: "Đỗ Quốc Bảo",
      dept: "Tài chính - Kế toán",
      type: "Làm việc từ xa (Work from home)",
      date: "06/11/2026",
      status: "Probation",
    },
  ];

  const upcomingInterviews = [
    {
      id: "INT-1",
      candidate: "Trần Minh Quân",
      position: "Senior Fullstack Engineer",
      time: "10:00 - Hôm nay",
      room: "Phòng họp Sonatus A",
    },
    {
      id: "INT-2",
      candidate: "Phạm Thu Trang",
      position: "Product Designer (UI/UX)",
      time: "14:30 - Ngày mai",
      room: "Google Meet Online",
    },
    {
      id: "INT-3",
      candidate: "Hoàng Đức Anh",
      position: "Chuyên viên Tuyển dụng",
      time: "09:00 - Thứ Sáu",
      room: "Phòng họp Sonatus B",
    },
  ];

  const departmentDistribution = [
    { name: "Khối Công nghệ & Sản phẩm", count: 52, percentage: 40.6, color: "bg-[#7C3AED]" },
    { name: "Khối Kinh doanh & Tiếp thị", count: 38, percentage: 29.7, color: "bg-[#0D9488]" },
    { name: "Khối Tài chính - Kế toán", count: 18, percentage: 14.1, color: "bg-[#F59E0B]" },
    { name: "Khối Vận hành & Hành chính", count: 12, percentage: 9.4, color: "bg-[#3B82F6]" },
    { name: "Khối Nhân sự (HRM)", count: 8, percentage: 6.2, color: "bg-[#EC4899]" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-[28px] lg:text-[32px] leading-[40px] font-bold text-[#111827] tracking-tight">
            Tổng quan Nhân sự
          </h1>
          <p className="text-[14px] leading-[22px] text-[#6B7280] mt-0.5">
            Bảng điều khiển chỉ số nhân sự và luồng công việc dành cho Ban Giám Đốc và Bộ phận HR.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/employees"
            className="h-10 px-4 rounded-[8px] bg-[#7C3AED] hover:bg-[#5B21B6] text-white text-[13px] font-medium shadow-xs flex items-center gap-2 transition-colors"
          >
            <Icon name="add" size={16} />
            <span>Thêm nhân sự mới</span>
          </Link>
        </div>
      </div>

      {/* 1. Metric Cards Grid (4 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Tổng quy mô nhân sự"
          value="128"
          icon="groups"
          trend={{ value: "+4.2%", isPositive: true, label: "so với tháng trước" }}
          subtitle="120 chính thức • 8 thử việc"
        />

        <MetricCard
          title="Tỷ lệ đạt thử việc"
          value="94.6%"
          icon="verified"
          iconBgClass="bg-[#ECFDF5]"
          iconColorClass="text-[#059669]"
          trend={{ value: "+1.8%", isPositive: true, label: "chu kỳ Q3" }}
          subtitle="Mục tiêu KPI > 90%"
        />

        <MetricCard
          title="Đơn từ chờ duyệt"
          value="6"
          icon="more_time"
          iconBgClass="bg-[#FFFBEB]"
          iconColorClass="text-[#D97706]"
          subtitle="Cần phê duyệt trong ngày"
        />

        <MetricCard
          title="Quỹ lương ước tính"
          value="2.85 tỷ ₫"
          icon="payments"
          iconBgClass="bg-[#F0FDFA]"
          iconColorClass="text-[#0D9488]"
          trend={{ value: "+2.1%", isPositive: true, label: "T11/2026" }}
          subtitle="Đã chốt công ngày 31"
        />
      </div>

      {/* 2. Bento Grid: 7 cols left, 5 cols right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Department Distribution Card */}
          <div className="bg-white border border-[#E5E7EB] rounded-[16px] shadow-xs p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[8px] bg-[#EDE9FE] flex items-center justify-center text-[#7C3AED]">
                  <Icon name="apartment" size={18} />
                </div>
                <div>
                  <h2 className="font-heading text-[18px] leading-[26px] font-semibold text-[#111827]">
                    Cơ cấu Phân bổ theo Khối Phòng ban
                  </h2>
                  <p className="text-[12px] text-[#6B7280]">
                    Tổng hợp 128 thành viên trên 5 khối chức năng chính
                  </p>
                </div>
              </div>

              <Link
                href="/departments"
                className="text-[12px] font-semibold text-[#7C3AED] hover:text-[#5B21B6] transition-colors"
              >
                Chi tiết →
              </Link>
            </div>

            {/* Department Progress Bars */}
            <div className="space-y-3.5 pt-1">
              {departmentDistribution.map((dept) => (
                <div key={dept.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-medium text-[#111827]">{dept.name}</span>
                    <span className="font-mono text-[#6B7280]">
                      <strong className="text-[#111827]">{dept.count}</strong> người ({dept.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${dept.color}`}
                      style={{ width: `${dept.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Approvals Table */}
          <div className="bg-white border border-[#E5E7EB] rounded-[16px] shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[8px] bg-[#FFFBEB] flex items-center justify-center text-[#D97706]">
                  <Icon name="more_time" size={18} />
                </div>
                <h2 className="font-heading text-[18px] leading-[26px] font-semibold text-[#111827]">
                  Đơn từ cần phê duyệt gấp
                </h2>
              </div>

              <span className="text-[12px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
                3 việc cần xử lý
              </span>
            </div>

            <div className="divide-y divide-[#E5E7EB] border border-[#E5E7EB] rounded-[12px] overflow-hidden">
              {pendingApprovals.map((req) => (
                <div
                  key={req.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F9FAFB] transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[13px] text-[#111827]">
                        {req.name}
                      </span>
                      <span className="text-[12px] text-[#6B7280]">({req.dept})</span>
                    </div>
                    <p className="text-[12px] text-[#7C3AED] font-medium mt-0.5">
                      {req.type} • <span className="font-mono text-[#6B7280]">{req.date}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      className="px-3 py-1 rounded-[6px] bg-[#ECFDF5] text-[#059669] text-[12px] font-semibold hover:bg-[#D1FAE5] transition-colors cursor-pointer"
                    >
                      Duyệt ngay
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1 rounded-[6px] bg-[#F3F4F6] text-[#6B7280] text-[12px] font-semibold hover:bg-[#E5E7EB] transition-colors cursor-pointer"
                    >
                      Xem đơn
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Upcoming Interviews & Recruitment */}
          <div className="bg-white border border-[#E5E7EB] rounded-[16px] shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[8px] bg-[#F0FDFA] flex items-center justify-center text-[#0D9488]">
                  <Icon name="person_search" size={18} />
                </div>
                <h2 className="font-heading text-[18px] leading-[26px] font-semibold text-[#111827]">
                  Lịch phỏng vấn hôm nay
                </h2>
              </div>

              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#EDE9FE] text-[#7C3AED]">
                Tuyển dụng
              </span>
            </div>

            <div className="space-y-3">
              {upcomingInterviews.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-[10px] p-3 flex flex-col gap-1 hover:border-[#DDD6FE] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[13px] text-[#111827]">
                      {item.candidate}
                    </span>
                    <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-[#EDE9FE] text-[#7C3AED]">
                      {item.time}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#6B7280]">{item.position}</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#9CA3AF] mt-0.5">
                    <Icon name="location_on" size={12} className="text-[#0D9488]" />
                    <span>{item.room}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-white border border-[#E5E7EB] rounded-[16px] shadow-xs p-6 space-y-4">
            <h2 className="font-heading text-[16px] font-semibold text-[#111827]">
              Lối tắt tác vụ nhanh
            </h2>

            <div className="grid grid-cols-2 gap-3 text-[13px]">
              <Link
                href="/employees"
                className="p-3 rounded-[10px] bg-[#F9FAFB] border border-[#E5E7EB] hover:bg-[#F5F3FF] hover:border-[#DDD6FE] hover:text-[#7C3AED] transition-all flex flex-col items-center justify-center gap-2 text-center"
              >
                <Icon name="groups" size={20} className="text-[#7C3AED]" />
                <span className="font-medium text-[#111827]">Danh bạ nhân viên</span>
              </Link>

              <Link
                href="/departments"
                className="p-3 rounded-[10px] bg-[#F9FAFB] border border-[#E5E7EB] hover:bg-[#F5F3FF] hover:border-[#DDD6FE] hover:text-[#7C3AED] transition-all flex flex-col items-center justify-center gap-2 text-center"
              >
                <Icon name="apartment" size={20} className="text-[#0D9488]" />
                <span className="font-medium text-[#111827]">Sơ đồ phòng ban</span>
              </Link>

              <Link
                href="/onboarding"
                className="p-3 rounded-[10px] bg-[#F9FAFB] border border-[#E5E7EB] hover:bg-[#F5F3FF] hover:border-[#DDD6FE] hover:text-[#7C3AED] transition-all flex flex-col items-center justify-center gap-2 text-center"
              >
                <Icon name="flag" size={20} className="text-[#F59E0B]" />
                <span className="font-medium text-[#111827]">Tiếp nhận / Thôi việc</span>
              </Link>

              <div
                className="p-3 rounded-[10px] bg-[#F9FAFB] border border-[#E5E7EB] opacity-60 flex flex-col items-center justify-center gap-2 text-center cursor-not-allowed"
                title="Tính năng đang được phát triển trong Sprint tiếp theo"
              >
                <Icon name="payments" size={20} className="text-[#6B7280]" />
                <span className="font-medium text-[#6B7280]">Bảng tính lương</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
