import React from "react";
import Link from "next/link";
import { EmployeeDetail } from "../types/employee";
import { Icon } from "@/components/ui/Icon";
import { formatDateVN, getInitials } from "@/lib/utils/format";

interface JobInfoCardProps {
  employee: EmployeeDetail;
  className?: string;
}

export function JobInfoCard({ employee, className = "" }: JobInfoCardProps) {
  const calculateTenure = (hireDateStr: string) => {
    try {
      const hire = new Date(hireDateStr);
      const diffTime = Math.abs(Date.now() - hire.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const years = Math.floor(diffDays / 365);
      const months = Math.floor((diffDays % 365) / 30);
      if (years > 0) {
        return `${years} năm ${months} tháng`;
      }
      return `${months} tháng (${diffDays} ngày)`;
    } catch {
      return "—";
    }
  };

  const tenure = calculateTenure(employee.hireDate);

  return (
    <section
      className={`bg-white border border-[#E5E7EB] rounded-[16px] shadow-xs p-6 flex flex-col gap-5 ${className}`}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-[#EDE9FE] flex items-center justify-center text-[#7C3AED]">
            <Icon name="work" size={18} />
          </div>
          <h2 className="font-heading text-[18px] leading-[26px] font-semibold text-[#111827]">
            Thông tin công việc & Vị trí
          </h2>
        </div>

        <span className="bg-[#EDE9FE] text-[#7C3AED] text-[12px] font-medium px-2.5 py-0.5 rounded-full border border-[#DDD6FE]">
          Chính thức
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 pt-1">
        <div>
          <span className="text-[12px] leading-[18px] text-[#6B7280] block mb-0.5">
            Chức vụ
          </span>
          <p className="text-[14px] leading-[22px] font-semibold text-[#111827]">
            {employee.positionName}
          </p>
        </div>

        <div>
          <span className="text-[12px] leading-[18px] text-[#6B7280] block mb-0.5">
            Phòng ban
          </span>
          <p className="text-[14px] leading-[22px] font-semibold text-[#111827]">
            {employee.departmentName}
          </p>
        </div>

        {/* Manager Card Block */}
        <div className="sm:col-span-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-[10px] p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#EDE9FE] border border-[#DDD6FE] text-[#7C3AED] font-heading font-bold text-[14px] flex items-center justify-center shrink-0">
              {employee.directManagerName
                ? getInitials(employee.directManagerName)
                : "QL"}
            </div>
            <div>
              <span className="text-[11px] leading-[16px] text-[#6B7280] block">
                Quản lý trực tiếp
              </span>
              <span className="text-[14px] font-semibold text-[#111827]">
                {employee.directManagerName || "Ban Giám đốc"}
              </span>
            </div>
          </div>

          {employee.directManagerId && (
            <Link
              href={`/employees/${employee.directManagerId}`}
              className="px-3 py-1 text-[12px] font-medium text-[#7C3AED] bg-white border border-[#DDD6FE] hover:bg-[#F5F3FF] rounded-[8px] transition-colors"
            >
              Xem hồ sơ
            </Link>
          )}
        </div>

        <div>
          <span className="text-[12px] leading-[18px] text-[#6B7280] block mb-0.5">
            Ngày bắt đầu làm việc
          </span>
          <p className="text-[14px] leading-[22px] font-semibold text-[#111827]">
            {formatDateVN(employee.hireDate)}
          </p>
        </div>

        <div>
          <span className="text-[12px] leading-[18px] text-[#6B7280] block mb-0.5">
            Thâm niên công tác
          </span>
          <span className="text-[14px] leading-[22px] font-semibold text-[#111827]">
            {tenure}
          </span>
        </div>

        <div>
          <span className="text-[12px] leading-[18px] text-[#6B7280] block mb-0.5">
            Loại hợp đồng hiện tại
          </span>
          <p className="text-[14px] leading-[22px] font-medium text-[#111827]">
            Hợp đồng Lao động Không xác định thời hạn
          </p>
        </div>

        <div>
          <span className="text-[12px] leading-[18px] text-[#6B7280] block mb-0.5">
            Địa điểm & Ca làm việc
          </span>
          <p className="text-[14px] leading-[22px] font-medium text-[#111827]">
            Văn phòng Trụ sở chính
          </p>
          <span className="text-[11px] text-[#9CA3AF]">
            Thứ 2 - Thứ 6 (8:30 - 17:30) • Giờ hành chính
          </span>
        </div>
      </div>
    </section>
  );
}
