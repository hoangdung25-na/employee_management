"use client";

import React, { useCallback, useEffect, useState } from "react";
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

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  Pending: {
    label: "Chờ phê duyệt",
    bg: "bg-[#FFFBEB]",
    text: "text-[#D97706]",
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
    label: "Đã hủy bỏ",
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
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [newRequest, setNewRequest] = useState<Partial<CreateLeaveRequestInput>>({
    startDate: "",
    endDate: "",
    totalDays: 1,
    reason: "",
  });

  const handleOpenCreateModal = () => {
    const today = new Date().toISOString().slice(0, 10);
    setNewRequest({
      leaveTypeId: types[0]?.id,
      startDate: today,
      endDate: today,
      totalDays: 1,
      reason: "",
    });
    setIsCreateModalOpen(true);
    setCreateError(null);
  };

  // Review Modal (Manager / HR)
  const [reviewingRequest, setReviewingRequest] = useState<LeaveRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">("approve");
  const [reviewComment, setReviewComment] = useState<string>("");
  const [isReviewing, setIsReviewing] = useState<boolean>(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [balList, reqList, typeList] = await Promise.all([
        getMyLeaveBalances(),
        getLeaveRequests(),
        getLeaveTypes(),
      ]);
      setBalances(balList);
      setRequests(reqList);
      setTypes(typeList);
      if (typeList.length > 0 && !newRequest.leaveTypeId) {
        setNewRequest((prev) => ({ ...prev, leaveTypeId: typeList[0].id }));
      }
    } catch (err) {
      console.error("Lỗi tải dữ liệu nghỉ phép:", err);
    } finally {
      setIsLoading(false);
    }
  }, [newRequest.leaveTypeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate days between dates
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
    if (!newRequest.leaveTypeId || !newRequest.startDate || !newRequest.endDate || !newRequest.reason?.trim()) {
      setCreateError("Vui lòng điền đầy đủ các thông tin bắt buộc.");
      return;
    }

    // Check remaining balance
    const currentBal = balances.find((b) => b.leaveTypeId === newRequest.leaveTypeId);
    if (currentBal && (newRequest.totalDays ?? 1) > currentBal.remainingDays) {
      setCreateError(
        `Số ngày nghỉ đề xuất (${newRequest.totalDays} ngày) vượt quá số phép còn lại (${currentBal.remainingDays} ngày) của loại phép này.`
      );
      return;
    }

    setIsSubmitting(true);
    setCreateError(null);
    try {
      const created = await createLeaveRequest({
        leaveTypeId: newRequest.leaveTypeId,
        startDate: newRequest.startDate,
        endDate: newRequest.endDate,
        totalDays: Number(newRequest.totalDays ?? 1),
        reason: newRequest.reason.trim(),
        attachmentUrl: newRequest.attachmentUrl?.trim(),
      });

      setRequests((prev) => [created, ...prev]);
      setIsCreateModalOpen(false);
      const today = new Date().toISOString().slice(0, 10);
      setNewRequest({
        leaveTypeId: types[0]?.id,
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

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingRequest) return;

    setIsReviewing(true);
    try {
      const isApproved = reviewAction === "approve";
      const updated = await reviewLeaveRequest(reviewingRequest.id, {
        isApproved,
        reviewComment: reviewComment.trim(),
      });

      setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setReviewingRequest(null);
      setReviewComment("");
      setToastMessage(
        isApproved
          ? `Đã phê duyệt đơn nghỉ phép ${updated.requestCode} thành công.`
          : `Đã từ chối đơn nghỉ phép ${updated.requestCode}.`
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
    if (!confirm(`Bạn có chắc chắn muốn hủy đơn xin nghỉ phép ${code}? Số ngày phép sẽ được hoàn lại vào quỹ của bạn.`)) {
      return;
    }

    try {
      await cancelLeaveRequest(id);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "Cancelled" as const } : r))
      );
      setToastMessage(`Đã hủy bỏ đơn ${code} thành công.`);
      setTimeout(() => setToastMessage(null), 4000);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể hủy đơn này.");
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (statusFilter === "ALL") return true;
    return r.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
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
            Quản lý Nghỉ phép (Leave Management)
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            Theo dõi quỹ phép năm, nộp đơn xin nghỉ online và luồng phê duyệt cấp quản lý.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="h-10 px-4 rounded-[8px] bg-[#7C3AED] hover:bg-[#5B21B6] text-white text-[13px] font-medium shadow-xs flex items-center gap-2 transition-colors cursor-pointer shrink-0"
        >
          <Icon name="add" size={16} />
          <span>Nộp đơn xin nghỉ phép</span>
        </button>
      </div>

      {/* Leave Balances Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {balances.map((b) => {
          const percentUsed = b.entitledDays > 0 ? Math.min(100, Math.round((b.usedDays / b.entitledDays) * 100)) : 0;
          return (
            <div
              key={b.leaveTypeId}
              className="bg-white border border-[#E5E7EB] rounded-[16px] p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13px] font-bold text-[#111827]">
                    {b.leaveTypeName}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#EDE9FE] text-[#7C3AED]">
                    {b.leaveTypeCode}
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mb-2">
                  <span className="font-heading text-[28px] font-extrabold text-[#7C3AED]">
                    {b.remainingDays}
                  </span>
                  <span className="text-[13px] text-[#6B7280]">
                    / {b.entitledDays + b.carriedOverDays} ngày khả dụng
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-[#F3F4F6] overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full bg-[#7C3AED] transition-all duration-300"
                    style={{ width: `${percentUsed}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 text-center text-[11px] pt-3 border-t border-[#F3F4F6] text-[#6B7280]">
                <div>
                  <p className="font-bold text-[#111827]">{b.entitledDays}</p>
                  <p>Hạn mức</p>
                </div>
                <div>
                  <p className="font-bold text-[#059669]">{b.usedDays}</p>
                  <p>Đã dùng</p>
                </div>
                <div>
                  <p className="font-bold text-[#D97706]">{b.pendingDays}</p>
                  <p>Chờ duyệt</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Tabs & Requests Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-[16px] shadow-xs overflow-hidden">
        {/* Tab Filters */}
        <div className="p-4 border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: "ALL", label: "Tất cả đơn" },
              { id: "Pending", label: "Chờ phê duyệt" },
              { id: "Approved", label: "Đã phê duyệt" },
              { id: "Rejected", label: "Từ chối" },
              { id: "Cancelled", label: "Đã hủy" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`h-8 px-3 rounded-[6px] text-[12px] font-medium transition-colors cursor-pointer ${
                  statusFilter === tab.id
                    ? "bg-[#7C3AED] text-white shadow-xs"
                    : "text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-[12px] text-[#6B7280]">
            Tổng số: <strong className="text-[#111827]">{filteredRequests.length}</strong> đơn
          </span>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="p-8 space-y-3 animate-pulse">
            <div className="h-6 bg-[#F3F4F6] rounded w-1/4" />
            <div className="h-10 bg-[#F3F4F6] rounded" />
            <div className="h-10 bg-[#F3F4F6] rounded" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredRequests.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#F3F4F6] text-[#9CA3AF] flex items-center justify-center">
              <Icon name="history_edu" size={24} />
            </div>
            <p className="font-semibold text-[15px] text-[#111827]">
              Không có đơn xin nghỉ phép nào
            </p>
            <p className="text-[13px] text-[#6B7280] mt-1">
              Bạn chưa có đơn nghỉ phép nào trong trạng thái này.
            </p>
          </div>
        )}

        {/* Table */}
        {!isLoading && filteredRequests.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-[#E5E7EB] text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider h-11">
                  <th className="px-6 py-3">Mã đơn</th>
                  <th className="px-6 py-3">Nhân sự</th>
                  <th className="px-6 py-3">Loại nghỉ phép</th>
                  <th className="px-6 py-3">Thời gian nghỉ</th>
                  <th className="px-6 py-3">Số ngày</th>
                  <th className="px-6 py-3">Lý do</th>
                  <th className="px-6 py-3">Trạng thái</th>
                  <th className="px-6 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-[13px] text-[#111827]">
                {filteredRequests.map((req) => {
                  const conf = STATUS_CONFIG[req.status] || STATUS_CONFIG.Pending;
                  const isOwner = session?.employeeId === req.employeeId;

                  return (
                    <tr key={req.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-[#7C3AED] whitespace-nowrap">
                        {req.requestCode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-medium text-[#111827]">{req.employeeName}</p>
                        <p className="text-[11px] text-[#6B7280]">
                          {req.employeeCode} {req.departmentName ? `• ${req.departmentName}` : ""}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-[#374151]">{req.leaveTypeName}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-[#4B5563] whitespace-nowrap">
                        {formatDateVN(req.startDate)}
                        {req.startDate !== req.endDate && ` → ${formatDateVN(req.endDate)}`}
                      </td>
                      <td className="px-6 py-4 font-semibold text-[#7C3AED] whitespace-nowrap">
                        {req.totalDays} ngày
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-[12px] text-[#374151] line-clamp-2">{req.reason}</p>
                        {req.attachmentUrl && (
                          <a
                            href={req.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-[#7C3AED] hover:underline mt-1 font-medium"
                          >
                            <Icon name="attachment" size={12} />
                            <span>Minh chứng</span>
                          </a>
                        )}
                        {req.reviewComment && (
                          <p className="text-[11px] text-[#6B7280] italic mt-1">
                            Nhận xét: {req.reviewComment}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${conf.bg} ${conf.text}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                          {conf.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* Cancel button for own pending request */}
                          {req.status === "Pending" && (isOwner || hasRole("SUPER_ADMIN")) && (
                            <button
                              type="button"
                              onClick={() => handleCancelRequest(req.id, req.requestCode)}
                              className="text-[#EF4444] hover:text-[#DC2626] text-[12px] font-medium px-2 py-1 rounded hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                            >
                              Hủy đơn
                            </button>
                          )}

                          {/* Review buttons for Manager / HR */}
                          {req.status === "Pending" && canReview && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setReviewingRequest(req);
                                  setReviewAction("approve");
                                  setReviewComment("");
                                }}
                                className="h-7 px-2.5 rounded-[6px] bg-[#ECFDF5] text-[#059669] hover:bg-[#059669] hover:text-white text-[12px] font-medium transition-colors cursor-pointer"
                              >
                                Duyệt
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setReviewingRequest(req);
                                  setReviewAction("reject");
                                  setReviewComment("");
                                }}
                                className="h-7 px-2.5 rounded-[6px] bg-[#FEF2F2] text-[#DC2626] hover:bg-[#DC2626] hover:text-white text-[12px] font-medium transition-colors cursor-pointer"
                              >
                                Từ chối
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nộp đơn xin nghỉ phép */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-[16px] max-w-lg w-full p-6 shadow-xl border border-[#E5E7EB] space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <h3 className="font-heading text-[18px] font-semibold text-[#111827]">
                Nộp Đơn Xin Nghỉ Phép
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#6B7280] hover:text-[#111827] p-1 rounded-md cursor-pointer"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-[8px] bg-[#FEF2F2] border border-[#EF4444] text-[#EF4444] text-[13px]">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-[12px] font-medium text-[#4B5563] block mb-1">
                  Loại nghỉ phép <span className="text-[#EF4444]">*</span>
                </label>
                <select
                  required
                  className="w-full h-10 px-3 border border-[#E5E7EB] rounded-[8px] text-[13px] bg-white focus:border-[#7C3AED] focus:outline-none"
                  value={newRequest.leaveTypeId}
                  onChange={(e) =>
                    setNewRequest({ ...newRequest, leaveTypeId: e.target.value })
                  }
                >
                  {types.map((t) => {
                    const b = balances.find((bal) => bal.leaveTypeId === t.id);
                    return (
                      <option key={t.id} value={t.id}>
                        {t.leaveTypeName} (Còn {b?.remainingDays ?? t.defaultDaysPerYear} ngày)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] font-medium text-[#4B5563] block mb-1">
                    Từ ngày <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-[8px] text-[13px] font-mono focus:border-[#7C3AED] focus:outline-none"
                    value={newRequest.startDate}
                    onChange={(e) =>
                      handleDatesChange(e.target.value, newRequest.endDate || e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="text-[12px] font-medium text-[#4B5563] block mb-1">
                    Đến ngày <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-[8px] text-[13px] font-mono focus:border-[#7C3AED] focus:outline-none"
                    value={newRequest.endDate}
                    onChange={(e) =>
                      handleDatesChange(newRequest.startDate || e.target.value, e.target.value)
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#4B5563] block mb-1">
                  Tổng số ngày nghỉ tính theo công <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  className="w-full h-10 px-3 border border-[#E5E7EB] rounded-[8px] text-[13px] font-mono focus:border-[#7C3AED] focus:outline-none"
                  value={newRequest.totalDays || ""}
                  onChange={(e) =>
                    setNewRequest({ ...newRequest, totalDays: Number(e.target.value) })
                  }
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#4B5563] block mb-1">
                  Lý do xin nghỉ phép <span className="text-[#EF4444]">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="VD: Gia đình có việc riêng cần giải quyết..."
                  className="w-full p-3 border border-[#E5E7EB] rounded-[8px] text-[13px] focus:border-[#7C3AED] focus:outline-none"
                  value={newRequest.reason || ""}
                  onChange={(e) =>
                    setNewRequest({ ...newRequest, reason: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#4B5563] block mb-1">
                  Đường dẫn tài liệu / Giấy xác nhận y tế (nếu có)
                </label>
                <input
                  type="url"
                  placeholder="https://storage.company.com/leaves/evidence.pdf"
                  className="w-full h-10 px-3 border border-[#E5E7EB] rounded-[8px] text-[13px] font-mono focus:border-[#7C3AED] focus:outline-none"
                  value={newRequest.attachmentUrl || ""}
                  onChange={(e) =>
                    setNewRequest({ ...newRequest, attachmentUrl: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsCreateModalOpen(false)}
                  className="h-10 px-4 rounded-[8px] border border-[#E5E7EB] text-[13px] font-medium text-[#4B5563] hover:bg-[#F3F4F6] cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 px-5 rounded-[8px] bg-[#7C3AED] hover:bg-[#5B21B6] text-white text-[13px] font-medium shadow-xs cursor-pointer inline-flex items-center gap-2"
                >
                  {isSubmitting && (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>Gửi đơn xin nghỉ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Phê duyệt / Từ chối (Manager / HR) */}
      {reviewingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-[16px] max-w-md w-full p-6 shadow-xl border border-[#E5E7EB] space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <h3 className="font-heading text-[18px] font-semibold text-[#111827]">
                {reviewAction === "approve" ? "Phê duyệt đơn nghỉ phép" : "Từ chối đơn nghỉ phép"}
              </h3>
              <button
                type="button"
                onClick={() => setReviewingRequest(null)}
                className="text-[#6B7280] hover:text-[#111827] p-1 rounded-md cursor-pointer"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div className="bg-[#F9FAFB] p-3 rounded-[8px] text-[12px] space-y-1 text-[#4B5563]">
              <p>
                Mã đơn: <strong className="text-[#7C3AED]">{reviewingRequest.requestCode}</strong>
              </p>
              <p>
                Nhân viên: <strong className="text-[#111827]">{reviewingRequest.employeeName}</strong> ({reviewingRequest.employeeCode})
              </p>
              <p>
                Loại phép: <strong>{reviewingRequest.leaveTypeName}</strong> ({reviewingRequest.totalDays} ngày)
              </p>
              <p>
                Thời gian: {formatDateVN(reviewingRequest.startDate)} → {formatDateVN(reviewingRequest.endDate)}
              </p>
              <p className="italic">Lý do: &quot;{reviewingRequest.reason}&quot;</p>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="text-[12px] font-medium text-[#4B5563] block mb-1">
                  Nhận xét phê duyệt / Lý do từ chối
                </label>
                <textarea
                  rows={2}
                  placeholder={reviewAction === "approve" ? "Đồng ý cho nghỉ phép theo kế hoạch..." : "Từ chối do trùng lịch cao điểm bàn giao dự án..."}
                  className="w-full p-3 border border-[#E5E7EB] rounded-[8px] text-[13px] focus:border-[#7C3AED] focus:outline-none"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isReviewing}
                  onClick={() => setReviewingRequest(null)}
                  className="h-9 px-4 rounded-[8px] border border-[#E5E7EB] text-[13px] font-medium text-[#4B5563] hover:bg-[#F3F4F6] cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isReviewing}
                  className={`h-9 px-4 rounded-[8px] text-white text-[13px] font-medium shadow-xs cursor-pointer inline-flex items-center gap-1.5 ${
                    reviewAction === "approve"
                      ? "bg-[#059669] hover:bg-[#047857]"
                      : "bg-[#DC2626] hover:bg-[#B91C1C]"
                  }`}
                >
                  {isReviewing && (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>{reviewAction === "approve" ? "Xác nhận Phê duyệt" : "Xác nhận Từ chối"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
