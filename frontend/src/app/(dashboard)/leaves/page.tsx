"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { formatDateVN } from "@/lib/utils/format";
import { useAuth } from "@/features/auth/context/AuthContext";
import {
  CreateLeaveRequestInput,
  LeaveBalance,
  LeaveRequest,
  LeaveType,
} from "@/features/leaves/types/leave";
import {
  cancelLeaveRequest,
  createLeaveRequest,
  getLeaveRequests,
  getLeaveTypes,
  getMyLeaveBalances,
  reviewLeaveRequest,
} from "@/features/leaves/services/leaveService";
import { getDepartments } from "@/features/departments/services/departmentService";
import { Department } from "@/features/departments/types/department";

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  Pending: {
    label: "Chờ phê duyệt",
    bg: "bg-[#FEF3C7]",
    text: "text-[#92400E]",
    dot: "bg-[#D97706]",
  },
  Approved: {
    label: "Đã phê duyệt",
    bg: "bg-[#ECFDF5]",
    text: "text-[#059669]",
    dot: "bg-[#059669]",
  },
  Rejected: {
    label: "Từ chối",
    bg: "bg-[#FEF2F2]",
    text: "text-[#DC2626]",
    dot: "bg-[#DC2626]",
  },
  Cancelled: {
    label: "Đã hủy",
    bg: "bg-[#F3F4F6]",
    text: "text-[#6B7280]",
    dot: "bg-[#9CA3AF]",
  },
};

export default function LeavesPage() {
  const { session, hasPermission, hasRole } = useAuth();
  const canReview =
    hasPermission("Leave.Approve") ||
    hasRole("SUPER_ADMIN") ||
    hasRole("HR_MANAGER") ||
    hasRole("MANAGER");

  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Status Filter Tabs
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [typeFilterChip, setTypeFilterChip] = useState<string>("all");

  // Selected Request for Master-Detail View
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [newRequest, setNewRequest] = useState<Partial<CreateLeaveRequestInput>>({
    startDate: "",
    endDate: "",
    totalDays: 1,
    reason: "",
  });

  // Review State on Selected Item
  const [inlineReviewComment, setInlineReviewComment] = useState<string>("");
  const [isReviewing, setIsReviewing] = useState<boolean>(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Departments list for filter dropdown
  const [departments, setDepartments] = useState<Department[]>([]);
  // Leave balances of applicant currently viewed in detail panel
  const [applicantBalances, setApplicantBalances] = useState<LeaveBalance[]>([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [balList, reqList, typeList, deptList] = await Promise.all([
        getMyLeaveBalances().catch(() => [] as LeaveBalance[]),
        getLeaveRequests().catch(() => [] as LeaveRequest[]),
        getLeaveTypes().catch(() => [] as LeaveType[]),
        getDepartments().catch(() => [] as Department[]),
      ]);
      setBalances(balList);
      setRequests(reqList);
      setTypes(typeList);
      setDepartments(deptList);

      if (reqList.length > 0) {
        setSelectedRequestId((prev) => prev || reqList[0].id);
      }
      if (typeList.length > 0) {
        setNewRequest((prev) => ({
          ...prev,
          leaveTypeId: prev.leaveTypeId || typeList[0].id,
        }));
      }
    } catch (err) {
      console.error("Lỗi tải dữ liệu nghỉ phép:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    const today = new Date().toISOString().slice(0, 10);
    setNewRequest({
      leaveTypeId: types[0]?.id || "",
      startDate: today,
      endDate: today,
      totalDays: 1,
      reason: "",
    });
    setIsCreateModalOpen(true);
    setCreateError(null);
  };

  // Calculate days between dates in Modal
  const handleDatesChange = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e >= s) {
      const diffTime = Math.abs(e.getTime() - s.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setNewRequest((prev) => ({
        ...prev,
        startDate: start,
        endDate: end,
        totalDays: diffDays,
      }));
    } else {
      setNewRequest((prev) => ({
        ...prev,
        startDate: start,
        endDate: end,
      }));
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedLeaveTypeId = newRequest.leaveTypeId || types[0]?.id;
    if (!resolvedLeaveTypeId || !newRequest.startDate || !newRequest.endDate || !newRequest.reason?.trim()) {
      setCreateError("Vui lòng điền đầy đủ các thông tin bắt buộc.");
      return;
    }

    const currentBal = balances.find((b) => b.leaveTypeId === resolvedLeaveTypeId);
    if (currentBal && (newRequest.totalDays ?? 1) > currentBal.remainingDays) {
      setCreateError(
        `Số ngày nghỉ đăng ký (${newRequest.totalDays} ngày) vượt quá số phép còn lại (${currentBal.remainingDays} ngày).`
      );
      return;
    }

    setIsSubmitting(true);
    setCreateError(null);
    try {
      const created = await createLeaveRequest({
        leaveTypeId: resolvedLeaveTypeId,
        startDate: newRequest.startDate,
        endDate: newRequest.endDate,
        totalDays: Number(newRequest.totalDays ?? 1),
        reason: newRequest.reason.trim(),
        attachmentUrl: newRequest.attachmentUrl?.trim(),
      });

      setRequests((prev) => [created, ...prev]);
      setSelectedRequestId(created.id);
      setIsCreateModalOpen(false);
      const today = new Date().toISOString().slice(0, 10);
      setNewRequest({
        leaveTypeId: types[0]?.id || "",
        startDate: today,
        endDate: today,
        totalDays: 1,
        reason: "",
      });
      setToastMessage(`Đã nộp đơn nghỉ phép ${created.requestCode} thành công. Vui lòng chờ phê duyệt!`);
      setTimeout(() => setToastMessage(null), 5000);
      loadData();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi nộp đơn nghỉ phép.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Inline Review Action
  const handleInlineReview = async (requestId: string, isApproved: boolean) => {
    setIsReviewing(true);
    try {
      const updated = await reviewLeaveRequest(requestId, {
        isApproved,
        reviewComment: inlineReviewComment.trim(),
      });

      setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setInlineReviewComment("");
      setToastMessage(
        isApproved
          ? `Đã phê duyệt đơn ${updated.requestCode} của ${updated.employeeName}.`
          : `Đã từ chối đơn ${updated.requestCode}.`
      );
      setTimeout(() => setToastMessage(null), 5000);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể xử lý đơn này.");
    } finally {
      setIsReviewing(false);
    }
  };

  const handleCancelRequest = async (id: string, code: string) => {
    if (!confirm(`Bạn có chắc chắn muốn hủy đơn xin nghỉ phép ${code}? Số ngày phép sẽ được hoàn lại vào quỹ phép của bạn.`)) {
      return;
    }

    try {
      await cancelLeaveRequest(id);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "Cancelled" as const } : r))
      );
      setToastMessage(`Đã hủy đơn ${code} thành công.`);
      setTimeout(() => setToastMessage(null), 4000);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể hủy đơn này.");
    }
  };

  // Filter & sort requests
  const filteredRequests = useMemo(() => {
    const list = requests.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (typeFilterChip !== "all" && r.leaveTypeId !== typeFilterChip) return false;
      if (departmentFilter !== "all" && r.departmentName !== departmentFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = r.requestCode.toLowerCase().includes(q);
        const matchName = r.employeeName.toLowerCase().includes(q);
        if (!matchCode && !matchName) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === "days") {
        return b.totalDays - a.totalDays;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [requests, statusFilter, typeFilterChip, departmentFilter, searchQuery, sortBy]);

  // Selected Request object
  const activeRequest =
    requests.find((r) => r.id === selectedRequestId) || filteredRequests[0] || null;

  // Load applicant's leave balances when selected request changes
  useEffect(() => {
    if (!activeRequest?.employeeId) {
      setApplicantBalances([]);
      return;
    }
    if (activeRequest.employeeId === session?.employeeId) {
      setApplicantBalances(balances);
      return;
    }
    let isCancelled = false;
    getMyLeaveBalances({ year: 2026, employeeId: activeRequest.employeeId })
      .then((res) => {
        if (!isCancelled) setApplicantBalances(res);
      })
      .catch(() => {
        if (!isCancelled) setApplicantBalances([]);
      });
    return () => {
      isCancelled = true;
    };
  }, [activeRequest?.employeeId, session?.employeeId, balances]);

  // Applicant's leave balance for the active request's leave type (or first available)
  const activeBalance =
    applicantBalances.find((b) => b.leaveTypeId === activeRequest?.leaveTypeId) ||
    applicantBalances[0] ||
    null;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
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

      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-1.5 text-[12px] text-[#6B7280]">
          <span className="hover:text-[#7C3AED] cursor-pointer transition-colors">Chấm công</span>
          <Icon name="chevron_right" size={14} className="text-[#9CA3AF]" />
          <span className="font-semibold text-[#7C3AED]">Đơn từ & Nghỉ phép</span>
        </nav>
      </div>

      {/* Header & Quick Summary Stats Pill Group */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-[26px] font-bold text-[#111827] tracking-tight">
            Quản lý Đơn từ & Nghỉ phép
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            Theo dõi quỹ phép năm, tiếp nhận và phê duyệt đơn xin nghỉ phép của nhân viên.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Quick Summary Stats Pill Group */}
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-[12px] shadow-xs border border-[#E5E7EB] shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-[#EDE9FE]/60">
              <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />
              <span className="text-[12px] text-[#111827] whitespace-nowrap">
                Cần duyệt:{" "}
                <strong className="text-[#7C3AED] font-bold">
                  {requests.filter((r) => r.status === "Pending").length} đơn
                </strong>
              </span>
            </div>
            <div className="h-4 w-px bg-[#E5E7EB]" />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-[8px]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0D9488]" />
              <span className="text-[12px] text-[#6B7280] whitespace-nowrap">
                Đã xử lý:{" "}
                <strong className="text-[#111827] font-semibold">
                  {requests.filter((r) => r.status !== "Pending").length} đơn
                </strong>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="h-10 px-4 rounded-[10px] bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[13px] font-medium shadow-xs flex items-center gap-2 transition-colors cursor-pointer shrink-0"
          >
            <Icon name="add" size={16} />
            <span>Nộp đơn xin nghỉ phép</span>
          </button>
        </div>
      </div>

      {/* Status Tabs & Filter Toolbar */}
      <div className="flex flex-col gap-4 bg-white p-4 rounded-[16px] shadow-xs border border-[#E5E7EB]">
        {/* Status Tabs Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter("Pending")}
              className={`px-4 py-2 rounded-[8px] text-[13px] font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === "Pending"
                  ? "bg-[#EDE9FE] text-[#7C3AED]"
                  : "text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827]"
              }`}
            >
              <span>Chờ duyệt</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#7C3AED] text-white">
                {requests.filter((r) => r.status === "Pending").length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("Approved")}
              className={`px-4 py-2 rounded-[8px] text-[13px] font-medium flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === "Approved"
                  ? "bg-[#EDE9FE] text-[#7C3AED] font-semibold"
                  : "text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827]"
              }`}
            >
              <span>Đã duyệt</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-[#F3F4F6] text-[#6B7280]">
                {requests.filter((r) => r.status === "Approved").length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("Rejected")}
              className={`px-4 py-2 rounded-[8px] text-[13px] font-medium flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === "Rejected"
                  ? "bg-[#EDE9FE] text-[#7C3AED] font-semibold"
                  : "text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827]"
              }`}
            >
              <span>Từ chối</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-[#F3F4F6] text-[#6B7280]">
                {requests.filter((r) => r.status === "Rejected").length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-4 py-2 rounded-[8px] text-[13px] font-medium flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === "ALL"
                  ? "bg-[#EDE9FE] text-[#7C3AED] font-semibold"
                  : "text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827]"
              }`}
            >
              <span>Tất cả</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-[#F3F4F6] text-[#6B7280]">
                {requests.length}
              </span>
            </button>
          </div>

          {/* Filter Controls */}
          <div className="flex items-center gap-2">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="h-9 px-3 bg-[#F9FAFB] rounded-[8px] text-[12px] text-[#374151] border border-[#E5E7EB] focus:outline-none focus:border-[#7C3AED] cursor-pointer"
            >
              <option value="all">Tất cả phòng ban</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.departmentName}>
                  {dept.departmentName}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-9 px-3 bg-[#F9FAFB] rounded-[8px] text-[12px] text-[#374151] border border-[#E5E7EB] focus:outline-none focus:border-[#7C3AED] cursor-pointer"
            >
              <option value="newest">Mới nhất trước</option>
              <option value="oldest">Cũ nhất trước</option>
              <option value="days">Số ngày nghỉ nhiều nhất</option>
            </select>
          </div>
        </div>

        {/* Search & Category Filter Chips Row */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3">
          <div className="relative w-full xl:w-72 shrink-0">
            <span className="absolute left-3 top-2.5 text-[#9CA3AF]">
              <Icon name="search" size={16} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên nhân viên, mã đơn..."
              className="w-full h-9 pl-9 pr-3 bg-[#F9FAFB] rounded-[8px] text-[12px] text-[#111827] placeholder:text-[#9CA3AF] border border-[#E5E7EB] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTypeFilterChip("all")}
              className={`h-8 px-3.5 rounded-full text-[12px] font-medium shrink-0 transition-colors cursor-pointer whitespace-nowrap ${
                typeFilterChip === "all"
                  ? "border border-[#7C3AED] bg-[#EDE9FE] text-[#7C3AED]"
                  : "bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]"
              }`}
            >
              Tất cả loại phép
            </button>
            {types.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTypeFilterChip(t.id)}
                className={`h-8 px-3.5 rounded-full text-[12px] font-medium shrink-0 transition-colors cursor-pointer whitespace-nowrap ${
                  typeFilterChip === t.id
                    ? "border border-[#7C3AED] bg-[#EDE9FE] text-[#7C3AED]"
                    : "bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]"
                }`}
              >
                {t.leaveTypeName}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MASTER-DETAIL LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Request Cards List */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-[16px] font-bold text-[#111827]">
                Danh sách đơn nghỉ phép
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#EDE9FE] text-[#7C3AED]">
                {filteredRequests.length}
              </span>
            </div>
          </div>

          {/* Empty state */}
          {filteredRequests.length === 0 && !isLoading && (
            <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-8 text-center">
              <Icon name="history_edu" size={32} className="mx-auto text-[#9CA3AF] mb-2" />
              <p className="font-semibold text-[14px] text-[#111827]">Chưa có đơn nghỉ phép nào</p>
              <p className="text-[12px] text-[#6B7280] mt-1">
                Thử thay đổi bộ lọc trạng thái hoặc nhấn &ldquo;Nộp đơn xin nghỉ phép&rdquo; để tạo đơn mới.
              </p>
            </div>
          )}

          {/* Cards Stack */}
          <div className="flex flex-col gap-2.5">
            {filteredRequests.map((req) => {
              const isSelected = activeRequest?.id === req.id;
              const conf = STATUS_CONFIG[req.status] || STATUS_CONFIG.Pending;

              return (
                <div
                  key={req.id}
                  onClick={() => setSelectedRequestId(req.id)}
                  className={`relative rounded-[16px] p-4 cursor-pointer transition-all flex flex-col gap-3 border ${
                    isSelected
                      ? "bg-[#FAF5FF] border-2 border-[#7C3AED] shadow-sm"
                      : "bg-white border-[#E5E7EB] hover:border-[#DDD6FE] hover:shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center font-heading font-bold text-[14px] shrink-0 ring-2 ring-[#7C3AED]/20">
                        {req.employeeName
                          .split(" ")
                          .slice(-2)
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-semibold text-[#111827] truncate">
                            {req.employeeName}
                          </span>
                          <span className="font-mono text-[11px] text-[#6B7280] shrink-0">
                            {req.employeeCode}
                          </span>
                        </div>
                        <span className="text-[12px] text-[#6B7280] truncate">
                          {req.departmentName || "Phòng ban"}
                        </span>
                      </div>
                    </div>

                    {/* Pill Status */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 whitespace-nowrap ${conf.bg} ${conf.text}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                      {conf.label}
                    </span>
                  </div>

                  {/* Leave type & dates */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E5E7EB]/60">
                    <span className="px-2.5 py-1 rounded-[6px] text-[11px] font-medium bg-[#EFF6FF] text-[#1D4ED8] flex items-center gap-1">
                      <Icon name="calendar" size={13} />
                      {req.leaveTypeName}
                    </span>
                    <span className="text-[12px] font-semibold text-[#111827]">
                      {formatDateVN(req.startDate)}
                      {req.startDate !== req.endDate ? ` → ${formatDateVN(req.endDate)}` : ""} (
                      {req.totalDays} ngày)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#6B7280] pt-0.5">
                    <span className="flex items-center gap-1 text-[#7C3AED] font-medium">
                      <Icon name="more_time" size={13} />
                      Mã: {req.requestCode}
                    </span>
                    <span className="truncate max-w-[180px]">
                      {req.reason ? `“${req.reason}”` : "Không có lý do"}
                    </span>
                  </div>

                  {/* Active Selection Indicator Arrow */}
                  {isSelected && (
                    <div className="absolute -right-[7px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-[#7C3AED] rotate-45 hidden lg:block rounded-xs" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Request Detail Card */}
        <div className="lg:col-span-7 flex flex-col gap-5 bg-white rounded-[16px] p-6 border border-[#E5E7EB] shadow-xs">
          {activeRequest ? (
            <>
              {/* Detail Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[14px] font-bold text-[#7C3AED] bg-[#EDE9FE] px-2.5 py-0.5 rounded-[6px]">
                      #{activeRequest.requestCode}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EFF6FF] text-[#1D4ED8]">
                      {activeRequest.leaveTypeName}
                    </span>
                  </div>
                  <span className="text-[12px] text-[#6B7280] mt-1">
                    Ngày gửi đơn:{" "}
                    <strong className="text-[#111827] font-medium">
                      {formatDateVN(activeRequest.createdAt)}
                    </strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="p-2 rounded-[8px] text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors cursor-pointer"
                    title="In đơn nghỉ phép"
                  >
                    <Icon name="print" size={18} />
                  </button>
                </div>
              </div>

              {/* Employee Identity Profile Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#F9FAFB] rounded-[14px] border border-[#E5E7EB]">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center font-heading font-bold text-[16px] shrink-0 ring-2 ring-[#7C3AED]/30">
                    {activeRequest.employeeName
                      .split(" ")
                      .slice(-2)
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-[16px] font-bold text-[#111827]">
                        {activeRequest.employeeName}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E5E7EB] text-[#374151]">
                        Nhân viên
                      </span>
                    </div>
                    <span className="text-[13px] text-[#4B5563]">
                      {activeRequest.departmentName || "Phòng ban"}
                    </span>
                    <span className="font-mono text-[11px] text-[#6B7280] mt-0.5">
                      Mã NV: {activeRequest.employeeCode}
                    </span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-[#E5E7EB] pt-2 sm:pt-0 sm:pl-4 shrink-0">
                  <span className="text-[11px] text-[#6B7280]">Người xét duyệt:</span>
                  <span className="text-[13px] font-semibold text-[#111827]">
                    {session?.fullName || "Quản lý trực tiếp"}
                  </span>
                </div>
              </div>

              {/* Visual Leave Balance Widget */}
              <div className="bg-[#F9FAFB] p-4 rounded-[14px] border border-[#E5E7EB] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name="account_balance_wallet" size={20} className="text-[#0D9488]" />
                    <span className="font-heading text-[14px] font-bold text-[#111827]">
                      Quỹ phép năm hiện tại (2026)
                    </span>
                  </div>
                  {activeBalance && activeBalance.remainingDays < activeRequest.totalDays ? (
                    <span className="text-[11px] font-bold text-[#DC2626] bg-[#FEF2F2] px-2.5 py-1 rounded-full">
                      Vượt hạn mức
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-[#0D9488] bg-[#CCFBF1] px-2.5 py-1 rounded-full">
                      Đủ điều kiện
                    </span>
                  )}
                </div>

                {/* Progress Bar & Balance Figures */}
                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[12px] text-[#6B7280]">Số ngày phép còn lại:</span>
                    <span className="font-heading text-[18px] text-[#111827]">
                      <span className="text-[#0D9488] font-extrabold">
                        {activeBalance?.remainingDays ?? 12}
                      </span>{" "}
                      <span className="text-[#6B7280] text-[13px] font-normal">
                        / {activeBalance ? activeBalance.entitledDays + activeBalance.carriedOverDays : 12} ngày
                      </span>
                    </span>
                  </div>

                  {/* Multi-segment Progress Bar */}
                  <div className="w-full h-3 bg-[#E5E7EB] rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-[#9CA3AF] transition-all"
                      style={{
                        width: `${
                          activeBalance && activeBalance.entitledDays > 0
                            ? Math.min(100, (activeBalance.usedDays / activeBalance.entitledDays) * 100)
                            : 0
                        }%`,
                      }}
                      title="Đã sử dụng"
                    />
                    <div
                      className="h-full bg-[#7C3AED] transition-all"
                      style={{
                        width: `${Math.min(
                          30,
                          activeBalance && activeBalance.entitledDays > 0
                            ? (activeRequest.totalDays / activeBalance.entitledDays) * 100
                            : (activeRequest.totalDays / 12) * 100
                        )}%`,
                      }}
                      title="Đơn xin nghỉ này"
                    />
                    <div
                      className="h-full bg-[#0D9488] transition-all"
                      style={{
                        width: `${
                          activeBalance && activeBalance.entitledDays > 0
                            ? Math.max(
                                0,
                                ((activeBalance.remainingDays -
                                  (activeRequest.status === "Pending" ? activeRequest.totalDays : 0)) /
                                  activeBalance.entitledDays) *
                                  100
                              )
                            : 70
                        }%`,
                      }}
                      title="Còn lại sau duyệt"
                    />
                  </div>
                </div>

                {/* Stats Grid Breakup */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E5E7EB] text-center">
                  <div className="flex flex-col py-1.5 bg-white rounded-[8px] border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280]">Đã sử dụng</span>
                    <span className="font-heading text-[14px] font-bold text-[#111827]">
                      {activeBalance?.usedDays ?? 0} ngày
                    </span>
                  </div>
                  <div className="flex flex-col py-1.5 bg-[#EDE9FE]/50 rounded-[8px] border border-[#DDD6FE]">
                    <span className="text-[10px] text-[#7C3AED] font-medium">Đơn xin nghỉ này</span>
                    <span className="font-heading text-[14px] font-bold text-[#7C3AED]">
                      {activeRequest.totalDays} ngày
                    </span>
                  </div>
                  <div className="flex flex-col py-1.5 bg-[#CCFBF1]/50 rounded-[8px] border border-[#99F6E4]">
                    <span className="text-[10px] text-[#0D9488] font-medium">Còn lại sau duyệt</span>
                    <span className="font-heading text-[14px] font-bold text-[#0D9488]">
                      {activeBalance
                        ? Math.max(
                            0,
                            activeBalance.remainingDays -
                              (activeRequest.status === "Pending" ? activeRequest.totalDays : 0)
                          )
                        : 0}{" "}
                      ngày
                    </span>
                  </div>
                </div>
              </div>

              {/* Leave Details Section */}
              <div className="flex flex-col gap-3">
                <div className="border-b border-[#E5E7EB] pb-2">
                  <h3 className="font-heading text-[14px] font-bold text-[#111827] flex items-center gap-2">
                    <Icon name="description" size={18} className="text-[#7C3AED]" />
                    <span>Chi tiết đăng ký nghỉ phép</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Duration Block */}
                  <div className="flex flex-col gap-1 p-3.5 rounded-[12px] bg-[#F9FAFB] border border-[#E5E7EB]">
                    <span className="text-[11px] font-semibold text-[#6B7280]">Thời gian nghỉ:</span>
                    <div className="font-semibold text-[13px] text-[#111827] flex items-center gap-1.5">
                      <Icon name="calendar" size={15} className="text-[#7C3AED]" />
                      <span>
                        {formatDateVN(activeRequest.startDate)} — {formatDateVN(activeRequest.endDate)}
                      </span>
                    </div>
                    <span className="text-[12px] text-[#6B7280]">
                      Tổng cộng: <strong className="text-[#7C3AED]">{activeRequest.totalDays} ngày công</strong>
                    </span>
                  </div>

                  {/* Handover Block */}
                  <div className="flex flex-col gap-1 p-3.5 rounded-[12px] bg-[#F9FAFB] border border-[#E5E7EB]">
                    <span className="text-[11px] font-semibold text-[#6B7280]">
                      Bàn giao công việc:
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-8 h-8 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center font-bold text-[11px]">
                        BG
                      </div>
                      <div className="flex flex-col leading-tight">
                        <span className="text-[13px] font-semibold text-[#111827]">
                          Đồng nghiệp cùng bộ phận
                        </span>
                        <span className="text-[11px] text-[#6B7280]">Hỗ trợ công việc trong thời gian nghỉ</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reason Block */}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-[#6B7280]">Lý do xin nghỉ:</span>
                  <div className="p-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-[12px] text-[13px] text-[#111827] leading-relaxed">
                    “{activeRequest.reason}”
                  </div>
                </div>

                {/* Attachment Block */}
                {activeRequest.attachmentUrl && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold text-[#6B7280]">Tệp đính kèm:</span>
                    <div className="flex items-center justify-between p-3 rounded-[10px] border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] transition-colors max-w-md">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-[8px] bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center shrink-0">
                          <Icon name="attachment" size={16} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[12px] font-semibold text-[#111827] truncate">
                            {activeRequest.attachmentUrl}
                          </span>
                          <span className="text-[10px] text-[#9CA3AF]">Tài liệu minh chứng</span>
                        </div>
                      </div>
                      <a
                        href={activeRequest.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#7C3AED] hover:underline text-[12px] font-semibold p-1 shrink-0"
                      >
                        Mở tệp
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Approval Stepper Timeline */}
              <div className="flex flex-col gap-3 pt-2">
                <div className="border-b border-[#E5E7EB] pb-2">
                  <h3 className="font-heading text-[14px] font-bold text-[#111827] flex items-center gap-2">
                    <Icon name="bolt" size={18} className="text-[#7C3AED]" />
                    <span>Trạng thái phê duyệt</span>
                  </h3>
                </div>

                <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5E7EB]">
                  {/* Step 1: Created */}
                  <div className="relative flex items-start gap-3">
                    <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-[#059669] flex items-center justify-center text-white ring-4 ring-white text-[11px] font-bold">
                      ✓
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-bold text-[#111827]">
                          {activeRequest.employeeName} — Đã gửi đơn
                        </span>
                        <span className="font-mono text-[10px] text-[#6B7280]">
                          {formatDateVN(activeRequest.createdAt)}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#6B7280]">
                        Đăng ký nghỉ phép {activeRequest.totalDays} ngày.
                      </span>
                    </div>
                  </div>

                  {/* Step 2: Approver / Cancelled */}
                  <div className="relative flex items-start gap-3">
                    <div
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white ring-4 ring-white text-[11px] font-bold ${
                        activeRequest.status === "Pending"
                          ? "bg-[#7C3AED] ring-[#EDE9FE]"
                          : activeRequest.status === "Approved"
                          ? "bg-[#059669]"
                          : activeRequest.status === "Cancelled"
                          ? "bg-[#6B7280]"
                          : "bg-[#DC2626]"
                      }`}
                    >
                      {activeRequest.status === "Approved"
                        ? "✓"
                        : activeRequest.status === "Rejected"
                        ? "✕"
                        : activeRequest.status === "Cancelled"
                        ? "—"
                        : "2"}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[12px] font-bold ${
                            activeRequest.status === "Cancelled"
                              ? "text-[#4B5563]"
                              : "text-[#7C3AED]"
                          }`}
                        >
                          {activeRequest.status === "Cancelled"
                            ? "Đã hủy đơn"
                            : "Quản lý phê duyệt"}
                        </span>
                        {activeRequest.status === "Pending" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EDE9FE] text-[#7C3AED]">
                            Đang chờ duyệt
                          </span>
                        )}
                        {activeRequest.status === "Cancelled" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F3F4F6] text-[#6B7280]">
                            Đã hủy bỏ
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#6B7280]">
                        {activeRequest.status === "Pending"
                          ? "Đang chờ cấp quản lý kiểm tra và phê duyệt."
                          : activeRequest.status === "Cancelled"
                          ? "Đơn xin nghỉ phép đã được người tạo chủ động hủy bỏ."
                          : activeRequest.reviewComment
                          ? `Ghi chú: ${activeRequest.reviewComment}`
                          : "Đã hoàn tất phê duyệt."}
                      </span>
                    </div>
                  </div>

                  {/* Step 3: Final Step */}
                  <div
                    className={`relative flex items-start gap-3 ${
                      activeRequest.status === "Cancelled"
                        ? "opacity-40"
                        : activeRequest.status === "Approved"
                        ? "opacity-100"
                        : "opacity-60"
                    }`}
                  >
                    <div
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white text-[10px] font-bold ${
                        activeRequest.status === "Approved"
                          ? "bg-[#059669] text-white"
                          : "bg-[#E5E7EB] text-[#6B7280]"
                      }`}
                    >
                      {activeRequest.status === "Approved" ? "✓" : "3"}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-[#111827]">
                          Cập nhật bảng công & Quỹ phép
                        </span>
                      </div>
                      <span className="text-[11px] text-[#6B7280]">
                        {activeRequest.status === "Cancelled"
                          ? "Đơn đã hủy, không trừ số ngày phép."
                          : activeRequest.status === "Approved"
                          ? "Đã cập nhật trừ quỹ phép và đồng bộ bảng chấm công."
                          : "Hệ thống tự động cập nhật số ngày phép sau khi đơn được duyệt."}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Section: Comment & Approval Buttons */}
              {activeRequest.status === "Pending" && (
                <div className="flex flex-col gap-3 pt-3 border-t border-[#E5E7EB]">
                  {canReview ? (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] font-semibold text-[#111827] flex items-center justify-between">
                          <span>Ghi chú xét duyệt</span>
                          <span className="text-[11px] text-[#9CA3AF] font-normal">
                            Không bắt buộc
                          </span>
                        </label>
                        <textarea
                          rows={2}
                          value={inlineReviewComment}
                          onChange={(e) => setInlineReviewComment(e.target.value)}
                          placeholder="Nhập ghi chú hoặc phản hồi cho nhân viên..."
                          className="w-full p-3 bg-[#F9FAFB] rounded-[10px] text-[13px] text-[#111827] placeholder:text-[#9CA3AF] border border-[#E5E7EB] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all resize-none"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          disabled={isReviewing}
                          onClick={() => handleInlineReview(activeRequest.id, false)}
                          className="h-10 px-5 rounded-[8px] text-[13px] font-semibold text-[#DC2626] hover:bg-[#FEF2F2] border border-[#FCA5A5] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Icon name="close" size={16} />
                          <span>Từ chối</span>
                        </button>

                        <button
                          type="button"
                          disabled={isReviewing}
                          onClick={() => handleInlineReview(activeRequest.id, true)}
                          className="h-10 px-6 rounded-[8px] text-[13px] font-semibold bg-[#7C3AED] text-white hover:bg-[#6D28D9] active:bg-[#5B21B6] shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Icon name="done_all" size={16} />
                          <span>{isReviewing ? "Đang xử lý..." : "Duyệt đơn"}</span>
                        </button>
                      </div>
                    </>
                  ) : session?.employeeId === activeRequest.employeeId ? (
                    <div className="flex items-center justify-end pt-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleCancelRequest(activeRequest.id, activeRequest.requestCode)
                        }
                        className="h-10 px-4 rounded-[8px] border border-[#FCA5A5] text-[#DC2626] hover:bg-[#FEF2F2] text-[13px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Icon name="delete" size={16} />
                        <span>Hủy đơn này</span>
                      </button>
                    </div>
                  ) : (
                    <p className="text-[12px] text-[#6B7280] italic">
                      Đơn đang chờ quản lý xét duyệt.
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center text-[#6B7280]">
              Chọn một đơn nghỉ phép từ danh sách bên trái để xem chi tiết.
            </div>
          )}
        </div>
      </div>

      {/* CREATE LEAVE REQUEST MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-[20px] max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#E5E7EB] overflow-hidden my-auto">
            <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#EDE9FE]/40 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-[10px] bg-[#7C3AED] text-white flex items-center justify-center shadow-xs shrink-0">
                  <Icon name="add" size={18} />
                </div>
                <div>
                  <h3 className="font-heading text-[16px] font-bold text-[#111827]">
                    Nộp đơn xin nghỉ phép
                  </h3>
                  <p className="text-[12px] text-[#6B7280]">
                    Số ngày phép sẽ được trừ sau khi đơn được phê duyệt
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full text-[#6B7280] hover:bg-white flex items-center justify-center cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            <form
              id="createLeaveRequestForm"
              onSubmit={handleCreateSubmit}
              className="p-6 space-y-4 flex-1 overflow-y-auto"
            >
              {createError && (
                <div className="p-3.5 rounded-[10px] bg-[#FEF2F2] border border-[#FCA5A5] text-[#DC2626] text-[13px] flex items-center gap-2">
                  <Icon name="warning" size={16} />
                  <span>{createError}</span>
                </div>
              )}

              <div>
                <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">
                  Loại hình nghỉ phép <span className="text-[#EF4444]">*</span>
                </label>
                <select
                  required
                  value={newRequest.leaveTypeId || types[0]?.id || ""}
                  onChange={(e) =>
                    setNewRequest((prev) => ({ ...prev, leaveTypeId: e.target.value }))
                  }
                  className="w-full h-10 px-3 border border-[#E5E7EB] rounded-[10px] bg-white text-[13px] text-[#111827] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 cursor-pointer"
                >
                  {types.length === 0 && (
                    <option value="">-- Chọn loại hình nghỉ phép --</option>
                  )}
                  {types.map((t) => {
                    const b = balances.find((bal) => bal.leaveTypeId === t.id);
                    return (
                      <option key={t.id} value={t.id}>
                        {t.leaveTypeName} {b ? `— Còn ${b.remainingDays} ngày` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">
                    Từ ngày <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newRequest.startDate}
                    onChange={(e) =>
                      handleDatesChange(e.target.value, newRequest.endDate || e.target.value)
                    }
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-[10px] text-[13px] text-[#111827] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">
                    Đến ngày <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newRequest.endDate}
                    onChange={(e) =>
                      handleDatesChange(newRequest.startDate || e.target.value, e.target.value)
                    }
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-[10px] text-[13px] text-[#111827] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">
                  Số ngày công đăng ký nghỉ
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  required
                  value={newRequest.totalDays}
                  onChange={(e) =>
                    setNewRequest((prev) => ({
                      ...prev,
                      totalDays: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full h-10 px-3 border border-[#E5E7EB] rounded-[10px] text-[13px] text-[#111827] font-semibold focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">
                  Lý do xin nghỉ <span className="text-[#EF4444]">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={newRequest.reason}
                  onChange={(e) =>
                    setNewRequest((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  placeholder="Nêu rõ lý do xin nghỉ và kế hoạch bàn giao công việc..."
                  className="w-full p-3 border border-[#E5E7EB] rounded-[10px] text-[13px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 resize-none"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">
                  Tài liệu đính kèm (Không bắt buộc)
                </label>
                <input
                  type="url"
                  value={newRequest.attachmentUrl || ""}
                  onChange={(e) =>
                    setNewRequest((prev) => ({
                      ...prev,
                      attachmentUrl: e.target.value,
                    }))
                  }
                  placeholder="https://drive.google.com/... hoặc đường dẫn ảnh minh chứng"
                  className="w-full h-10 px-3 border border-[#E5E7EB] rounded-[10px] text-[13px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                />
              </div>
            </form>

            <div className="px-6 py-4 border-t border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 h-10 rounded-[10px] border border-[#E5E7EB] bg-white text-[13px] font-medium text-[#4B5563] hover:bg-[#F9FAFB] transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                form="createLeaveRequestForm"
                disabled={isSubmitting}
                className="px-5 h-10 rounded-[10px] bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[13px] font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Icon name="check_circle" size={16} />
                <span>{isSubmitting ? "Đang gửi đơn..." : "Gửi đơn xét duyệt"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
