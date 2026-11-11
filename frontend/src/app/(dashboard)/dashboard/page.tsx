"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MetricCard } from "@/components/ui/MetricCard";
import { Icon } from "@/components/ui/Icon";
import { analyticsService } from "@/features/analytics/services/analyticsService";
import { HrAnalyticsDashboard } from "@/features/analytics/types/analytics";
import { formatCurrencyVND, formatDateVN } from "@/lib/utils/format";
import { getLeaveRequests } from "@/features/leaves/services/leaveService";
import { getTimesheets } from "@/features/timesheets/services/timesheetService";

interface PendingApproval {
  id: string;
  name: string;
  dept: string;
  type: string;
  date: string;
  link: string;
}

export default function DashboardOverviewPage() {
  const [analytics, setAnalytics] = useState<HrAnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [loadingApprovals, setLoadingApprovals] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await analyticsService.getDashboard();
        setAnalytics(data);
      } catch (err) {
        console.error("Failed to load HR analytics data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  useEffect(() => {
    const fetchPendingApprovals = async () => {
      try {
        setLoadingApprovals(true);
        const [leavesRes, timesheetsRes] = await Promise.allSettled([
          getLeaveRequests({ status: "Pending" }),
          getTimesheets({ status: "Submitted", pageSize: 5 }),
        ]);

        const items: PendingApproval[] = [];

        if (leavesRes.status === "fulfilled" && Array.isArray(leavesRes.value)) {
          for (const req of leavesRes.value) {
            items.push({
              id: `leave-${req.id}`,
              name: req.employeeName,
              dept: req.departmentName || "Phòng Nhân Sự",
              type: `Đơn xin nghỉ: ${req.leaveTypeName} (${req.totalDays} ngày)`,
              date: `${formatDateVN(req.startDate)} – ${formatDateVN(req.endDate)}`,
              link: "/leaves",
            });
          }
        }

        if (timesheetsRes.status === "fulfilled" && timesheetsRes.value?.items) {
          for (const ts of timesheetsRes.value.items) {
            items.push({
              id: `timesheet-${ts.id}`,
              name: ts.employeeFullName,
              dept: ts.departmentName || ts.projectName || "Dự án",
              type: `Kê khai công việc: ${ts.taskTitle || ts.projectName} (${ts.hoursWorked}h)`,
              date: formatDateVN(ts.workDate),
              link: "/timesheets",
            });
          }
        }

        setPendingApprovals(items);
      } catch (err) {
        console.error("Failed to load pending approvals", err);
      } finally {
        setLoadingApprovals(false);
      }
    };

    fetchPendingApprovals();
  }, []);

  const upcomingInterviews = [
    {
      id: "INT-1",
      candidate: "Trần Minh Quân",
      position: "Kỹ sư Phần mềm Cao cấp",
      time: "10:00 - Hôm nay",
      room: "Phòng họp A",
    },
    {
      id: "INT-2",
      candidate: "Phạm Thu Trang",
      position: "Chuyên viên Thiết kế Sản phẩm",
      time: "14:30 - Ngày mai",
      room: "Phỏng vấn trực tuyến",
    },
    {
      id: "INT-3",
      candidate: "Hoàng Đức Anh",
      position: "Chuyên viên Tuyển dụng",
      time: "09:00 - Thứ Sáu",
      room: "Phòng họp B",
    },
  ];

  // Dynamic values or defaults
  const totalHeadcount = analytics?.totalActiveHeadcount ?? 128;
  const probationCount = analytics?.totalProbationCount ?? 8;
  const officialCount = totalHeadcount - probationCount;
  const salaryFundStr = analytics?.totalActiveMonthlySalary
    ? formatCurrencyVND(analytics.totalActiveMonthlySalary)
    : "2.85 tỷ ₫";
  const avgKpi = analytics?.averageKpiScore ?? 88.6;
  const completedTrainings = analytics?.totalCompletedTrainings ?? 14;

  const departmentDistribution =
    analytics && analytics.departmentBreakdown.length > 0
      ? analytics.departmentBreakdown.map((dept, i) => {
          const colors = [
            "bg-[#7C3AED]",
            "bg-[#0D9488]",
            "bg-[#F59E0B]",
            "bg-[#3B82F6]",
            "bg-[#EC4899]",
          ];
          const total = analytics.totalActiveHeadcount || 1;
          const pct = Math.round((dept.activeHeadcount / total) * 100);
          return {
            name: dept.departmentName,
            count: dept.activeHeadcount,
            percentage: pct,
            color: colors[i % colors.length],
          };
        })
      : [
          {
            name: "Khối Công nghệ & Sản phẩm",
            count: 52,
            percentage: 40.6,
            color: "bg-[#7C3AED]",
          },
          {
            name: "Khối Kinh doanh & Tiếp thị",
            count: 38,
            percentage: 29.7,
            color: "bg-[#0D9488]",
          },
          {
            name: "Khối Tài chính - Kế toán",
            count: 18,
            percentage: 14.1,
            color: "bg-[#F59E0B]",
          },
          {
            name: "Khối Vận hành & Hành chính",
            count: 12,
            percentage: 9.4,
            color: "bg-[#3B82F6]",
          },
          {
            name: "Phòng Nhân sự",
            count: 8,
            percentage: 6.2,
            color: "bg-[#EC4899]",
          },
        ];

  const topPerformers = useMemo(() => {
    if (!analytics?.topPerformers) return [];
    return analytics.topPerformers
      .filter(
        (p) =>
          (p.latestKpiScore ?? 0) >= 80 &&
          (p.latestRatingRank === "A" || p.latestRatingRank === "B")
      )
      .slice(0, 5);
  }, [analytics]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-[28px] lg:text-[32px] leading-[40px] font-bold text-[#111827] tracking-tight">
            Tổng quan Nhân sự
          </h1>
          <p className="text-[14px] leading-[22px] text-[#6B7280] mt-0.5">
            Theo dõi biến động nhân sự, kết quả đánh giá KPI và tình hình đào tạo toàn công ty.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/performance"
            className="h-10 px-4 rounded-[8px] border border-[#DDD6FE] bg-[#F5F3FF] hover:bg-[#EDE9FE] text-[#7C3AED] text-[13px] font-semibold flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <Icon name="trending_up" size={16} />
            <span>Kỳ đánh giá KPI</span>
          </Link>
          <Link
            href="/employees"
            className="h-10 px-4 rounded-[8px] bg-[#7C3AED] hover:bg-[#5B21B6] text-white text-[13px] font-semibold shadow-xs flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <Icon name="add" size={16} />
            <span>Thêm nhân sự mới</span>
          </Link>
        </div>
      </div>

      {/* 1. Metric Cards Grid (4 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <MetricCard
          title="Tổng quy mô nhân sự"
          value={loading ? "..." : String(totalHeadcount)}
          icon="groups"
          trend={{ value: "+4.2%", isPositive: true, label: "so với tháng trước" }}
          subtitle={`${officialCount} chính thức • ${probationCount} thử việc`}
        />

        <MetricCard
          title="Điểm KPI trung bình"
          value={loading ? "..." : `${avgKpi}/100`}
          icon="military_tech"
          iconBgClass="bg-[#EDE9FE]"
          iconColorClass="text-[#7C3AED]"
          trend={{ value: "+3.5%", isPositive: true, label: "kỳ Q4/2026" }}
          subtitle={`Hạng A: ${analytics?.rankACount ?? 38} • Hạng B: ${analytics?.rankBCount ?? 171}`}
        />

        <MetricCard
          title="Khóa đào tạo hoàn thành"
          value={loading ? "..." : `${completedTrainings} lượt`}
          icon="verified"
          iconBgClass="bg-[#ECFDF5]"
          iconColorClass="text-[#059669]"
          trend={{ value: "+100%", isPositive: true, label: "trong tháng" }}
          subtitle="Đạt yêu cầu chuyên môn"
        />

        <MetricCard
          title="Quỹ lương tháng dự kiến"
          value={loading ? "..." : salaryFundStr}
          icon="payments"
          iconBgClass="bg-[#F0FDFA]"
          iconColorClass="text-[#0D9488]"
          trend={{ value: "+2.1%", isPositive: true, label: "T11/2026" }}
          subtitle="Tổng lương cơ bản"
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
                <h2 className="font-heading text-[18px] leading-[26px] font-semibold text-[#111827]">
                  Cơ cấu nhân sự theo phòng ban
                </h2>
              </div>

              <Link
                href="/departments"
                className="text-[12px] font-semibold text-[#7C3AED] hover:text-[#5B21B6] transition-colors whitespace-nowrap"
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
                  Đơn từ chờ phê duyệt
                </h2>
              </div>

              <Link
                href="/leaves"
                className="text-[12px] font-semibold px-2.5 py-0.5 rounded-full bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] hover:bg-[#FEF3C7] transition-colors whitespace-nowrap"
              >
                {loadingApprovals
                  ? "Đang tải..."
                  : `${pendingApprovals.length} đơn chờ xử lý`}
              </Link>
            </div>

            {loadingApprovals ? (
              <div className="py-8 text-center text-[13px] text-[#9CA3AF]">
                Đang tải danh sách đơn từ chờ duyệt...
              </div>
            ) : pendingApprovals.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-[#E5E7EB] rounded-[12px] text-[#6B7280]">
                <Icon
                  name="check_circle"
                  size={32}
                  className="mx-auto text-[#059669] mb-2"
                />
                <p className="text-[14px] font-medium text-[#111827]">
                  Không có đơn từ nào cần duyệt
                </p>
                <p className="text-[12px] text-[#9CA3AF] mt-0.5">
                  Tất cả đơn xin nghỉ phép và kê khai công việc đã được xử lý xong.
                </p>
              </div>
            ) : (
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
                        <span className="text-[12px] text-[#6B7280]">
                          ({req.dept})
                        </span>
                      </div>
                      <p className="text-[12px] text-[#7C3AED] font-medium mt-0.5">
                        {req.type} •{" "}
                        <span className="font-mono text-[#6B7280]">
                          {req.date}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={req.link}
                        className="px-3 py-1 rounded-[6px] bg-[#ECFDF5] text-[#059669] text-[12px] font-semibold hover:bg-[#D1FAE5] transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Xét duyệt
                      </Link>
                      <Link
                        href={req.link}
                        className="px-3 py-1 rounded-[6px] bg-[#F3F4F6] text-[#6B7280] text-[12px] font-semibold hover:bg-[#E5E7EB] transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Chi tiết
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Top Performers Leaderboard */}
          <div className="bg-white border border-[#E5E7EB] rounded-[16px] shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[8px] bg-[#EDE9FE] flex items-center justify-center text-[#7C3AED]">
                  <Icon name="military_tech" size={18} />
                </div>
                <h2 className="font-heading text-[18px] leading-[26px] font-semibold text-[#111827]">
                  Nhân sự đạt KPI xuất sắc
                </h2>
              </div>

              <Link
                href="/performance"
                className="text-[12px] font-semibold text-[#7C3AED] hover:underline whitespace-nowrap"
              >
                Xem tất cả →
              </Link>
            </div>

            <div className="space-y-2.5">
              {loading ? (
                <div className="text-[13px] text-[#9CA3AF] text-center py-4">
                  Đang tải danh sách đánh giá...
                </div>
              ) : topPerformers.length > 0 ? (
                topPerformers.map((p, idx) => (
                  <div
                    key={p.employeeId}
                    className="p-3 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-[#EDE9FE] text-[#7C3AED] font-heading font-bold text-[12px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="text-[13px] font-semibold text-[#111827] block truncate">
                          {p.fullName}
                        </span>
                        <span className="text-[11px] text-[#6B7280] block truncate">
                          {p.positionName} • {p.departmentName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-heading font-bold text-[14px] text-[#7C3AED]">
                        {p.latestKpiScore ?? "--"} đ
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EDE9FE] text-[#7C3AED]">
                        Hạng {p.latestRatingRank ?? "A"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-[13px] text-[#9CA3AF] text-center py-4">
                  Chưa có nhân sự đạt KPI xuất sắc (Hạng A/B) trong kỳ.
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Interviews & Recruitment */}
          <div className="bg-white border border-[#E5E7EB] rounded-[16px] shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[8px] bg-[#F0FDFA] flex items-center justify-center text-[#0D9488]">
                  <Icon name="person_search" size={18} />
                </div>
                <h2 className="font-heading text-[18px] leading-[26px] font-semibold text-[#111827]">
                  Lịch phỏng vấn sắp tới
                </h2>
              </div>

              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#EDE9FE] text-[#7C3AED]">
                Tuyển dụng
              </span>
            </div>

            <div className="space-y-3">
              {upcomingInterviews.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-[10px] p-3 flex flex-col gap-1 hover:border-[#DDD6FE] transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[13px] text-[#111827]">
                      {item.candidate}
                    </span>
                    <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-[#EDE9FE] text-[#7C3AED] shrink-0">
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
              Truy cập nhanh
            </h2>

            <div className="grid grid-cols-2 gap-3 text-[13px]">
              <Link
                href="/performance"
                className="p-3 rounded-[10px] bg-[#F9FAFB] border border-[#E5E7EB] hover:bg-[#F5F3FF] hover:border-[#DDD6FE] hover:text-[#7C3AED] transition-all flex flex-col items-center justify-center gap-2 text-center"
              >
                <Icon name="military_tech" size={20} className="text-[#7C3AED]" />
                <span className="font-medium text-[#111827]">Đánh giá KPI</span>
              </Link>

              <Link
                href="/training"
                className="p-3 rounded-[10px] bg-[#F9FAFB] border border-[#E5E7EB] hover:bg-[#F5F3FF] hover:border-[#DDD6FE] hover:text-[#7C3AED] transition-all flex flex-col items-center justify-center gap-2 text-center"
              >
                <Icon name="school" size={20} className="text-[#0D9488]" />
                <span className="font-medium text-[#111827]">Khóa học nội bộ</span>
              </Link>

              <Link
                href="/timesheets"
                className="p-3 rounded-[10px] bg-[#F9FAFB] border border-[#E5E7EB] hover:bg-[#F5F3FF] hover:border-[#DDD6FE] hover:text-[#7C3AED] transition-all flex flex-col items-center justify-center gap-2 text-center"
              >
                <Icon name="schedule" size={20} className="text-[#F59E0B]" />
                <span className="font-medium text-[#111827]">Kê khai giờ làm</span>
              </Link>

              <Link
                href="/attendance"
                className="p-3 rounded-[10px] bg-[#F9FAFB] border border-[#E5E7EB] hover:bg-[#F5F3FF] hover:border-[#DDD6FE] hover:text-[#7C3AED] transition-all flex flex-col items-center justify-center gap-2 text-center"
              >
                <Icon name="more_time" size={20} className="text-[#3B82F6]" />
                <span className="font-medium text-[#111827]">Bảng chấm công</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
