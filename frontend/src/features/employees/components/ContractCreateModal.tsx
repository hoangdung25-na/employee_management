"use client";

import React, { useState } from "react";
import {
  ContractType,
  CreateEmployeeContractInput,
  EmployeeContract,
} from "@/features/employees/types/contract";
import { createEmployeeContract } from "@/features/employees/services/employeeService";

interface ContractCreateModalProps {
  isOpen: boolean;
  employeeId: string;
  currentSalary?: number;
  onClose: () => void;
  onSuccess: (contract: EmployeeContract) => void;
}

const CONTRACT_TYPES: { value: ContractType; label: string }[] = [
  { value: "Probation", label: "Hợp đồng thử việc (60 ngày)" },
  { value: "FixedTerm1Y", label: "Hợp đồng xác định thời hạn 1 năm" },
  { value: "FixedTerm3Y", label: "Hợp đồng xác định thời hạn 3 năm" },
  { value: "Indefinite", label: "Hợp đồng không xác định thời hạn (Vô thời hạn)" },
  { value: "Seasonal", label: "Hợp đồng theo mùa vụ / Dự án ngắn hạn" },
];

export function ContractCreateModal({
  isOpen,
  employeeId,
  currentSalary = 0,
  onClose,
  onSuccess,
}: ContractCreateModalProps) {
  const [contractType, setContractType] = useState<ContractType>("FixedTerm1Y");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState("");
  const [signedDate, setSignedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [contractSalary, setContractSalary] = useState<number>(currentSalary);
  const [allowances, setAllowances] = useState<number>(0);
  const [fileUrl, setFileUrl] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate) {
      setError("Vui lòng chọn ngày bắt đầu hợp đồng.");
      return;
    }
    if (endDate && endDate < startDate) {
      setError("Ngày kết thúc hợp đồng không được trước ngày bắt đầu.");
      return;
    }
    if (contractSalary < 0) {
      setError("Mức lương hợp đồng phải lớn hơn hoặc bằng 0.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: CreateEmployeeContractInput = {
        contractType,
        startDate,
        endDate: endDate || null,
        signedDate: signedDate || null,
        contractSalary: Number(contractSalary),
        allowances: Number(allowances),
        fileUrl: fileUrl.trim() || null,
        notes: notes.trim() || null,
      };

      const newContract = await createEmployeeContract(employeeId, payload);
      onSuccess(newContract);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi tạo hợp đồng lao động."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-[12px] border border-[#E5E7EB] shadow-lg w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
          <div>
            <h2 className="font-heading text-[18px] font-bold text-[#111827]">
              Ký mới hợp đồng lao động
            </h2>
            <p className="text-[12px] text-[#6B7280]">
              Tự động cấp mã hợp đồng, chuyển hợp đồng cũ sang Hết hạn và đồng bộ mức lương
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-[#4B5563] text-xl font-medium w-8 h-8 rounded-[6px] hover:bg-[#F3F4F6] flex items-center justify-center transition-colors cursor-pointer"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-[8px] text-[13px] text-[#EF4444]">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-1">
              Hình thức / Loại hợp đồng <span className="text-[#EF4444]">*</span>
            </label>
            <select
              value={contractType}
              onChange={(e) => setContractType(e.target.value as ContractType)}
              className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#111827] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
            >
              {CONTRACT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-[#374151] mb-1">
                Ngày bắt đầu hiệu lực <span className="text-[#EF4444]">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#111827] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#374151] mb-1">
                Ngày kết thúc (nếu có)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#111827] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-1">
              Ngày ký kết
            </label>
            <input
              type="date"
              value={signedDate}
              onChange={(e) => setSignedDate(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#111827] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-[#374151] mb-1">
                Mức lương cơ bản (VND) <span className="text-[#EF4444]">*</span>
              </label>
              <input
                type="number"
                min={0}
                required
                value={contractSalary}
                onChange={(e) => setContractSalary(Number(e.target.value))}
                className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#111827] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 font-mono"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#374151] mb-1">
                Phụ cấp & Đãi ngộ (VND)
              </label>
              <input
                type="number"
                min={0}
                value={allowances}
                onChange={(e) => setAllowances(Number(e.target.value))}
                className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#111827] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-1">
              Đường dẫn bản scan hợp đồng (URL)
            </label>
            <input
              type="url"
              placeholder="https://storage.company.com/contracts/hdld-..."
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#111827] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-1">
              Ghi chú hợp đồng
            </label>
            <textarea
              rows={2}
              placeholder="VD: Điều chỉnh tăng lương định kỳ năm 2026..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-white border border-[#E5E7EB] rounded-[8px] text-[13px] text-[#111827] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-10 px-4 rounded-[8px] border border-[#E5E7EB] text-[#4B5563] text-[13px] font-medium hover:bg-[#F3F4F6] transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-5 rounded-[8px] bg-[#7C3AED] text-white text-[13px] font-medium hover:bg-[#6D28D9] transition-colors shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? "Đang xử lý..." : "Ký hợp đồng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

