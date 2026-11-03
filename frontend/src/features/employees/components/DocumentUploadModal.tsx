"use client";

import React, { useState } from "react";
import {
  CreateEmployeeDocumentInput,
  DocumentType,
  EmployeeDocument,
} from "@/features/employees/types/document";
import { createEmployeeDocument } from "@/features/employees/services/employeeService";

interface DocumentUploadModalProps {
  isOpen: boolean;
  employeeId: string;
  onClose: () => void;
  onSuccess: (document: EmployeeDocument) => void;
}

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: "CV", label: "Hồ sơ ứng tuyển (CV / Sơ yếu lý lịch)" },
  { value: "CitizenId", label: "Căn cước công dân (CCCD / CMND)" },
  { value: "Degree", label: "Bằng cấp đại học / Cao đẳng" },
  { value: "Certificate", label: "Chứng chỉ nghiệp vụ / Ngoại ngữ" },
  { value: "Contract", label: "Bản scan hợp đồng ký tay" },
  { value: "Medical", label: "Giấy khám sức khỏe định kỳ" },
  { value: "Other", label: "Giấy tờ / Tài liệu khác" },
];

export function DocumentUploadModal({
  isOpen,
  employeeId,
  onClose,
  onSuccess,
}: DocumentUploadModalProps) {
  const [documentType, setDocumentType] = useState<DocumentType>("Degree");
  const [documentTitle, setDocumentTitle] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileSizeKb, setFileSizeKb] = useState<number>(1024);
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentTitle.trim()) {
      setError("Vui lòng nhập tiêu đề tài liệu.");
      return;
    }
    if (!fileName.trim()) {
      setError("Vui lòng nhập tên file đính kèm.");
      return;
    }
    if (!fileUrl.trim()) {
      setError("Vui lòng cung cấp đường dẫn lưu trữ file (URL).");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: CreateEmployeeDocumentInput = {
        documentType,
        documentTitle: documentTitle.trim(),
        fileName: fileName.trim(),
        fileUrl: fileUrl.trim(),
        fileSizeBytes: Math.max(0, Math.round(fileSizeKb * 1024)),
        issueDate: issueDate || null,
        expiryDate: expiryDate || null,
        isVerified,
        notes: notes.trim() || null,
      };

      const newDoc = await createEmployeeDocument(employeeId, payload);
      onSuccess(newDoc);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi tải lên tài liệu."
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
              Thêm mới tài liệu số
            </h2>
            <p className="text-[12px] text-[#6B7280]">
              Lưu trữ hồ sơ, bằng cấp, chứng chỉ và giấy tờ pháp lý nhân sự
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
              Phân loại tài liệu <span className="text-[#EF4444]">*</span>
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as DocumentType)}
              className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#111827] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
            >
              {DOCUMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-1">
              Tiêu đề tài liệu <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Bằng Kỹ sư Công nghệ Thông tin"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#111827] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-[#374151] mb-1">
                Tên file đính kèm <span className="text-[#EF4444]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: bang-dai-hoc.pdf"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#111827] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#374151] mb-1">
                Kích thước (KB)
              </label>
              <input
                type="number"
                min={0}
                value={fileSizeKb}
                onChange={(e) => setFileSizeKb(Number(e.target.value))}
                className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#111827] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-1">
              Đường dẫn lưu trữ file (URL) <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="url"
              required
              placeholder="https://storage.company.com/hr-docs/..."
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#111827] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-[#374151] mb-1">
                Ngày cấp / hiệu lực
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#111827] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#374151] mb-1">
                Ngày hết hạn (nếu có)
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#111827] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isVerified"
              checked={isVerified}
              onChange={(e) => setIsVerified(e.target.checked)}
              className="w-4 h-4 text-[#7C3AED] border-[#D1D5DB] rounded focus:ring-[#7C3AED]"
            />
            <label
              htmlFor="isVerified"
              className="text-[13px] text-[#374151] font-medium cursor-pointer"
            >
              Đã đối chiếu & xác thực bản gốc bởi Phòng Nhân sự
            </label>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-1">
              Ghi chú thêm
            </label>
            <textarea
              rows={2}
              placeholder="VD: Bản sao công chứng còn hiệu lực 6 tháng..."
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
              {isSubmitting ? "Đang lưu..." : "Lưu tài liệu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

