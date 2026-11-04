import React from "react";
import { Icon, IconName } from "./Icon";

export interface TimelineMilestone {
  id: string;
  dateText: string;
  badgeLabel?: string;
  badgeColorClass?: string;
  icon?: IconName;
  iconBgClass?: string;
  iconColorClass?: string;
  title: string;
  description?: string;
  code?: string;
}

interface TimelineProps {
  items: TimelineMilestone[];
  emptyMessage?: string;
  className?: string;
}

export function Timeline({
  items,
  emptyMessage = "Chưa có sự kiện ghi nhận nào trong tiến trình.",
  className = "",
}: TimelineProps) {
  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-[#9CA3AF] text-[13px]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`relative pl-6 space-y-5 pt-1 ${className}`}>
      {/* Continuous vertical timeline track */}
      <div className="absolute left-2.5 top-3 bottom-3 w-0.5 bg-[#E5E7EB] rounded-full" />

      {items.map((item) => (
        <div key={item.id} className="relative group">
          {/* Milestone circular badge */}
          <div
            className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center shadow-xs ring-4 ring-white ${
              item.iconBgClass ?? "bg-[#7C3AED]"
            } ${item.iconColorClass ?? "text-white"}`}
          >
            {item.icon ? (
              <Icon name={item.icon} size={12} />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
            )}
          </div>

          {/* Milestone card */}
          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-[10px] p-3.5 group-hover:bg-[#F3F4F6] transition-colors">
            <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
              <span className="font-mono text-[12px] font-bold text-[#111827]">
                {item.dateText}
              </span>
              {item.badgeLabel && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                    item.badgeColorClass ?? "bg-[#EDE9FE] text-[#7C3AED]"
                  }`}
                >
                  {item.badgeLabel}
                </span>
              )}
            </div>

            <h4 className="font-heading text-[14px] leading-[20px] font-semibold text-[#111827]">
              {item.title}
            </h4>

            {item.description && (
              <p className="text-[12px] leading-[18px] text-[#6B7280] mt-1">
                {item.code && (
                  <span className="font-mono font-semibold text-[#111827] mr-1">
                    [{item.code}]
                  </span>
                )}
                {item.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

