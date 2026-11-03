"use client";

import React, { useCallback, useEffect, useState } from "react";
import { EmployeeContract } from "@/features/employees/types/contract";
import { getEmployeeContracts } from "@/features/employees/services/employeeService";
import { ContractCreateModal } from "./ContractCreateModal";
import { formatCurrencyVND, formatDateVN } from "@/lib/utils/format";

interface EmployeeContractsTabProps {
  employeeId: string;
  currentSalary?: number;
  canManage: boolean;
  onSalaryUpdated?: (newSalary: number) => void;
}

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  Probation: "Thử việc (60 ngày)",
  FixedTerm1Y: "Xác định thời hạn 1 năm",
  FixedTerm3Y: "Xác định thời hạn 3 năm",
  Indefinite: "Không xác định thời hạn",
  Seasonal: "Mùa vụ / Dự án",
};

const STATUS_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  Active: { label: "Đang hiệu lực", bg: "bg-emerald-50", text: "text-emerald-700" },
  Expired: { label: "Đã hết hạn", bg: "bg-gray-100", text: "text-gray-600" },
  Draft: { label: "Bản nháp", bg: "bg-amber-50", text: "text-amber-700" },
  Terminated: { label: "Đã thanh lý", bg: "bg-rose-50", text: "text-rose-700" },
};

export function EmployeeContractsTab({
  employeeId,
  currentSalary = 0,
  canManage,
  onSalaryUpdated,
}: EmployeeContractsTabProps) {
  const [contracts, setContracts] = useState<EmployeeContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchContracts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getEmployeeContracts(employeeId);
      setContracts(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tải lịch sử hợp đồng lao động."
      );
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  // Check for contracts expiring within 30 days
  const expiringContract = contracts.find((c) => {
    if (c.status !== "Active" || !c.endDate) return false;
    const end = new Date(c.endDate);
    const today = new Date();
    const diffDays = Math.ceil(
      (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays >= 0 && diffDays <= 30;
  });

  const handleCreateSuccess = (newContract: EmployeeContract) => {
    setContracts((prev) => [
      newContract,
      ...prev.map((c) =>
        c.status === "Active" ? { ...c, status: "Expired" as const } : c
      ),
    ]);
    setToastMessage(
      `Đã ký hợp đồng ${newContract.contractNumber} thành công và tự động đồng bộ mức lương mới!`
    );
    setTimeout(() => setToastMessage(null), 4000);
    if (onSalaryUpdated) {
      onSalaryUpdated(newContract.contractSalary);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-heading text-[18px] font-semibold text-[#111827]">
            Lịch sử Hợp đồng Lao động ({contracts.length})
          </h2>
          <p className="text-[13px] text-[#6B7280]">
            Theo dõi toàn bộ các kỳ hợp đồng, mức đãi ngộ và thời hạn pháp lý
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="h-9 px-4 rounded-[8px] bg-[#7C3AED] text-white text-[13px] font-medium hover:bg-[#6D28D9] transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>+</span> Ký hợp đồng mới
          </button>
        )}
      </div>

      {/* Expiring Soon Alert */}
      {expiringContract && (
        <div className="p-4 bg-[#FFFBEB] border border-[#FCD34D] rounded-[10px] flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h4 className="text-[14px] font-semibold text-[#B45309]">
              Cảnh báo: Hợp đồng sắp hết hiệu lực!
            </h4>
            <p className="text-[13px] text-[#92400E]">
              Hợp đồng số <strong className="font-mono">{expiringContract.contractNumber}</strong> sẽ hết hạn vào ngày{" "}
              <strong>{formatDateVN(expiringContract.endDate!)}</strong>. Vui lòng xem xét đánh giá hiệu suất để chuẩn bị tái ký hợp đồng mới.
            </p>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-[8px] text-[13px] text-[#059669]">
          {toastMessage}
        </div>
      )}

      {/* Main Content */}
      {isLoading ? (
        <div className="py-12 text-center text-[#6B7280] text-[14px]">
          Đang tải lịch sử hợp đồng...
        </div>
      ) : error ? (
        <div className="p-4 bg-[#FEF2F2] border border-[#FCA5A5] rounded-[8px] text-[#EF4444] text-[13px]">
          {error}
        </div>
      ) : contracts.length === 0 ? (
        <div className="py-12 text-center bg-white border border-[#E5E7EB] rounded-[12px] p-8">
          <p className="text-[#4B5563] font-medium">Chưa có hợp đồng nào được lưu trong hệ thống</p>
          <p className="text-[#9CA3AF] text-[13px] mt-1">
            Bấm &quot;Ký hợp đồng mới&quot; để tạo thỏa thuận lao động chính thức cho nhân viên.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map((contract) => {
            const statusBadge =
              STATUS_BADGES[contract.status] || STATUS_BADGES.Draft;
            const typeLabel =
              CONTRACT_TYPE_LABELS[contract.contractType] ||
              contract.contractType;

            return (
              <div
                key={contract.id}
                className="bg-white border border-[#E5E7EB] rounded-[10px] p-5 shadow-xs hover:border-[#DDD6FE] transition-colors"
              >
                <div className="flex items-start justify-between flex-wrap gap-3 pb-3 border-b border-[#F3F4F6]">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[15px] font-bold text-[#7C3AED] bg-[#F5F3FF] px-2.5 py-0.5 rounded-[4px]">
                        {contract.contractNumber}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[12px] font-medium ${statusBadge.bg} ${statusBadge.text}`}
                      >
                        {statusBadge.label}
                      </span>
                    </div>
                    <p className="text-[14px] font-medium text-[#111827] mt-1.5">
                      Loại: {typeLabel}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[12px] text-[#6B7280]">Mức lương cơ bản</p>
                    <p className="text-[16px] font-bold text-[#059669] font-mono">
                      {formatCurrencyVND(contract.contractSalary)}
                    </p>
                    {contract.allowances > 0 && (
                      <p className="text-[12px] text-[#6B7280] font-mono">
                        + {formatCurrencyVND(contract.allowances)} phụ cấp
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[13px] pt-3 text-[#6B7280]">
                  <div>
                    <span className="block text-[11px] text-[#9CA3AF]">Ngày hiệu lực</span>
                    <span className="font-medium text-[#111827]">
                      {formatDateVN(contract.startDate)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-[#9CA3AF]">Ngày hết hạn</span>
                    <span className="font-medium text-[#111827]">
                      {contract.endDate ? formatDateVN(contract.endDate) : "Không xác định"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-[#9CA3AF]">Ngày ký kết</span>
                    <span className="font-medium text-[#111827]">
                      {contract.signedDate ? formatDateVN(contract.signedDate) : "—"}
                    </span>
                  </div>
                </div>

                {(contract.notes || contract.fileUrl) && (
                  <div className="mt-3 pt-3 border-t border-[#F3F4F6] flex items-center justify-between text-[12px] text-[#6B7280]">
                    <div>
                      {contract.notes && (
                        <span>
                          <strong className="text-[#374151]">Ghi chú:</strong> {contract.notes}
                        </span>
                      )}
                    </div>
                    {contract.fileUrl && (
                      <a
                        href={contract.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#7C3AED] font-medium hover:underline inline-flex items-center gap-1 shrink-0 ml-2"
                      >
                        Tải văn bản scan ↗
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <ContractCreateModal
        isOpen={isCreateModalOpen}
        employeeId={employeeId}
        currentSalary={currentSalary}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
