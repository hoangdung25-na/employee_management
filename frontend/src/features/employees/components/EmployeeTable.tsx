"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { EmployeeSummary } from "@/features/employees/types/employee";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  formatCurrencyVND,
  formatDateVN,
  getInitials,
} from "@/lib/utils/format";

interface EmployeeTableProps {
  employees: EmployeeSummary[];
  isLoading: boolean;
  onSelectEmployee?: (employee: EmployeeSummary) => void;
  onEditEmployee?: (employee: EmployeeSummary) => void;
}


export function EmployeeTable({
  employees,
  isLoading,
  onSelectEmployee,
  onEditEmployee,
}: EmployeeTableProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [revealedSalaries, setRevealedSalaries] = useState<
    Record<string, boolean>
  >({});
  const [revealAllSalaries, setRevealAllSalaries] = useState<boolean>(false);
  const [failedAvatars, setFailedAvatars] = useState<Record<string, boolean>>(
    {}
  );

  const toggleSalaryReveal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRevealedSalaries((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleRevealAll = () => {
    setRevealAllSalaries((prev) => !prev);
  };

  // Trạng thái Skeleton Loading (HRFlow Rule #8)
  if (isLoading) {
    return (
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[960px] text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#FAFAFA] text-[12px] leading-[18px] font-semibold text-[#6B7280] uppercase tracking-wider whitespace-nowrap">
              <th className="py-3 px-4">Thành viên đội ngũ</th>
              <th className="py-3 px-4">Phòng ban & Chức vụ</th>
              <th className="py-3 px-4">Liên hệ công việc</th>
              <th className="py-3 px-4">Ngày gia nhập</th>
              <th className="py-3 px-4">Lương cơ bản</th>
              <th className="py-3 px-4">Trạng thái</th>
              <th className="py-3 px-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB] bg-white">
            {Array.from({ length: 5 }).map((_, idx) => (
              <tr key={idx} className="h-[60px] animate-pulse">
                <td className="py-2.5 px-4 align-middle">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#EDE9FE] shrink-0" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-32 bg-[#E5E7EB] rounded-[4px]" />
                      <div className="h-3 w-20 bg-[#F3F4F6] rounded-[4px]" />
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-4 align-middle">
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-28 bg-[#E5E7EB] rounded-[4px]" />
                    <div className="h-3 w-24 bg-[#F3F4F6] rounded-[4px]" />
                  </div>
                </td>
                <td className="py-2.5 px-4 align-middle">
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-36 bg-[#E5E7EB] rounded-[4px]" />
                    <div className="h-3 w-24 bg-[#F3F4F6] rounded-[4px]" />
                  </div>
                </td>
                <td className="py-2.5 px-4 align-middle">
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-20 bg-[#E5E7EB] rounded-[4px]" />
                    <div className="h-3 w-24 bg-[#F3F4F6] rounded-[4px]" />
                  </div>
                </td>
                <td className="py-2.5 px-4 align-middle">
                  <div className="h-7 w-28 bg-[#F3F4F6] rounded-[4px]" />
                </td>
                <td className="py-2.5 px-4 align-middle">
                  <div className="h-6 w-20 bg-[#ECFDF5] rounded-full" />
                </td>
                <td className="py-2.5 px-4 align-middle text-right">
                  <div className="h-7 w-20 bg-[#F3F4F6] rounded-[8px] ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Trạng thái Empty State thân thiện (HRFlow Rule #8 & #1)
  if (employees.length === 0) {
    return (
      <div className="py-16 px-6 text-center bg-white">
        <div className="w-12 h-12 rounded-full bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center mx-auto mb-3 font-heading font-semibold text-lg">
          0
        </div>
        <h3 className="font-heading text-[20px] leading-[28px] font-semibold text-[#111827] mb-1">
          Chưa tìm thấy thành viên phù hợp
        </h3>
        <p className="text-[14px] leading-[22px] text-[#6B7280] max-w-md mx-auto">
          Không có hồ sơ thành viên đội ngũ nào khớp với bộ lọc hiện tại. Hãy thử
          thay đổi từ khóa tìm kiếm hoặc trạng thái làm việc.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[960px] text-left border-collapse">
        <thead>
          <tr className="border-b border-[#E5E7EB] bg-[#FAFAFA] text-[12px] leading-[18px] font-semibold text-[#6B7280] uppercase tracking-wider whitespace-nowrap">
            <th className="py-3 px-4 w-[23%]">Thành viên đội ngũ</th>
            <th className="py-3 px-4 w-[18%]">Phòng ban & Chức vụ</th>
            <th className="py-3 px-4 w-[20%]">Liên hệ công việc</th>
            <th className="py-3 px-4 w-[11%]">Ngày gia nhập</th>
            <th className="py-3 px-4 w-[14%]">
              <div className="inline-flex items-center gap-2">
                <span>Lương cơ bản</span>
                <button
                  type="button"
                  onClick={toggleRevealAll}
                  title={
                    revealAllSalaries
                      ? "Ẩn toàn bộ mức lương"
                      : "Hiển thị toàn bộ mức lương (Chỉ dành cho HR/Admin)"
                  }
                  className="px-2 py-0.5 rounded-full text-[11px] leading-[16px] font-medium normal-case whitespace-nowrap bg-[#F5F3FF] text-[#7C3AED] border border-[#7C3AED] hover:bg-[#EDE9FE] transition-colors cursor-pointer"
                >
                  {revealAllSalaries ? "Ẩn tất cả" : "Hiện tất cả"}
                </button>
              </div>
            </th>
            <th className="py-3 px-4 w-[8%]">Trạng thái</th>
            <th className="py-3 px-4 w-[6%] text-right">Hành động</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-[#E5E7EB] bg-white text-[14px] leading-[20px]">
          {employees.map((emp) => {
            const isSelected = selectedId === emp.id;
            const isSalaryVisible =
              revealAllSalaries || Boolean(revealedSalaries[emp.id]);
            const showAvatarImage =
              Boolean(emp.avatarUrl) && !failedAvatars[emp.id];

            return (
              <tr
                key={emp.id}
                onClick={() => {
                  setSelectedId(emp.id === selectedId ? null : emp.id);
                  onSelectEmployee?.(emp);
                }}
                className={`h-[60px] transition-colors cursor-pointer ${isSelected ? "bg-[#EDE9FE]" : "hover:bg-[#F5F3FF]"
                  }`}
              >
                {/* Cột 1: Avatar + Họ tên + Mã NV (Thẳng hàng 2 dòng gọn gàng) */}
                <td
                  className={`py-2.5 px-4 align-middle whitespace-nowrap ${isSelected ? "shadow-[inset_3px_0_0_0_#7C3AED]" : ""
                    }`}
                >
                  <div className="flex items-center gap-3">
                    {showAvatarImage ? (
                      <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 border border-[#E5E7EB] bg-[#F5F3FF]">
                        <Image
                          src={emp.avatarUrl!}
                          alt={emp.fullName}
                          fill
                          sizes="36px"
                          className="object-cover"
                          onError={() =>
                            setFailedAvatars((prev) => ({
                              ...prev,
                              [emp.id]: true,
                            }))
                          }
                        />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#EDE9FE] text-[#7C3AED] font-heading font-semibold text-[12px] flex items-center justify-center shrink-0 border border-[#DDD6FE]">
                        {getInitials(emp.fullName)}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="font-medium text-[#111827] leading-[20px] truncate">
                        {emp.fullName}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 leading-[18px]">
                        <span className="font-mono text-[12px] text-[#7C3AED] font-medium whitespace-nowrap">
                          {emp.employeeCode}
                        </span>
                        <span className="text-[#D1D5DB]">•</span>
                        <span
                          className="font-mono text-[11px] text-[#9CA3AF] whitespace-nowrap"
                          title={`GUID: ${emp.id}`}
                        >
                          #{emp.id.slice(0, 8)}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>

                {/* Cột 2: Phòng ban & Chức vụ (Đúng 2 dòng thẳng tắp với Cột 1, 3, 4) */}
                <td className="py-2.5 px-4 align-middle whitespace-nowrap">
                  <div className="flex items-center gap-1.5 leading-[20px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] shrink-0" />
                    <span className="font-medium text-[#111827]">
                      {emp.departmentName}
                    </span>
                  </div>
                  <p className="text-[12px] leading-[18px] text-[#6B7280] mt-0.5 pl-3">
                    {emp.positionName}
                  </p>
                </td>

                {/* Cột 3: Liên hệ công việc (2 dòng: Email & SĐT) */}
                <td className="py-2.5 px-4 align-middle whitespace-nowrap">
                  <p className="text-[#111827] leading-[20px]">
                    {emp.workEmail}
                  </p>
                  <p className="font-mono text-[12px] leading-[18px] text-[#6B7280] mt-0.5">
                    {emp.phoneNumber || "Chưa cập nhật SĐT"}
                  </p>
                </td>

                {/* Cột 4: Ngày gia nhập & Ngày sinh (2 dòng đồng bộ) */}
                <td className="py-2.5 px-4 align-middle whitespace-nowrap">
                  <p className="text-[#111827] leading-[20px] font-medium">
                    {formatDateVN(emp.hireDate)}
                  </p>
                  <p className="text-[12px] leading-[18px] text-[#6B7280] mt-0.5">
                    NS: {formatDateVN(emp.dateOfBirth)}
                  </p>
                </td>

                {/* Cột 5: Lương cơ bản (Không bao giờ bị rớt chữ ₫ xuống dòng) */}
                <td className="py-2.5 px-4 align-middle whitespace-nowrap">
                  <div className="inline-flex items-center gap-1.5">
                    {isSalaryVisible ? (
                      <span className="font-mono text-[13px] leading-[20px] font-medium text-[#0D9488] bg-[#F0FDFA] border border-[#CCFBF1] px-2.5 py-0.5 rounded-[4px] whitespace-nowrap">
                        {formatCurrencyVND(emp.baseSalary)}
                      </span>
                    ) : (
                      <span className="font-mono text-[13px] leading-[20px] text-[#9CA3AF] bg-[#F9FAFB] border border-[#E5E7EB] px-2.5 py-0.5 rounded-[4px] select-none whitespace-nowrap">
                        •••••••• ₫
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => toggleSalaryReveal(emp.id, e)}
                      className="px-2 py-0.5 rounded-[4px] text-[12px] leading-[18px] font-medium text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#7C3AED] transition-colors cursor-pointer whitespace-nowrap"
                      title={
                        isSalaryVisible
                          ? "Ẩn mức lương"
                          : "Nhấn để xem mức lương cơ bản"
                      }
                    >
                      {isSalaryVisible ? "Ẩn" : "Xem"}
                    </button>
                  </div>
                </td>

                {/* Cột 6: Trạng thái */}
                <td className="py-2.5 px-4 align-middle whitespace-nowrap">
                  <StatusBadge status={emp.status} />
                </td>

                {/* Cột 7: Hành động */}
                <td
                  className="py-2.5 px-4 align-middle text-right whitespace-nowrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="inline-flex items-center justify-end gap-1">
                    <Link
                      href={`/employees/${emp.id}`}
                      className="h-7 px-2.5 inline-flex items-center justify-center rounded-[6px] text-[12px] font-medium text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors"
                    >
                      Hồ sơ
                    </Link>
                    <button
                      type="button"
                      onClick={() => onEditEmployee?.(emp)}
                      className="h-7 px-2.5 inline-flex items-center justify-center rounded-[6px] text-[12px] font-medium text-[#7C3AED] hover:bg-[#F5F3FF] transition-colors cursor-pointer"
                      title="Chỉnh sửa hồ sơ thành viên"
                    >
                      Sửa
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
