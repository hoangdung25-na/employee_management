"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { formatCurrencyVND, formatDateVN } from "@/lib/utils/format";
import {
  CreateDecisionInput,
  DecisionType,
  EmployeeDecision,
} from "@/features/employees/types/decision";
import {
  createEmployeeDecision,
  deleteDecision,
  getEmployeeDecisions,
} from "@/features/employees/services/employeeService";
import {
  getDepartments,
  getPositions,
} from "@/features/departments/services/departmentService";
import {
  Department,
  PositionItem,
} from "@/features/departments/types/department";

interface EmployeeDecisionsTabProps {
  employeeId: string;
  canManage?: boolean;
  onProfileUpdated?: () => void;
  onCountChange?: (count: number) => void;
}

const TYPE_CONFIG: Record<
  DecisionType,
  {
    label: string;
    bg: string;
    text: string;
    icon: "emoji_events" | "shield_check" | "trending_up" | "military_tech";
  }
> = {
  Reward: {
    label: "Khen thưởng",
    bg: "bg-[#FEF3C7]",
    text: "text-[#92400E]",
    icon: "emoji_events",
  },
  Discipline: {
    label: "Kỷ luật",
    bg: "bg-[#FEE2E2]",
    text: "text-[#991B1B]",
    icon: "shield_check",
  },
  Transfer: {
    label: "Điều chuyển",
    bg: "bg-[#E0E7FF]",
    text: "text-[#3730A3]",
    icon: "trending_up",
  },
  Promotion: {
    label: "Bổ nhiệm",
    bg: "bg-[#EDE9FE]",
    text: "text-[#7C3AED]",
    icon: "military_tech",
  },
};

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  Active: {
    label: "Đang hiệu lực",
    bg: "bg-[#ECFDF5]",
    text: "text-[#059669]",
    dot: "bg-[#059669]",
  },
  Draft: {
    label: "Dự thảo",
    bg: "bg-[#FFFBEB]",
    text: "text-[#D97706]",
    dot: "bg-[#D97706]",
  },
  Cancelled: {
    label: "Đã hủy",
    bg: "bg-[#FEF2F2]",
    text: "text-[#DC2626]",
    dot: "bg-[#DC2626]",
  },
};

export function EmployeeDecisionsTab({
  employeeId,
  canManage = false,
  onProfileUpdated,
  onCountChange,
}: EmployeeDecisionsTabProps) {
  const [decisions, setDecisions] = useState<EmployeeDecision[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Departments & Positions for Transfer / Promotion
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<PositionItem[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Delete Action State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Decision Form State
  const todayStr = new Date().toISOString().slice(0, 10);
  const [decisionType, setDecisionType] = useState<DecisionType>("Reward");
  const [title, setTitle] = useState<string>("");
  const [decisionNumber, setDecisionNumber] = useState<string>("");
  const [effectiveDate, setEffectiveDate] = useState<string>(todayStr);
  const [signDate, setSignDate] = useState<string>(todayStr);
  const [signerName, setSignerName] = useState<string>("");
  const [signerPosition, setSignerPosition] = useState<string>("Tổng Giám đốc");
  const [amount, setAmount] = useState<string>("");
  const [newDepartmentId, setNewDepartmentId] = useState<string>("");
  const [newPositionId, setNewPositionId] = useState<string>("");
  const [newSalary, setNewSalary] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [attachmentUrl, setAttachmentUrl] = useState<string>("");

  const fetchDecisions = useCallback(async () => {
    if (!employeeId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getEmployeeDecisions(employeeId);
      setDecisions(data);
      if (onCountChange) {
        onCountChange(data.length);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tải danh sách quyết định nhân sự."
      );
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, onCountChange]);

  useEffect(() => {
    fetchDecisions();
  }, [fetchDecisions]);

  const handleOpenModal = async () => {
    setIsModalOpen(true);
    setModalError(null);
    if (departments.length === 0 || positions.length === 0) {
      try {
        const [deptList, posList] = await Promise.all([
          getDepartments(),
          getPositions(),
        ]);
        setDepartments(deptList);
        setPositions(posList);
      } catch (err) {
        console.error("Lỗi tải danh mục phòng ban/chức vụ:", err);
      }
    }
  };

  const handleResetForm = () => {
    setDecisionType("Reward");
    setTitle("");
    setDecisionNumber("");
    setEffectiveDate(todayStr);
    setSignDate(todayStr);
    setSignerName("");
    setSignerPosition("Tổng Giám đốc");
    setAmount("");
    setNewDepartmentId("");
    setNewPositionId("");
    setNewSalary("");
    setReason("");
    setAttachmentUrl("");
    setModalError(null);
  };

  const handleCreateDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setModalError("Vui lòng nhập trích yếu / tiêu đề quyết định.");
      return;
    }
    if (!effectiveDate) {
      setModalError("Vui lòng chọn ngày có hiệu lực.");
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      const payload: CreateDecisionInput = {
        decisionType,
        title: title.trim(),
        effectiveDate,
        signDate: signDate || effectiveDate,
        signerName: signerName.trim() || undefined,
        signerPosition: signerPosition.trim() || undefined,
        amount: amount ? Number(amount) : 0,
        newDepartmentId: newDepartmentId || undefined,
        newPositionId: newPositionId || undefined,
        newSalary: newSalary ? Number(newSalary) : undefined,
        reason: reason.trim() || undefined,
        attachmentUrl: attachmentUrl.trim() || undefined,
        decisionNumber: decisionNumber.trim() || undefined,
      };

      const created = await createEmployeeDecision(employeeId, payload);
      setDecisions((prev) => [created, ...prev]);
      if (onCountChange) {
        onCountChange(decisions.length + 1);
      }

      setToastMessage(
        `Đã ban hành quyết định ${created.decisionNumber}!${
          decisionType === "Transfer" || decisionType === "Promotion"
            ? " Hồ sơ phòng ban/chức vụ nhân viên đã được cập nhật."
            : ""
        }`
      );
      setTimeout(() => setToastMessage(null), 5000);

      setIsModalOpen(false);
      handleResetForm();

      if (
        (decisionType === "Transfer" || decisionType === "Promotion") &&
        onProfileUpdated
      ) {
        onProfileUpdated();
      }
    } catch (err) {
      setModalError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi ban hành quyết định nhân sự."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDecision = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteDecision(id);
      setDecisions((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: "Cancelled" as const } : d))
      );
      setToastMessage("Đã hủy quyết định nhân sự thành công.");
      setTimeout(() => setToastMessage(null), 4000);
      setDeletingId(null);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Không thể hủy quyết định này. Vui lòng thử lại."
      );
    } finally {
      setIsDeleting(false);
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

      {/* Tab Header Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-[16px] shadow-xs p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-[18px] leading-[26px] font-semibold text-[#111827]">
            Quyết định Nhân sự ({decisions.length})
          </h2>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            Theo dõi lịch sử khen thưởng, kỷ luật, điều chuyển công tác và bổ nhiệm chức vụ.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={handleOpenModal}
            className="h-10 px-4 rounded-[8px] bg-[#7C3AED] hover:bg-[#5B21B6] text-white text-[13px] font-medium shadow-xs flex items-center gap-2 transition-colors cursor-pointer shrink-0"
          >
            <Icon name="add" size={16} />
            <span>Ban hành Quyết định</span>
          </button>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-8 shadow-xs">
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-[#E5E7EB] rounded w-1/4" />
            <div className="h-10 bg-[#F3F4F6] rounded" />
            <div className="h-10 bg-[#F3F4F6] rounded" />
            <div className="h-10 bg-[#F3F4F6] rounded" />
          </div>
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="bg-[#FEF2F2] border border-[#EF4444] rounded-[16px] p-6 text-[#EF4444]">
          <p className="font-semibold text-[15px]">Lỗi khi tải quyết định</p>
          <p className="text-[13px] mt-1">{error}</p>
          <button
            type="button"
            onClick={fetchDecisions}
            className="mt-3 px-3 py-1.5 bg-[#EF4444] text-white rounded-[6px] text-[12px] font-medium cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && decisions.length === 0 && (
        <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-12 text-center shadow-xs">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center">
            <Icon name="military_tech" size={28} />
          </div>
          <h3 className="font-heading text-[16px] font-semibold text-[#111827]">
            Chưa có quyết định nhân sự nào
          </h3>
          <p className="text-[13px] text-[#6B7280] max-w-md mx-auto mt-1">
            Nhân viên này chưa có quyết định khen thưởng, kỷ luật, điều chuyển hay bổ nhiệm nào được ban hành.
          </p>
          {canManage && (
            <button
              type="button"
              onClick={handleOpenModal}
              className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-[8px] bg-[#7C3AED] text-white text-[13px] font-medium hover:bg-[#5B21B6] transition-colors cursor-pointer"
            >
              <Icon name="add" size={16} />
              <span>Ban hành quyết định đầu tiên</span>
            </button>
          )}
        </div>
      )}

      {/* Decisions Table */}
      {!isLoading && !error && decisions.length > 0 && (
        <div className="bg-white border border-[#E5E7EB] rounded-[16px] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-[#E5E7EB] text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider h-11 whitespace-nowrap">
                  <th className="px-6 py-3">Số quyết định</th>
                  <th className="px-6 py-3">Phân loại</th>
                  <th className="px-6 py-3">Trích yếu nội dung</th>
                  <th className="px-6 py-3">Tác động / Chi tiết</th>
                  <th className="px-6 py-3">Ngày hiệu lực</th>
                  <th className="px-6 py-3">Người ký</th>
                  <th className="px-6 py-3">Trạng thái</th>
                  {canManage && <th className="px-6 py-3 text-right">Thao tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-[13px] text-[#111827]">
                {decisions.map((dec) => {
                  const conf = TYPE_CONFIG[dec.decisionType] || TYPE_CONFIG.Reward;
                  const statusConf = STATUS_CONFIG[dec.status] || STATUS_CONFIG.Active;

                  return (
                    <tr
                      key={dec.id}
                      className="hover:bg-[#F9FAFB] transition-colors group"
                    >
                      <td className="px-6 py-4 font-mono font-bold text-[#7C3AED] whitespace-nowrap">
                        {dec.decisionNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${conf.bg} ${conf.text}`}
                        >
                          <Icon name={conf.icon} size={12} />
                          <span>{conf.label}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[#111827]">{dec.title}</p>
                        {dec.reason && (
                          <p className="text-[12px] text-[#6B7280] mt-0.5 line-clamp-2">
                            {dec.reason}
                          </p>
                        )}
                        {dec.attachmentUrl && (
                          <a
                            href={dec.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-[#7C3AED] hover:underline mt-1 font-medium"
                          >
                            <Icon name="attachment" size={12} />
                            <span>Xem tài liệu đính kèm</span>
                          </a>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[12px]">
                        {dec.amount > 0 && (
                          <p className="font-semibold text-[#059669]">
                            {dec.decisionType === "Discipline" ? "-" : "+"}
                            {formatCurrencyVND(dec.amount)}
                          </p>
                        )}
                        {dec.newDepartmentName && (
                          <p className="text-[#4B5563]">
                            Phòng: <span className="font-medium text-[#111827]">{dec.newDepartmentName}</span>
                          </p>
                        )}
                        {dec.newPositionName && (
                          <p className="text-[#4B5563]">
                            Chức vụ: <span className="font-medium text-[#111827]">{dec.newPositionName}</span>
                          </p>
                        )}
                        {dec.newSalary && dec.newSalary > 0 && (
                          <p className="text-[#4B5563]">
                            Lương mới: <span className="font-medium text-[#059669]">{formatCurrencyVND(dec.newSalary)}</span>
                          </p>
                        )}
                        {!dec.amount && !dec.newDepartmentName && !dec.newPositionName && !dec.newSalary && (
                          <span className="text-[#9CA3AF]">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-[#4B5563] whitespace-nowrap">
                        {formatDateVN(dec.effectiveDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-medium text-[#111827]">
                          {dec.signerName || "Ban Giám đốc"}
                        </p>
                        {dec.signerPosition && (
                          <p className="text-[11px] text-[#6B7280]">{dec.signerPosition}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${statusConf.bg} ${statusConf.text}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />
                          {statusConf.label}
                        </span>
                      </td>
                      {canManage && (
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          {dec.status !== "Cancelled" ? (
                            <button
                              type="button"
                              onClick={() => setDeletingId(dec.id)}
                              className="text-[#EF4444] hover:text-[#DC2626] text-[12px] font-medium inline-flex items-center gap-1 cursor-pointer px-2 py-1 rounded hover:bg-[#FEF2F2] transition-colors"
                              title="Hủy quyết định"
                            >
                              <Icon name="delete" size={14} />
                              <span>Hủy</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-[#9CA3AF] italic">Đã hủy</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete/Cancel Decision */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-[16px] max-w-md w-full p-6 my-auto shadow-xl border border-[#E5E7EB] space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-3 text-[#EF4444]">
              <div className="w-10 h-10 rounded-full bg-[#FEF2F2] flex items-center justify-center shrink-0">
                <Icon name="warning" size={20} />
              </div>
              <h3 className="font-heading text-[16px] font-semibold text-[#111827]">
                Xác nhận hủy quyết định
              </h3>
            </div>
            <p className="text-[13px] text-[#6B7280]">
              Bạn có chắc chắn muốn hủy văn bản quyết định này? Trạng thái sẽ được chuyển thành &ldquo;Đã hủy&rdquo;.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingId(null)}
                className="h-9 px-4 rounded-[8px] border border-[#E5E7EB] text-[13px] font-medium text-[#4B5563] hover:bg-[#F3F4F6] cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDeleteDecision(deletingId)}
                className="h-9 px-4 rounded-[8px] bg-[#EF4444] hover:bg-[#DC2626] text-white text-[13px] font-medium shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                {isDeleting && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>Xác nhận Hủy</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ban hành Quyết định */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-[16px] max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto shadow-xl border border-[#E5E7EB] animate-in fade-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center shrink-0">
                  <Icon name="military_tech" size={18} />
                </div>
                <h3 className="font-heading text-[18px] font-semibold text-[#111827]">
                  Ban hành Quyết định Nhân sự
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  handleResetForm();
                }}
                className="text-[#6B7280] hover:text-[#111827] p-1 rounded-md cursor-pointer shrink-0"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <form
              id="createDecisionForm"
              onSubmit={handleCreateDecision}
              className="p-6 space-y-4 flex-1 overflow-y-auto"
            >
              {modalError && (
                <div className="p-3 rounded-[8px] bg-[#FEF2F2] border border-[#EF4444] text-[#EF4444] text-[13px]">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] font-medium text-[#4B5563] block mb-1">
                    Loại quyết định <span className="text-[#EF4444]">*</span>
                  </label>
                  <select
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-[8px] text-[13px] focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 bg-white"
                    value={decisionType}
                    onChange={(e) => setDecisionType(e.target.value as DecisionType)}
                  >
                    <option value="Reward">Khen thưởng</option>
                    <option value="Discipline">Kỷ luật</option>
                    <option value="Transfer">Điều chuyển</option>
                    <option value="Promotion">Bổ nhiệm / Thăng chức</option>
                  </select>
                </div>

                <div>
                  <label className="text-[12px] font-medium text-[#4B5563] block mb-1">
                    Số Quyết định (Bỏ trống để tự cấp)
                  </label>
                  <input
                    type="text"
                    placeholder="Tự sinh: QD-2026-xxx"
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-[8px] text-[13px] font-mono focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                    value={decisionNumber}
                    onChange={(e) => setDecisionNumber(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#4B5563] block mb-1">
                  Trích yếu / Tiêu đề quyết định <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Về việc khen thưởng thành tích xuất sắc quý 3/2026..."
                  className="w-full h-10 px-3 border border-[#E5E7EB] rounded-[8px] text-[13px] focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {(decisionType === "Reward" || decisionType === "Discipline") && (
                <div>
                  <label className="text-[12px] font-medium text-[#4B5563] block mb-1">
                    {decisionType === "Reward" ? "Số tiền thưởng (VNĐ)" : "Số tiền phạt (VNĐ)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    placeholder="VD: 5000000"
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-[8px] text-[13px] font-mono focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              )}

              {(decisionType === "Transfer" || decisionType === "Promotion") && (
                <div className="space-y-3 p-3 bg-[#F9FAFB] rounded-[10px] border border-[#E5E7EB]">
                  <p className="text-[12px] font-semibold text-[#7C3AED] flex items-center gap-1">
                    <Icon name="bolt" size={14} />
                    <span>Tự động cập nhật hồ sơ nhân sự</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-[#4B5563] block mb-1">
                        Phòng ban mới
                      </label>
                      <select
                        className="w-full h-9 px-2.5 border border-[#E5E7EB] rounded-[6px] text-[12px] bg-white focus:border-[#7C3AED] focus:outline-none"
                        value={newDepartmentId}
                        onChange={(e) => setNewDepartmentId(e.target.value)}
                      >
                        <option value="">-- Giữ nguyên phòng ban --</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.departmentName} ({d.departmentCode})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-[#4B5563] block mb-1">
                        Chức vụ mới
                      </label>
                      <select
                        className="w-full h-9 px-2.5 border border-[#E5E7EB] rounded-[6px] text-[12px] bg-white focus:border-[#7C3AED] focus:outline-none"
                        value={newPositionId}
                        onChange={(e) => setNewPositionId(e.target.value)}
                      >
                        <option value="">-- Giữ nguyên chức vụ --</option>
                        {positions.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.positionName} ({p.positionCode})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-[#4B5563] block mb-1">
                      Mức lương cơ bản mới (VNĐ)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="500000"
                      placeholder="Bỏ trống nếu không điều chỉnh lương"
                      className="w-full h-9 px-2.5 border border-[#E5E7EB] rounded-[6px] text-[12px] font-mono focus:border-[#7C3AED] focus:outline-none bg-white"
                      value={newSalary}
                      onChange={(e) => setNewSalary(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] font-medium text-[#4B5563] block mb-1">
                    Ngày có hiệu lực <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-[8px] text-[13px] focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 font-mono"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[12px] font-medium text-[#4B5563] block mb-1">
                    Ngày ký ban hành
                  </label>
                  <input
                    type="date"
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-[8px] text-[13px] focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 font-mono"
                    value={signDate}
                    onChange={(e) => setSignDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] font-medium text-[#4B5563] block mb-1">
                    Người ký ban hành
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Trần Anh Tuấn"
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-[8px] text-[13px] focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[12px] font-medium text-[#4B5563] block mb-1">
                    Chức danh người ký
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Tổng Giám đốc"
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-[8px] text-[13px] focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                    value={signerPosition}
                    onChange={(e) => setSignerPosition(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#4B5563] block mb-1">
                  Căn cứ / Lý do ban hành
                </label>
                <textarea
                  rows={2}
                  placeholder="Căn cứ theo đề xuất của Phòng ban và kết quả đánh giá..."
                  className="w-full p-3 border border-[#E5E7EB] rounded-[8px] text-[13px] focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#4B5563] block mb-1">
                  Đường dẫn tài liệu đính kèm (URL)
                </label>
                <input
                  type="url"
                  placeholder="https://storage.company.com/decisions/qd-2026-001.pdf"
                  className="w-full h-10 px-3 border border-[#E5E7EB] rounded-[8px] text-[13px] font-mono focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                />
              </div>
            </form>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E5E7EB] bg-[#FAFAFA] shrink-0">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setIsModalOpen(false);
                  handleResetForm();
                }}
                className="h-10 px-4 rounded-[8px] border border-[#E5E7EB] bg-white text-[13px] font-medium text-[#4B5563] hover:bg-[#F3F4F6] cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                form="createDecisionForm"
                disabled={isSubmitting}
                className="h-10 px-5 rounded-[8px] bg-[#7C3AED] hover:bg-[#5B21B6] text-white text-[13px] font-medium shadow-xs inline-flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Xác nhận Ban hành</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
