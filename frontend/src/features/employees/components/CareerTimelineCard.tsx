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
  // Default mock milestones if none provided from database
  const displayMilestones: TimelineMilestone[] =
    milestones.length > 0
      ? milestones
      : [
          {
            id: "m-1",
            dateText: "01/2024 — Hiện tại",
            badgeLabel: "Khen thưởng Công ty",
            badgeColorClass: "bg-[#FEF3C7] text-[#92400E]",
            icon: "emoji_events",
            iconBgClass: "bg-[#F59E0B]",
            iconColorClass: "text-white",
            title: "Cán bộ Quản lý Xuất sắc năm 2023",
            description:
              "Khen thưởng hoàn thành quyết toán kiểm toán trước tiến độ 15 ngày.",
            code: "QD-2024-012",
          },
          {
            id: "m-2",
            dateText: "01/2022",
            badgeLabel: "Bổ nhiệm Cấp cao",
            badgeColorClass: "bg-[#EDE9FE] text-[#7C3AED]",
            icon: "military_tech",
            iconBgClass: "bg-[#7C3AED]",
            iconColorClass: "text-white",
            title: "Bổ nhiệm Quản lý Điều hành Bộ phận",
            description:
              "Quyết định bổ nhiệm được phê duyệt & ký bởi Tổng Giám đốc.",
            code: "QD-2022-088",
          },
          {
            id: "m-3",
            dateText: "09/2021",
            badgeLabel: "Hợp đồng lao động",
            badgeColorClass: "bg-[#CCFBF1] text-[#0F766E]",
            icon: "description",
            iconBgClass: "bg-[#0D9488]",
            iconColorClass: "text-white",
            title: "Ký HĐLĐ Không xác định thời hạn",
            description:
              "Chuyển đổi từ hợp đồng xác định thời hạn 1 năm sang hợp đồng chính thức dài hạn.",
            code: "HD-2021-0419",
          },
          {
            id: "m-4",
            dateText: "15/09/2020",
            badgeLabel: "Gia nhập (Onboarding)",
            badgeColorClass: "bg-[#D1FAE5] text-[#065F46]",
            icon: "flag",
            iconBgClass: "bg-[#059669]",
            iconColorClass: "text-white",
            title: "Chính thức gia nhập HRFlow",
            description:
              "Hoàn thành xuất sắc giai đoạn thử việc với điểm đánh giá 98/100.",
          },
        ];

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
            Lịch sử & Bổ nhiệm
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

      <Timeline items={displayMilestones} />
    </section>
  );
}

