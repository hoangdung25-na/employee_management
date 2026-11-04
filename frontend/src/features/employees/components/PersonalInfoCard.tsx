import React from "react";
import { EmployeeDetail } from "../types/employee";
import { MaskedField } from "@/components/ui/MaskedField";
import { Icon } from "@/components/ui/Icon";
import { formatDateVN } from "@/lib/utils/format";

interface PersonalInfoCardProps {
  employee: EmployeeDetail;
  className?: string;
}

export function PersonalInfoCard({ employee, className = "" }: PersonalInfoCardProps) {
  const calculateAge = (dobString: string) => {
    try {
      const dob = new Date(dobString);
      const diffMs = Date.now() - dob.getTime();
      const ageDt = new Date(diffMs);
      return Math.abs(ageDt.getUTCFullYear() - 1970);
    } catch {
      return null;
    }
  };

  const age = calculateAge(employee.dateOfBirth);

  return (
    <section
      className={`bg-white border border-[#E5E7EB] rounded-[16px] shadow-xs p-6 flex flex-col gap-5 ${className}`}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-[#EDE9FE] flex items-center justify-center text-[#7C3AED]">
            <Icon name="badge" size={18} />
          </div>
          <h2 className="font-heading text-[18px] leading-[26px] font-semibold text-[#111827]">
            Thông tin cá nhân
          </h2>
        </div>

        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
          <Icon name="verified" size={14} className="text-[#059669]" />
          <span>Đã xác thực eKYC</span>
        </span>
      </div>

      {/* Grid Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 pt-1">
        <div>
          <span className="text-[12px] leading-[18px] text-[#6B7280] block mb-0.5">
            Ngày sinh
          </span>
          <p className="text-[14px] leading-[22px] font-semibold text-[#111827]">
            {formatDateVN(employee.dateOfBirth)}{" "}
            {age && <span className="font-normal text-[#6B7280]">({age} tuổi)</span>}
          </p>
        </div>

        <div>
          <span className="text-[12px] leading-[18px] text-[#6B7280] block mb-0.5">
            Giới tính
          </span>
          <p className="text-[14px] leading-[22px] font-semibold text-[#111827]">
            {employee.gender === "Male"
              ? "Nam"
              : employee.gender === "Female"
              ? "Nữ"
              : "Khác"}
          </p>
        </div>

        <div>
          <span className="text-[12px] leading-[18px] text-[#6B7280] block mb-0.5">
            Quốc tịch
          </span>
          <p className="text-[14px] leading-[22px] font-semibold text-[#111827]">
            Việt Nam
          </p>
        </div>

        <div>
          <span className="text-[12px] leading-[18px] text-[#6B7280] block mb-0.5">
            Tình trạng hôn nhân
          </span>
          <p className="text-[14px] leading-[22px] font-semibold text-[#111827]">
            Đã kết hôn
          </p>
        </div>

        {/* Masked Identification Fields */}
        <MaskedField
          label="Số CCCD / Mã định danh"
          value={employee.citizenId}
          subtext="Cục CSQLHC về trật tự xã hội cấp"
        />

        <MaskedField
          label="Mã số thuế cá nhân (TNCN)"
          value={employee.taxCode}
          subtext="Cơ quan Thuế quản lý"
        />

        {/* Addresses */}
        <div className="sm:col-span-2">
          <span className="text-[12px] leading-[18px] text-[#6B7280] block mb-1">
            Địa chỉ thường trú
          </span>
          <p className="text-[14px] leading-[22px] text-[#111827] font-medium flex items-start gap-2">
            <Icon name="home" size={17} className="text-[#9CA3AF] mt-0.5 shrink-0" />
            <span>{employee.address || "Chưa cập nhật địa chỉ thường trú"}</span>
          </p>
        </div>

        <div className="sm:col-span-2">
          <span className="text-[12px] leading-[18px] text-[#6B7280] block mb-1">
            Chỗ ở hiện nay
          </span>
          <p className="text-[14px] leading-[22px] text-[#111827] font-medium flex items-start gap-2">
            <Icon
              name="location_on"
              size={17}
              className="text-[#7C3AED] mt-0.5 shrink-0"
            />
            <span>
              {employee.address
                ? `Hiện đang cư trú: ${employee.address}`
                : "Chưa cập nhật địa chỉ hiện tại"}
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}

