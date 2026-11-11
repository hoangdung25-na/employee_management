"use client";

import React, { useEffect, useState } from "react";
import { EmployeeDetail } from "../types/employee";
import { MaskedField } from "@/components/ui/MaskedField";
import { Icon } from "@/components/ui/Icon";
import { formatCurrencyVND } from "@/lib/utils/format";
import { getMyLeaveBalances } from "@/features/leaves/services/leaveService";
import { LeaveBalance } from "@/features/leaves/types/leave";

interface CompensationSummaryCardProps {
  employee: EmployeeDetail;
  className?: string;
}

export function CompensationSummaryCard({
  employee,
  className = "",
}: CompensationSummaryCardProps) {
  const [isSalaryVisible, setIsSalaryVisible] = useState(false);
  const [annualLeave, setAnnualLeave] = useState<LeaveBalance | null>(null);

  useEffect(() => {
    if (!employee.id) return;
    getMyLeaveBalances({ year: 2026, employeeId: employee.id })
      .then((balances) => {
        const annual =
          balances.find(
            (b) => b.leaveTypeCode === "ANNUAL" || b.leaveTypeCode === "AL"
          ) ||
          balances.find((b) => b.isPaid) ||
          balances[0] ||
          null;
        setAnnualLeave(annual);
      })
      .catch(() => {
        setAnnualLeave(null);
      });
  }, [employee.id]);

  const totalDays = annualLeave
    ? annualLeave.entitledDays + annualLeave.carriedOverDays
    : 12;
  const remainingDays = annualLeave ? annualLeave.remainingDays : 12;
  const usedDays = annualLeave ? annualLeave.usedDays : 0;
  const pendingDays = annualLeave ? annualLeave.pendingDays : 0;
  const leaveYear = annualLeave?.leaveYear ?? 2026;
  const progressPercent =
    totalDays > 0
      ? Math.min(100, Math.max(0, (remainingDays / totalDays) * 100))
      : 0;

  return (
    <section
      className={`bg-white border border-[#E5E7EB] rounded-[16px] shadow-xs p-6 flex flex-col gap-5 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-[#EDE9FE] flex items-center justify-center text-[#7C3AED]">
            <Icon name="payments" size={18} />
          </div>
          <h2 className="font-heading text-[18px] leading-[26px] font-semibold text-[#111827]">
            Chế độ Đãi ngộ & Phép năm
          </h2>
        </div>
      </div>

      <div className="space-y-4">
        {/* Base Salary Box */}
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-[12px] p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12px] text-[#6B7280]">
              Lương cơ bản hàng tháng
            </span>
            {employee.baseSalary > 0 && (
              <button
                type="button"
                onClick={() => setIsSalaryVisible((prev) => !prev)}
                className="text-[12px] font-medium text-[#7C3AED] hover:text-[#5B21B6] transition-colors cursor-pointer"
              >
                {isSalaryVisible ? "Ẩn số tiền" : "Hiện mức lương"}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isSalaryVisible && employee.baseSalary > 0 ? (
              <span className="font-mono text-[18px] font-bold text-[#0D9488]">
                {formatCurrencyVND(employee.baseSalary)}
              </span>
            ) : (
              <span className="font-mono text-[18px] text-[#9CA3AF] tracking-widest select-none">
                •••••••• ₫
              </span>
            )}
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669]">
              Theo tháng
            </span>
          </div>

          {employee.baseSalary === 0 && (
            <p className="text-[11px] text-[#9CA3AF] mt-1.5 italic">
              * Mức lương được ẩn nếu tài khoản của bạn không có quyền xem thông tin lương.
            </p>
          )}
        </div>

        {/* Leave Balance Box */}
        <div className="bg-[#F0FDFA] border border-[#CCFBF1] rounded-[12px] p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Icon name="more_time" size={16} className="text-[#0D9488]" />
              <span className="text-[13px] font-semibold text-[#111827]">
                Quỹ phép năm {leaveYear}
              </span>
            </div>
            <span className="font-mono text-[13px] font-bold text-[#0D9488]">
              {remainingDays} / {totalDays} ngày còn lại
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#CCFBF1] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#0D9488] h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#6B7280] mt-2">
            <span>
              Đã sử dụng: {usedDays} ngày
              {pendingDays > 0 ? ` (Chờ duyệt: ${pendingDays} ngày)` : ""}
            </span>
            <span>Hạn dùng: 31/12/{leaveYear}</span>
          </div>
        </div>

        {/* Insurance & Bank Accounts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <MaskedField
            label="Mã số BHXH"
            value={employee.socialInsuranceNumber}
            subtext="Cơ quan BHXH quản lý"
          />

          <MaskedField
            label="Tài khoản Ngân hàng"
            value={employee.bankAccountNumber}
            subtext={employee.bankName ? `Ngân hàng: ${employee.bankName}` : "Chưa cập nhật"}
          />
        </div>
      </div>
    </section>
  );
}
