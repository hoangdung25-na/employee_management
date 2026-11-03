import React from "react";
import { EmployeeStatus } from "@/features/employees/types/employee";

interface StatusBadgeProps {
  status: EmployeeStatus | string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bgClass: string; textClass: string; dotClass: string }
> = {
  Active: {
    label: "Chính thức",
    bgClass: "bg-[#ECFDF5]",
    textClass: "text-[#059669]",
    dotClass: "bg-[#059669]",
  },
  Probation: {
    label: "Thử việc",
    bgClass: "bg-[#FFFBEB]",
    textClass: "text-[#D97706]",
    dotClass: "bg-[#D97706]",
  },
  Suspended: {
    label: "Tạm đình chỉ",
    bgClass: "bg-[#FFF7ED]",
    textClass: "text-[#F97316]",
    dotClass: "bg-[#F97316]",
  },
  Terminated: {
    label: "Đã thôi việc",
    bgClass: "bg-[#FEF2F2]",
    textClass: "text-[#EF4444]",
    dotClass: "bg-[#EF4444]",
  },
};

/**
 * HRFlow Status Chip Component
 * Spec: varies fill, varies text, no border, pill shape (9999px radius).
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    bgClass: "bg-[#F3F4F6]",
    textClass: "text-[#4B5563]",
    dotClass: "bg-[#6B7280]",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] leading-[18px] font-medium whitespace-nowrap shrink-0 ${config.bgClass} ${config.textClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dotClass}`} />
      <span>{config.label}</span>
    </span>
  );
}
