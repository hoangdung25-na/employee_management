"use client";

import React, { useState } from "react";
import { Icon } from "./Icon";

interface MaskedFieldProps {
  label: string;
  value?: string | null;
  maskedLength?: number;
  subtext?: string;
  className?: string;
}

export function MaskedField({
  label,
  value,
  maskedLength = 4,
  subtext,
  className = "",
}: MaskedFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  if (!value) {
    return (
      <div className={`bg-[#F9FAFB] rounded-[8px] p-3 flex flex-col justify-center border border-[#E5E7EB] ${className}`}>
        <span className="text-[12px] leading-[18px] text-[#6B7280] block mb-0.5">{label}</span>
        <span className="font-mono text-[13px] text-[#9CA3AF]">Chưa cập nhật</span>
      </div>
    );
  }

  const maskValue = (val: string) => {
    if (val.length <= maskedLength) return "••••";
    const visiblePrefix = val.slice(0, Math.max(0, val.length - maskedLength));
    return `${visiblePrefix}${"•".repeat(maskedLength)}`;
  };

  const displayValue = isVisible ? value : maskValue(value);

  return (
    <div className={`bg-[#F9FAFB] rounded-[8px] p-3 flex flex-col justify-center border border-[#E5E7EB] transition-colors hover:border-[#DDD6FE] ${className}`}>
      <span className="text-[12px] leading-[18px] text-[#6B7280] block mb-0.5">{label}</span>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[13px] leading-[18px] font-semibold text-[#111827] tracking-wider select-all">
          {displayValue}
        </span>
        <button
          type="button"
          onClick={() => setIsVisible((prev) => !prev)}
          className="text-[#6B7280] hover:text-[#7C3AED] transition-colors p-1 rounded-md hover:bg-[#F3F4F6] cursor-pointer"
          title={isVisible ? "Ẩn thông tin" : "Hiện thông tin"}
        >
          <Icon name={isVisible ? "visibility_off" : "visibility"} size={16} />
        </button>
      </div>
      {subtext && (
        <span className="text-[11px] leading-[16px] text-[#9CA3AF] mt-1">{subtext}</span>
      )}
    </div>
  );
}

