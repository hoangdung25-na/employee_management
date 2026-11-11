"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "@/components/ui/Icon";
import { performanceService } from "@/features/performance/services/performanceService";
import {
  PerformanceReview,
  PerformanceSummaryMetrics,
  ReviewCycle,
} from "@/features/performance/types/performance";
import { PerformanceSummaryCards } from "@/features/performance/components/PerformanceSummaryCards";
import {
  DepartmentNode,
  DepartmentTreePanel,
} from "@/features/performance/components/DepartmentTreePanel";
import { PerformanceReviewDrawer } from "@/features/performance/components/PerformanceReviewDrawer";
import { PerformanceEvaluateModal } from "@/features/performance/components/PerformanceEvaluateModal";
import { CreatePerformanceReviewModal } from "@/features/performance/components/CreatePerformanceReviewModal";
import { getDepartments } from "@/features/departments/services/departmentService";
import { getEmployees } from "@/features/employees/services/employeeService";
import { useAuth } from "@/features/auth/context/AuthContext";
import { formatCurrencyVND } from "@/lib/utils/format";

export default function PerformanceDashboardPage() {
  const { session } = useAuth();

  // State
  const [cycles, setCycles] = useState<ReviewCycle[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<string>("");
  const [selectedCycle, setSelectedCycle] = useState<ReviewCycle | null>(null);

  const [metrics, setMetrics] = useState<PerformanceSummaryMetrics | null>(null);
  const [departments, setDepartments] = useState<DepartmentNode[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);

  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);

  // Derived selected review
  const selectedReview =
    reviews.find((r) => r.id === selectedReviewId) || reviews[0] || null;

  const [search, setSearch] = useState("");
  const [selectedRank, setSelectedRank] = useState<string>("All");
  const [showRewardCol, setShowRewardCol] = useState(true);

  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10;

  const [loading, setLoading] = useState(true);
  const [isEvaluateModalOpen, setIsEvaluateModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [employeesList, setEmployeesList] = useState<
    { id: string; fullName: string; employeeCode: string; departmentName: string }[]
  >([]);

  // 1. Fetch Cycles
  const loadCycles = async () => {
    try {
      const data = await performanceService.getCycles();
      setCycles(data);
      if (data.length > 0) {
        const defaultCycle = data.find((c) => c.status === "Open") || data[0];
        setSelectedCycleId(defaultCycle.id);
        setSelectedCycle(defaultCycle);
      }
    } catch (err) {
      console.error("Failed to load cycles", err);
    }
  };

  useEffect(() => {
    loadCycles();
  }, []);

  // 2. Fetch Departments & Employees
  useEffect(() => {
    const loadDepts = async () => {
      try {
        const [deptsData, cycleReviews] = await Promise.all([
          getDepartments(),
          selectedCycleId
            ? performanceService.getReviews({ cycleId: selectedCycleId, pageSize: 200 }).catch(() => null)
            : null,
        ]);

        const deptReviewCount: Record<string, number> = {};
        if (cycleReviews?.items) {
          cycleReviews.items.forEach((r) => {
            if (r.departmentId) {
              deptReviewCount[r.departmentId] = (deptReviewCount[r.departmentId] || 0) + 1;
            }
          });
        }

        const nodes: DepartmentNode[] = deptsData.map((d) => ({
          id: d.id,
          code: d.departmentCode,
          name: d.departmentName,
          count: cycleReviews ? (deptReviewCount[d.id] || 0) : (d.employeeCount || 0),
        }));
        setDepartments(nodes);
      } catch (err) {
        console.error("Failed to load departments", err);
      }
    };

    loadDepts();
  }, [selectedCycleId]);

  useEffect(() => {
    const loadEmps = async () => {
      try {
        const empsData = await getEmployees({ pageSize: 100 });
        setEmployeesList(
          empsData.items.map((e) => ({
            id: e.id,
            fullName: e.fullName,
            employeeCode: e.employeeCode,
            departmentName: e.departmentName,
          }))
        );
      } catch (err) {
        console.error("Failed to load employees list", err);
      }
    };

    loadEmps();
  }, []);

  // 3. Fetch Reviews & Metrics
  const loadReviewsData = useCallback(async () => {
    if (!selectedCycleId) return;
    setLoading(true);
    try {
      const [reviewsResult, metricsResult] = await Promise.all([
        performanceService.getReviews({
          cycleId: selectedCycleId || undefined,
          departmentId: selectedDeptId || undefined,
          rank: selectedRank === "All" ? undefined : selectedRank,
          search: search.trim() || undefined,
          pageNumber,
          pageSize,
        }),
        performanceService.getSummaryMetrics(
          selectedCycleId || undefined,
          selectedDeptId || undefined
        ),
      ]);

      setReviews(reviewsResult.items);
      setTotalCount(reviewsResult.totalCount);
      setMetrics(metricsResult);

      setSelectedReviewId((prevId) => {
        if (prevId && reviewsResult.items.some((r) => r.id === prevId)) {
          return prevId;
        }
        return reviewsResult.items[0]?.id || null;
      });
    } catch (err) {
      console.error("Failed to load reviews data", err);
    } finally {
      setLoading(false);
    }
  }, [selectedCycleId, selectedDeptId, selectedRank, search, pageNumber]);

  useEffect(() => {
    if (!selectedCycleId) return;

    const timer = setTimeout(() => {
      loadReviewsData();
    }, search ? 300 : 0);

    return () => clearTimeout(timer);
  }, [loadReviewsData, search, selectedCycleId]);

  // Handle cycle change
  const handleCycleChange = (id: string) => {
    setSelectedCycleId(id);
    const found = cycles.find((c) => c.id === id) || null;
    setSelectedCycle(found);
    setPageNumber(1);
  };

  // Export CSV
  const handleExportCsv = () => {
    if (reviews.length === 0) return;
    const headers = "Mã NV,Họ và tên,Phòng ban,Chức danh,Điểm số,Xếp loại,Trạng thái,Tiền thưởng dự kiến\n";
    const rows = reviews
      .map(
        (r) =>
          `"${r.employeeCode}","${r.employeeName}","${r.departmentName}","${r.positionName}",${r.finalScore ?? r.selfScore ?? 0
          },"${r.ratingRank ?? "N/A"}","${r.status}",${r.estimatedRewardAmount}`
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `HRFlow_KPI_${selectedCycle?.cycleCode || "Q4_2026"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getRankBadge = (rank?: string | null) => {
    switch (rank) {
      case "A":
        return "bg-[#EDE9FE] text-[#7C3AED]";
      case "B":
        return "bg-[#ECFDF5] text-[#059669]";
      case "C":
        return "bg-[#FFFBEB] text-[#D97706]";
      case "D":
        return "bg-[#FEF2F2] text-[#EF4444]";
      default:
        return "bg-[#F3F4F6] text-[#6B7280]";
    }
  };

  const currentReviewerId = session?.employeeId || "057FD3C9-C299-4F5F-A59E-D2A479588C1C";

  return (
    <div className="space-y-6">
      {/* TOP HEADER / ACTION BAR */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-xs">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-heading text-[24px] lg:text-[28px] font-bold text-[#111827] tracking-tight">
              Đánh giá & Xếp loại KPI — {selectedCycle?.cycleCode || "Quý 4/2026"}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">
              <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-pulse" />
              Đang đánh giá thẩm định
            </span>
          </div>
          <p className="text-[13px] text-[#6B7280] max-w-3xl leading-relaxed">
            Theo dõi chỉ tiêu hiệu suất, thẩm định điểm số và tự động liên kết quỹ thưởng vào chu kỳ tính lương tháng 12/2026.
          </p>
        </div>

        {/* Actions & Period Selector */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Period selector dropdown */}
          <div className="relative inline-flex items-center">
            <select
              value={selectedCycleId}
              onChange={(e) => handleCycleChange(e.target.value)}
              className="h-10 pl-3 pr-8 bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#111827] border border-[#E5E7EB] rounded-lg text-[13px] font-medium appearance-none focus:outline-none focus:border-[#7C3AED] cursor-pointer"
            >
              {cycles.map((c) => (
                <option key={c.id} value={c.id}>
                  Kỳ: {c.cycleName} ({c.cycleCode})
                </option>
              ))}
            </select>
            <span className="absolute right-2.5 pointer-events-none text-[#6B7280]">
              <Icon name="chevron_down" size={16} />
            </span>
          </div>

          {/* Export Report */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="h-10 px-4 bg-white hover:bg-[#F9FAFB] text-[#7C3AED] border border-[#DDD6FE] rounded-lg text-[13px] font-medium flex items-center gap-2 shadow-2xs transition-colors"
          >
            <Icon name="download" size={16} />
            <span>Xuất báo cáo KPI</span>
          </button>

          {/* New KPI Assignment */}
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="h-10 px-4 bg-[#7C3AED] hover:bg-[#5B21B6] text-white rounded-lg text-[13px] font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Icon name="add" size={16} />
            <span>Giao chỉ tiêu KPI mới</span>
          </button>
        </div>
      </div>

      {/* 4 SUMMARY METRIC CARDS */}
      <PerformanceSummaryCards metrics={metrics} loading={loading} />

      {/* 3-PANEL MAIN WORKSPACE */}
      <div className="grid grid-cols-12 gap-5 items-start">
        {/* PANEL A: DEPARTMENT TREE (COL 1-3 on XL) */}
        <div className="col-span-12 md:col-span-4 xl:col-span-3">
          <DepartmentTreePanel
            departments={departments}
            selectedDeptId={selectedDeptId}
            onSelectDept={(deptId) => {
              setSelectedDeptId(deptId);
              setPageNumber(1);
            }}
            totalCount={departments.reduce((sum, d) => sum + d.count, 0)}
          />
        </div>

        {/* PANEL B: MAIN DATA TABLE (COL 4-8 on XL) */}
        <section className="col-span-12 md:col-span-8 xl:col-span-5 bg-white rounded-xl border border-[#E5E7EB] shadow-xs flex flex-col overflow-hidden">
          {/* Table Toolbar */}
          <div className="p-4 flex flex-col gap-3 border-b border-[#F3F4F6]">
            <div className="flex items-center gap-3 flex-wrap justify-between">
              <div className="relative flex-1 min-w-[200px]">
                <span className="absolute left-3 top-2.5 text-[#9CA3AF]">
                  <Icon name="search" size={16} />
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPageNumber(1);
                  }}
                  placeholder="Tìm theo tên, mã NV (NV-2026...)"
                  className="w-full h-9 pl-9 pr-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[13px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              {/* Reward Column Toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none text-[12px] text-[#4B5563]">
                <input
                  type="checkbox"
                  checked={showRewardCol}
                  onChange={(e) => setShowRewardCol(e.target.checked)}
                  className="rounded text-[#7C3AED] focus:ring-[#7C3AED] w-4 h-4"
                />
                <span className="font-medium">Hiện thưởng liên kết</span>
              </label>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 flex-wrap text-[12px]">
              {[
                { label: `Tất cả (${metrics?.totalEmployees ?? totalCount})`, value: "All" },
                { label: `A - Xuất sắc (${metrics?.rankACount ?? 0})`, value: "A" },
                { label: `B - Tốt (${metrics?.rankBCount ?? 0})`, value: "B" },
                { label: `C - Đạt (${metrics?.rankCCount ?? 0})`, value: "C" },
                { label: `D - Cần cải thiện (${metrics?.rankDCount ?? 0})`, value: "D" },
              ].map((chip) => (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => {
                    setSelectedRank(chip.value);
                    setPageNumber(1);
                  }}
                  className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${selectedRank === chip.value
                    ? "bg-[#EDE9FE] text-[#7C3AED] font-semibold border border-[#DDD6FE]"
                    : "bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#4B5563]"
                    }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#F9FAFB] text-[#6B7280] font-semibold uppercase tracking-wider text-[11px] h-9 border-b border-[#E5E7EB]">
                  <th className="px-3">Nhân viên</th>
                  <th className="px-2">Mục tiêu</th>
                  <th className="px-3 min-w-[100px]">Tiến độ</th>
                  <th className="px-2 text-center">Điểm</th>
                  <th className="px-3">Xếp loại</th>
                  {showRewardCol && <th className="px-3 text-right">Thưởng liên kết</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#9CA3AF]">
                      <Icon name="sync" size={20} className="animate-spin inline-block mr-2" />
                      Đang tải danh sách đánh giá KPI...
                    </td>
                  </tr>
                ) : reviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#9CA3AF]">
                      Không tìm thấy phiếu đánh giá phù hợp.
                    </td>
                  </tr>
                ) : (
                  reviews.map((r) => {
                    const isSelected = selectedReview?.id === r.id;
                    const score = r.finalScore ?? r.managerScore ?? r.selfScore ?? 0;
                    const progress = Math.min(Math.round(r.averageProgressPercent || score), 100);
                    return (
                      <tr
                        key={r.id}
                        onClick={() => setSelectedReviewId(r.id)}
                        className={`transition-colors cursor-pointer group ${isSelected
                          ? "bg-[#F5F3FF] border-l-[3px] border-[#7C3AED]"
                          : "hover:bg-[#F9FAFB]"
                          }`}
                      >
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#EDE9FE] text-[#7C3AED] font-heading font-bold flex items-center justify-center text-[12px] shrink-0">
                              {r.employeeName
                                .split(" ")
                                .slice(-2)
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span
                                className={`font-medium truncate ${isSelected ? "text-[#7C3AED] font-semibold" : "text-[#111827]"
                                  }`}
                              >
                                {r.employeeName}
                              </span>
                              <span className="font-mono text-[11px] text-[#9CA3AF]">
                                {r.employeeCode} • {r.positionName}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-2 py-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#F3F4F6] text-[#4B5563]">
                            {r.goalsCount} mục tiêu
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-14 h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                              <div
                                className="bg-[#0D9488] h-full rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="font-mono text-[11px] text-[#0D9488] font-semibold">
                              {progress}%
                            </span>
                          </div>
                        </td>

                        <td className="px-2 py-3 text-center">
                          <span className="font-heading font-bold text-[14px] text-[#111827]">
                            {score}
                          </span>
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${getRankBadge(
                              r.ratingRank
                            )}`}
                          >
                            {r.ratingRank ? `Hạng ${r.ratingRank}` : "Chờ duyệt"}
                          </span>
                        </td>

                        {showRewardCol && (
                          <td className="px-3 py-3 text-right whitespace-nowrap">
                            <div className="flex flex-col items-end">
                              <span className="font-mono text-[12px] text-[#111827] font-medium">
                                +{formatCurrencyVND(r.estimatedRewardAmount)}
                              </span>
                              <span className="text-[10px] text-[#0D9488] flex items-center gap-0.5">
                                <Icon name="attachment" size={10} /> Lương T12
                              </span>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-3 bg-white border-t border-[#F3F4F6] flex items-center justify-between text-[12px] text-[#6B7280]">
            <span>
              Hiển thị <strong>{reviews.length > 0 ? (pageNumber - 1) * pageSize + 1 : 0}</strong> -{" "}
              <strong>{Math.min(pageNumber * pageSize, totalCount)}</strong> trong{" "}
              <strong>{totalCount}</strong> kết quả
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                disabled={pageNumber === 1}
                className="w-7 h-7 rounded flex items-center justify-center hover:bg-[#F3F4F6] text-[#9CA3AF] disabled:opacity-40"
              >
                <Icon name="chevron_left" size={16} />
              </button>
              <span className="px-2 font-mono font-medium text-[#111827]">
                Trang {pageNumber}
              </span>
              <button
                type="button"
                onClick={() => setPageNumber(pageNumber + 1)}
                disabled={pageNumber * pageSize >= totalCount}
                className="w-7 h-7 rounded flex items-center justify-center hover:bg-[#F3F4F6] text-[#9CA3AF] disabled:opacity-40"
              >
                <Icon name="chevron_right" size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* PANEL C: SELECTED EMPLOYEE DETAIL DRAWER (COL 9-12 on XL) */}
        <div className="col-span-12 xl:col-span-4">
          <PerformanceReviewDrawer
            review={selectedReview}
            onOpenEvaluateModal={() => setIsEvaluateModalOpen(true)}
          />
        </div>
      </div>

      {/* MODALS */}
      <PerformanceEvaluateModal
        isOpen={isEvaluateModalOpen}
        onClose={() => setIsEvaluateModalOpen(false)}
        review={selectedReview}
        onSuccess={loadReviewsData}
      />

      <CreatePerformanceReviewModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        cycles={cycles}
        currentCycleId={selectedCycleId}
        employees={employeesList}
        currentReviewerId={currentReviewerId}
        onSuccess={loadReviewsData}
      />
    </div>
  );
}
