import React from "react";
import { Timeline, TimelineMilestone } from "@/components/ui/Timeline";
import { Icon } from "@/components/ui/Icon";

interface CareerTimelineCardProps {
  milestones?: TimelineMilestone[];
  onAddMilestone?: () => void;
  className?: string;
}

export function CareerTimelineCard({
  milestones = [],
  onAddMilestone,
  className = "",
}: CareerTimelineCardProps) {
  return (
    <section
      className={`bg-white border border-[#E5E7EB] rounded-[16px] shadow-xs p-6 flex flex-col gap-5 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-[#EDE9FE] flex items-center justify-center text-[#7C3AED]">
            <Icon name="history_edu" size={18} />
          </div>
          <h2 className="font-heading text-[18px] leading-[26px] font-semibold text-[#111827]">
            Quá trình công tác
          </h2>
        </div>

        {onAddMilestone && (
          <button
            type="button"
            onClick={onAddMilestone}
            className="text-[12px] font-semibold text-[#7C3AED] hover:text-[#5B21B6] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Icon name="add" size={15} />
            <span>Thêm mốc</span>
          </button>
        )}
      </div>

      {milestones.length > 0 ? (
        <Timeline items={milestones} />
      ) : (
        <p className="text-[13px] text-[#6B7280] italic">
          Chưa có dữ liệu mốc công tác.
        </p>
      )}
    </section>
  );
}
