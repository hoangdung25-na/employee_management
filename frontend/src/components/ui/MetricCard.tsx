import React from "react";
import { Icon, IconName } from "./Icon";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: IconName;
  iconBgClass?: string;
  iconColorClass?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  subtitle?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  icon,
  iconBgClass = "bg-[#F5F3FF]",
  iconColorClass = "text-[#7C3AED]",
  trend,
  subtitle,
  className = "",
}: MetricCardProps) {
  return (
    <div
      className={`bg-white rounded-[12px] border border-[#E5E7EB] shadow-xs p-5 flex flex-col justify-between transition-all hover:shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] leading-[18px] font-medium text-[#6B7280]">
          {title}
        </span>
        {icon && (
          <div
            className={`w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0 ${iconBgClass} ${iconColorClass}`}
          >
            <Icon name={icon} size={20} />
          </div>
        )}
      </div>

      <div className="mt-3">
        <span className="font-heading text-[26px] leading-[32px] font-bold text-[#111827] tracking-tight">
          {value}
        </span>
      </div>

      {(trend || subtitle) && (
        <div className="mt-3 pt-3 border-t border-[#F3F4F6] flex items-center justify-between text-[12px] leading-[16px]">
          {trend ? (
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-semibold font-mono ${
                  trend.isPositive !== false
                    ? "bg-[#ECFDF5] text-[#059669]"
                    : "bg-[#FEF2F2] text-[#EF4444]"
                }`}
              >
                {trend.isPositive !== false ? "↑" : "↓"} {trend.value}
              </span>
              {trend.label && (
                <span className="text-[#6B7280]">{trend.label}</span>
              )}
            </div>
          ) : (
            <span />
          )}

          {subtitle && (
            <span className="text-[#9CA3AF] text-right font-medium">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

