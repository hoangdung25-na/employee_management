"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { EmployeeDetail } from "@/features/employees/types/employee";
import {
  getEmployeeById,
  terminateEmployee,
} from "@/features/employees/services/employeeService";
import { EmployeeFormModal } from "@/features/employees/components/EmployeeFormModal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  formatCurrencyVND,
  formatDateVN,
  getInitials,
} from "@/lib/utils/format";

interface EmployeeDetailViewProps {
  id: string;
}

export function EmployeeDetailView({ id }: EmployeeDetailViewProps) {
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSalaryVisible, setIsSalaryVisible] = useState<boolean>(false);
  const [avatarError, setAvatarError] = useState<boolean>(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  // Termination Modal State
  const [isTerminateModalOpen, setIsTerminateModalOpen] =
    useState<boolean>(false);
  const [terminationDate, setTerminationDate] = useState<string>("");
  const [terminationReason, setTerminationReason] = useState<string>("");
  const [isTerminating, setIsTerminating] = useState<boolean>(false);
  const [terminateError, setTerminateError] = useState<string | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getEmployeeById(id);
      setEmployee(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tải hồ sơ chi tiết nhân sự."
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleEditSuccess = (updated: EmployeeDetail) => {
    setEmployee(updated);
    setIsEditModalOpen(false);
    setToastMessage("Cập nhật hồ sơ thành viên thành công!");
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleTerminateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminationReason.trim()) {
      setTerminateError("Vui lòng nhập lý do thôi việc chi tiết.");
      return;
    }

    setIsTerminating(true);
    setTerminateError(null);
    try {
      await terminateEmployee(id, {
        terminationDate,
        terminationReason: terminationReason.trim(),
      });
      setIsTerminateModalOpen(false);
      setToastMessage(
        "Đã thực hiện thủ tục thôi việc và thu hồi quyền truy cập thành công!"
      );
      setTimeout(() => setToastMessage(null), 4000);
      fetchDetail();
    } catch (err) {
      setTerminateError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi thực hiện thủ tục thôi việc."
      );
    } finally {
      setIsTerminating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-[#E5E7EB] rounded animate-pulse" />
        <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#EDE9FE] animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-48 bg-[#E5E7EB] rounded animate-pulse" />
              <div className="h-4 w-32 bg-[#F3F4F6] rounded animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#E5E7EB]">
            <div className="h-24 bg-[#F9FAFB] rounded animate-pulse" />
            <div className="h-24 bg-[#F9FAFB] rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-[24px] font-bold text-[#111827]">
            Hồ sơ Nhân sự
          </h1>
          <Link
            href="/employees"
            className="h-9 px-3 rounded-[6px] border border-[#7C3AED] text-[#7C3AED] text-[13px] font-medium hover:bg-[#F5F3FF] transition-colors"
          >
            ← Quay lại danh sách
          </Link>
        </div>

        <div className="bg-[#FEF2F2] border border-[#EF4444] rounded-[8px] p-6 text-[#EF4444]">
          <p className="font-semibold text-[15px]">Không thể mở hồ sơ nhân sự</p>
          <p className="text-[13px] mt-1">
            {error || "Hồ sơ không tồn tại hoặc đã bị xóa."}
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={fetchDetail}
              className="h-8 px-4 rounded-[6px] bg-[#EF4444] text-white text-[12px] font-medium hover:bg-[#DC2626] transition-colors cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isTerminated = employee.status === "Terminated";
  const showAvatar = Boolean(employee.avatarUrl) && !avatarError;

  return (
    <div className="space-y-6">
      {/* Toast message */}
      {toastMessage && (
        <div className="p-4 rounded-[8px] bg-[#ECFDF5] border border-[#059669] text-[#065F46] flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#059669]" />
            <p className="text-[14px] font-medium">{toastMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-[12px] font-bold text-[#065F46] hover:opacity-75 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {showAvatar ? (
              <div className="relative w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 border-[#DDD6FE] bg-[#F5F3FF]">
                <Image
                  src={employee.avatarUrl!}
                  alt={employee.fullName}
                  fill
                  sizes="64px"
                  className="object-cover"
                  onError={() => setAvatarError(true)}
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#EDE9FE] text-[#7C3AED] font-heading font-bold text-[22px] flex items-center justify-center shrink-0 border-2 border-[#DDD6FE]">
                {getInitials(employee.fullName)}
              </div>
            )}

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-heading text-[26px] leading-[34px] font-bold text-[#111827]">
                  {employee.fullName}
                </h1>
                <StatusBadge status={employee.status} />
              </div>

              <div className="flex items-center gap-2 text-[13px] leading-[20px] text-[#6B7280] mt-1 flex-wrap">
                <span className="font-mono text-[#7C3AED] font-semibold bg-[#F5F3FF] px-2 py-0.5 rounded-[4px]">
                  {employee.employeeCode}
                </span>
                <span>•</span>
                <span className="font-medium text-[#111827]">
                  {employee.positionName}
                </span>
                <span>•</span>
                <span>{employee.departmentName}</span>
                <span>•</span>
                <span className="font-mono text-[11px] text-[#9CA3AF]">
                  ID: {employee.id}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/employees"
              className="h-10 px-4 rounded-[8px] border border-[#E5E7EB] text-[#4B5563] text-[13px] font-medium hover:bg-[#F3F4F6] transition-colors inline-flex items-center"
            >
              ← Danh sách
            </Link>

            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="h-10 px-4 rounded-[8px] border border-[#7C3AED] text-[#7C3AED] text-[13px] font-medium hover:bg-[#F5F3FF] transition-colors cursor-pointer"
            >
              Chỉnh sửa hồ sơ
            </button>

            {!isTerminated && (
              <button
                type="button"
                onClick={() => {
                  setTerminationDate(new Date().toISOString().slice(0, 10));
                  setTerminationReason("");
                  setTerminateError(null);
                  setIsTerminateModalOpen(true);
                }}
                className="h-10 px-4 rounded-[8px] bg-[#DC2626] text-white text-[13px] font-medium hover:bg-[#B91C1C] transition-colors shadow-xs cursor-pointer"
              >
                Thủ tục thôi việc
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Profile Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Thông tin cá nhân & Liên hệ */}
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />
            <h2 className="font-heading text-[16px] font-semibold text-[#111827]">
              1. Định danh Cá nhân & Liên hệ
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 text-[13px]">
            <div>
              <p className="text-[#6B7280]">Họ và tên</p>
              <p className="font-medium text-[#111827] mt-0.5">
                {employee.fullName}
              </p>
            </div>
            <div>
              <p className="text-[#6B7280]">Số CCCD / Định danh</p>
              <p className="font-mono font-medium text-[#111827] mt-0.5">
                {employee.citizenId || "—"}
              </p>
            </div>
            <div>
              <p className="text-[#6B7280]">Ngày sinh</p>
              <p className="text-[#111827] mt-0.5">
                {formatDateVN(employee.dateOfBirth)}
              </p>
            </div>
            <div>
              <p className="text-[#6B7280]">Giới tính</p>
              <p className="text-[#111827] mt-0.5">
                {employee.gender === "Male"
                  ? "Nam (Male)"
                  : employee.gender === "Female"
                  ? "Nữ (Female)"
                  : "Khác"}
              </p>
            </div>
            <div>
              <p className="text-[#6B7280]">Email công việc</p>
              <p className="text-[#111827] mt-0.5 font-medium">
                {employee.workEmail}
              </p>
            </div>
            <div>
              <p className="text-[#6B7280]">Số điện thoại</p>
              <p className="font-mono text-[#111827] mt-0.5">
                {employee.phoneNumber || "Chưa cập nhật"}
              </p>
            </div>
            <div>
              <p className="text-[#6B7280]">Email cá nhân</p>
              <p className="text-[#111827] mt-0.5">
                {employee.personalEmail || "Chưa cập nhật"}
              </p>
            </div>
            <div>
              <p className="text-[#6B7280]">Địa chỉ thường trú</p>
              <p className="text-[#111827] mt-0.5">
                {employee.address || "Chưa cập nhật"}
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Vị trí & Tổ chức */}
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0D9488]" />
            <h2 className="font-heading text-[16px] font-semibold text-[#111827]">
              2. Vị trí Công tác & Tổ chức
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 text-[13px]">
            <div>
              <p className="text-[#6B7280]">Phòng ban</p>
              <p className="font-medium text-[#111827] mt-0.5">
                {employee.departmentName}
              </p>
            </div>
            <div>
              <p className="text-[#6B7280]">Chức vụ</p>
              <p className="font-medium text-[#111827] mt-0.5">
                {employee.positionName}
              </p>
            </div>
            <div>
              <p className="text-[#6B7280]">Quản lý trực tiếp</p>
              <p className="text-[#111827] mt-0.5">
                {employee.directManagerName || "Không có (Ban Giám đốc)"}
              </p>
            </div>
            <div>
              <p className="text-[#6B7280]">Trạng thái làm việc</p>
              <div className="mt-1">
                <StatusBadge status={employee.status} />
              </div>
            </div>
            <div>
              <p className="text-[#6B7280]">Ngày chính thức gia nhập</p>
              <p className="font-medium text-[#111827] mt-0.5">
                {formatDateVN(employee.hireDate)}
              </p>
            </div>
            <div>
              <p className="text-[#6B7280]">Ngày kết thúc thử việc</p>
              <p className="text-[#111827] mt-0.5">
                {employee.probationEndDate
                  ? formatDateVN(employee.probationEndDate)
                  : "Chưa thiết lập"}
              </p>
            </div>

            {/* Thông tin thôi việc nếu có */}
            {isTerminated && (
              <div className="col-span-2 p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-[8px] text-[#991B1B]">
                <p className="font-semibold text-[13px]">
                  Hồ sơ thôi việc (Offboarded):
                </p>
                <p className="mt-1">
                  • Ngày thôi việc:{" "}
                  <span className="font-medium">
                    {employee.terminationDate
                      ? formatDateVN(employee.terminationDate)
                      : "—"}
                  </span>
                </p>
                <p className="mt-0.5">
                  • Lý do thôi việc: {employee.terminationReason || "—"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Đãi ngộ, Thuế & Ngân hàng */}
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
            <h2 className="font-heading text-[16px] font-semibold text-[#111827]">
              3. Chế độ Đãi ngộ, Bảo hiểm & Tài khoản
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 text-[13px]">
            <div className="col-span-2">
              <p className="text-[#6B7280]">Lương cơ bản hàng tháng</p>
              <div className="flex items-center gap-3 mt-1">
                {isSalaryVisible ? (
                  <span className="font-mono text-[16px] font-semibold text-[#0D9488] bg-[#F0FDFA] border border-[#CCFBF1] px-3 py-1 rounded-[6px]">
                    {formatCurrencyVND(employee.baseSalary)}
                  </span>
                ) : (
                  <span className="font-mono text-[16px] text-[#9CA3AF] bg-[#F9FAFB] border border-[#E5E7EB] px-3 py-1 rounded-[6px] select-none">
                    •••••••• ₫
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsSalaryVisible((prev) => !prev)}
                  className="h-8 px-3 rounded-[6px] text-[12px] font-medium border border-[#7C3AED] text-[#7C3AED] hover:bg-[#F5F3FF] transition-colors cursor-pointer"
                >
                  {isSalaryVisible ? "Ẩn số tiền" : "Hiện mức lương"}
                </button>
              </div>
              {employee.baseSalary === 0 && (
                <p className="text-[11px] text-[#9CA3AF] mt-1 italic">
                  * Mức lương được ẩn hoặc gán 0 nếu tài khoản không có quyền xem
                  đãi ngộ.
                </p>
              )}
            </div>

            <div>
              <p className="text-[#6B7280]">Mã số thuế TNCN</p>
              <p className="font-mono font-medium text-[#111827] mt-0.5">
                {employee.taxCode || "Chưa đăng ký"}
              </p>
            </div>

            <div>
              <p className="text-[#6B7280]">Mã số BHXH</p>
              <p className="font-mono font-medium text-[#111827] mt-0.5">
                {employee.socialInsuranceNumber || "Chưa tham gia"}
              </p>
            </div>

            <div>
              <p className="text-[#6B7280]">Số tài khoản Ngân hàng</p>
              <p className="font-mono font-medium text-[#111827] mt-0.5">
                {employee.bankAccountNumber || "Chưa cập nhật"}
              </p>
            </div>

            <div>
              <p className="text-[#6B7280]">Ngân hàng thụ hưởng</p>
              <p className="font-medium text-[#111827] mt-0.5">
                {employee.bankName || "Chưa cập nhật"}
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: Nhật ký Kiểm toán & Bảo mật */}
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#6B7280]" />
            <h2 className="font-heading text-[16px] font-semibold text-[#111827]">
              4. Dấu vết Kiểm toán & Bảo mật (Audit)
            </h2>
          </div>

          <div className="space-y-3 text-[13px]">
            <div>
              <p className="text-[#6B7280]">Thời điểm khởi tạo hồ sơ</p>
              <p className="font-mono text-[#111827] mt-0.5">
                {new Date(employee.createdAt).toLocaleString("vi-VN")}
              </p>
            </div>

            <div>
              <p className="text-[#6B7280]">Thời điểm cập nhật gần nhất</p>
              <p className="font-mono text-[#111827] mt-0.5">
                {employee.updatedAt
                  ? new Date(employee.updatedAt).toLocaleString("vi-VN")
                  : "Chưa có chỉnh sửa nào"}
              </p>
            </div>

            <div className="pt-2 border-t border-[#E5E7EB]">
              <p className="text-[#6B7280]">Tình trạng tài khoản nội bộ (RBAC)</p>
              <p className="text-[#111827] mt-0.5">
                {isTerminated ? (
                  <span className="inline-flex items-center gap-1.5 text-[#DC2626] font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#DC2626]" /> Đã bị
                    khóa & thu hồi đăng nhập (Offboarding Security Hook)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[#059669] font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#059669]" /> Sẵn
                    sàng truy cập hệ thống
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Employee Form Modal */}
      <EmployeeFormModal
        isOpen={isEditModalOpen}
        mode="edit"
        employeeId={employee.id}
        initialDetail={employee}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
      />

      {/* Termination Modal */}
      {isTerminateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-[12px] shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5E7EB] bg-[#FEF2F2] flex items-center justify-between">
              <div>
                <h3 className="font-heading text-[18px] font-semibold text-[#991B1B]">
                  Xác nhận Thủ tục Thôi việc
                </h3>
                <p className="text-[12px] text-[#B91C1C] mt-0.5">
                  Nhân sự: {employee.fullName} ({employee.employeeCode})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTerminateModalOpen(false)}
                className="text-[#991B1B] text-[13px] font-bold hover:opacity-75 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTerminateSubmit} className="p-6 space-y-4">
              {terminateError && (
                <div className="p-3 rounded-[8px] bg-[#FEF2F2] border border-[#EF4444] text-[#EF4444] text-[13px]">
                  {terminateError}
                </div>
              )}

              <div className="p-3.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-[8px] text-[12px] text-[#92400E] leading-[18px]">
                <p className="font-semibold">⚠️ Cảnh báo an ninh nhân sự:</p>
                <p className="mt-1">
                  Khi xác nhận thôi việc: Trạng thái nhân sự chuyển sang{" "}
                  <strong className="text-[#B45309]">Terminated</strong>, và tài
                  khoản đăng nhập hệ thống của nhân viên sẽ tự động bị thu hồi
                  quyền truy cập và khóa bảo mật ngay lập tức.
                </p>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#374151] mb-1">
                  Ngày thôi việc <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={terminationDate}
                  onChange={(e) => setTerminationDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-[8px] border border-[#E5E7EB] text-[#111827] focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#374151] mb-1">
                  Lý do thôi việc <span className="text-[#EF4444]">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={terminationReason}
                  onChange={(e) => setTerminationReason(e.target.value)}
                  placeholder="Ghi rõ lý do thôi việc (Hết hạn hợp đồng, Nguyện vọng cá nhân, Chuyển công tác...)"
                  className="w-full px-3 py-2 rounded-[8px] border border-[#E5E7EB] text-[13px] text-[#111827] focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTerminateModalOpen(false)}
                  className="h-10 px-4 rounded-[8px] border border-[#E5E7EB] text-[#4B5563] text-[13px] font-medium hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isTerminating}
                  className="h-10 px-4 rounded-[8px] bg-[#DC2626] text-white text-[13px] font-medium hover:bg-[#B91C1C] disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isTerminating ? "Đang xử lý..." : "Xác nhận Thôi việc"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
