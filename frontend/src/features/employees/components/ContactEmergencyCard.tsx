import React from "react";
import { EmployeeDetail } from "../types/employee";
import { Icon } from "@/components/ui/Icon";

interface ContactEmergencyCardProps {
  employee: EmployeeDetail;
  className?: string;
}

export function ContactEmergencyCard({
  employee,
  className = "",
}: ContactEmergencyCardProps) {
  return (
    <section
      className={`bg-white border border-[#E5E7EB] rounded-[16px] shadow-xs p-6 flex flex-col gap-5 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-[#EDE9FE] flex items-center justify-center text-[#7C3AED]">
            <Icon name="email" size={18} />
          </div>
          <h2 className="font-heading text-[18px] leading-[26px] font-semibold text-[#111827]">
            Thông tin liên hệ & Khẩn cấp
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {/* Work Email */}
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-[10px] p-3.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[12px] text-[#6B7280]">Email công việc</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-[#059669] bg-[#ECFDF5] px-1.5 py-0.5 rounded font-medium">
              <Icon name="check_circle" size={12} />
              Enterprise
            </span>
          </div>
          <p className="font-mono text-[13px] font-semibold text-[#111827] truncate">
            {employee.workEmail}
          </p>
        </div>

        {/* Personal Email */}
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-[10px] p-3.5">
          <span className="text-[12px] text-[#6B7280] block mb-1">
            Email cá nhân
          </span>
          <p className="font-mono text-[13px] font-semibold text-[#111827] truncate">
            {employee.personalEmail || "Chưa cập nhật"}
          </p>
        </div>

        {/* Phone */}
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-[10px] p-3.5">
          <span className="text-[12px] text-[#6B7280] block mb-1">
            Số điện thoại di động
          </span>
          <p className="font-mono text-[13px] font-semibold text-[#111827]">
            {employee.phoneNumber || "Chưa cập nhật"}
          </p>
        </div>

        {/* Emergency Contact */}
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-[10px] p-3.5">
          <span className="text-[12px] text-[#6B7280] block mb-1">
            Liên hệ trường hợp khẩn cấp
          </span>
          <p className="text-[13px] font-semibold text-[#111827]">
            Người thân trong gia đình
          </p>
          <p className="font-mono text-[12px] text-[#6B7280] mt-0.5">
            Ưu tiên liên hệ khi có sự cố ngoài giờ
          </p>
        </div>
      </div>
    </section>
  );
}

