"use client";

import React, { useCallback, useEffect, useState } from "react";
import { EmployeeDocument } from "@/features/employees/types/document";
import {
  deleteEmployeeDocument,
  getEmployeeDocuments,
} from "@/features/employees/services/employeeService";
import { DocumentUploadModal } from "./DocumentUploadModal";
import { formatDateVN } from "@/lib/utils/format";

interface EmployeeDocumentsTabProps {
  employeeId: string;
  canManage: boolean;
}

const DOCUMENT_TYPE_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  CV: { label: "CV Ứng tuyển", bg: "bg-blue-50", text: "text-blue-700" },
  CitizenId: { label: "CCCD / CMND", bg: "bg-emerald-50", text: "text-emerald-700" },
  Degree: { label: "Bằng cấp", bg: "bg-purple-50", text: "text-purple-700" },
  Certificate: { label: "Chứng chỉ", bg: "bg-indigo-50", text: "text-indigo-700" },
  Contract: { label: "Hợp đồng scan", bg: "bg-amber-50", text: "text-amber-700" },
  Medical: { label: "Khám sức khỏe", bg: "bg-rose-50", text: "text-rose-700" },
  Other: { label: "Tài liệu khác", bg: "bg-gray-100", text: "text-gray-700" },
};

function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function EmployeeDocumentsTab({
  employeeId,
  canManage,
}: EmployeeDocumentsTabProps) {
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchDocs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getEmployeeDocuments(employeeId);
      setDocuments(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tải danh mục tài liệu hồ sơ."
      );
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleDelete = async (docId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tài liệu này khỏi hồ sơ?")) {
      return;
    }
    setDeletingId(docId);
    try {
      await deleteEmployeeDocument(employeeId, docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      setToastMessage("Đã xóa tài liệu thành công.");
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi xóa tài liệu."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleUploadSuccess = (newDoc: EmployeeDocument) => {
    setDocuments((prev) => [newDoc, ...prev]);
    setToastMessage("Thêm tài liệu vào hồ sơ thành công!");
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-heading text-[18px] font-semibold text-[#111827]">
            Danh mục Tài liệu & Giấy tờ số ({documents.length})
          </h2>
          <p className="text-[13px] text-[#6B7280]">
            Các giấy tờ hồ sơ nhân sự được lưu trữ số hóa an toàn và xác thực
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="h-9 px-4 rounded-[8px] bg-[#7C3AED] text-white text-[13px] font-medium hover:bg-[#6D28D9] transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>+</span> Thêm tài liệu số
          </button>
        )}
      </div>

      {toastMessage && (
        <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-[8px] text-[13px] text-[#059669]">
          {toastMessage}
        </div>
      )}

      {/* Main Content */}
      {isLoading ? (
        <div className="py-12 text-center text-[#6B7280] text-[14px]">
          Đang tải danh mục tài liệu...
        </div>
      ) : error ? (
        <div className="p-4 bg-[#FEF2F2] border border-[#FCA5A5] rounded-[8px] text-[#EF4444] text-[13px]">
          {error}
        </div>
      ) : documents.length === 0 ? (
        <div className="py-12 text-center bg-white border border-[#E5E7EB] rounded-[12px] p-8">
          <p className="text-[#4B5563] font-medium">Chưa có tài liệu số nào được lưu trữ</p>
          <p className="text-[#9CA3AF] text-[13px] mt-1">
            Bấm &quot;Thêm tài liệu số&quot; để bổ sung CCCD, bằng cấp hoặc chứng chỉ cho nhân viên.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => {
            const badge = DOCUMENT_TYPE_LABELS[doc.documentType] || DOCUMENT_TYPE_LABELS.Other;
            return (
              <div
                key={doc.id}
                className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 shadow-xs hover:border-[#DDD6FE] transition-colors space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-[8px] bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center font-mono font-bold text-sm shrink-0">
                      📄
                    </div>
                    <div>
                      <h3 className="font-heading text-[14px] font-semibold text-[#111827] line-clamp-1">
                        {doc.documentTitle}
                      </h3>
                      <p className="text-[12px] text-[#6B7280] font-mono line-clamp-1">
                        {doc.fileName} • {formatFileSize(doc.fileSizeBytes)}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${badge.bg} ${badge.text}`}
                  >
                    {badge.label}
                  </span>
                </div>

                <div className="text-[12px] text-[#6B7280] space-y-1 bg-[#F9FAFB] p-2.5 rounded-[6px]">
                  <div className="flex items-center justify-between">
                    <span>Ngày cấp / hiệu lực:</span>
                    <span className="font-medium text-[#374151]">
                      {doc.issueDate ? formatDateVN(doc.issueDate) : "—"}
                    </span>
                  </div>
                  {doc.expiryDate && (
                    <div className="flex items-center justify-between">
                      <span>Ngày hết hạn:</span>
                      <span className="font-medium text-[#374151]">
                        {formatDateVN(doc.expiryDate)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span>Xác thực bản gốc:</span>
                    <span
                      className={`font-medium ${
                        doc.isVerified ? "text-[#059669]" : "text-[#D97706]"
                      }`}
                    >
                      {doc.isVerified ? "✓ Đã xác thực" : "Chờ đối chiếu"}
                    </span>
                  </div>
                  {doc.notes && (
                    <p className="text-[11px] text-[#9CA3AF] italic pt-1 border-t border-[#E5E7EB]">
                      {doc.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[12px] text-[#7C3AED] font-medium hover:underline inline-flex items-center gap-1"
                  >
                    Mở liên kết file ↗
                  </a>

                  {canManage && (
                    <button
                      type="button"
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      className="text-[12px] text-[#EF4444] hover:underline disabled:opacity-50 cursor-pointer"
                    >
                      {deletingId === doc.id ? "Đang xóa..." : "Xóa"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        employeeId={employeeId}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
