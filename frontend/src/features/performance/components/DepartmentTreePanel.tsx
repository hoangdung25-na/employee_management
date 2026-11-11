"use client";

import React, { useState } from "react";
import { Icon } from "@/components/ui/Icon";

export interface DepartmentNode {
  id: string;
  code: string;
  name: string;
  count: number;
}

interface DepartmentTreePanelProps {
  departments: DepartmentNode[];
  selectedDeptId: string | null;
  onSelectDept: (deptId: string | null) => void;
  totalCount: number;
}

export function DepartmentTreePanel({
  departments,
  selectedDeptId,
  onSelectDept,
  totalCount,
}: DepartmentTreePanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const filteredDepts = departments.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs p-4 flex flex-col gap-3">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#F3F4F6]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center">
            <Icon name="apartment" size={15} />
          </div>
          <span className="font-heading text-[14px] font-semibold text-[#111827]">
            Cơ cấu phòng ban
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-[12px] text-[#7C3AED] font-medium hover:underline"
        >
          {isCollapsed ? "Mở rộng" : "Thu gọn"}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* Quick Search */}
          <div className="relative w-full">
            <span className="absolute left-2.5 top-2.5 text-[#9CA3AF]">
              <Icon name="search" size={14} />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Lọc nhanh phòng ban..."
              className="w-full h-8 pl-8 pr-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[12px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
            />
          </div>

          {/* Department Nodes */}
          <nav className="flex flex-col space-y-1 text-[13px]">
            {/* All Departments */}
            <button
              type="button"
              onClick={() => onSelectDept(null)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                selectedDeptId === null
                  ? "bg-[#EDE9FE] text-[#7C3AED] font-semibold border-l-[3px] border-[#7C3AED]"
                  : "text-[#374151] hover:bg-[#F9FAFB]"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon
                  name="groups"
                  size={16}
                  className={selectedDeptId === null ? "text-[#7C3AED]" : "text-[#9CA3AF]"}
                />
                <span>Tất cả phòng ban</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-white text-[#7C3AED] border border-[#DDD6FE]">
                {totalCount}
              </span>
            </button>

            {/* Department List */}
            {filteredDepts.map((dept) => {
              const isSelected = selectedDeptId === dept.id;
              return (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => onSelectDept(dept.id)}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-left transition-colors ${
                    isSelected
                      ? "bg-[#EDE9FE] text-[#7C3AED] font-semibold border-l-[3px] border-[#7C3AED]"
                      : "text-[#4B5563] hover:bg-[#F9FAFB] hover:text-[#111827]"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Icon
                      name="apartment"
                      size={15}
                      className={isSelected ? "text-[#7C3AED]" : "text-[#9CA3AF]"}
                    />
                    <span className="truncate">{dept.name}</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#9CA3AF] shrink-0 ml-1">
                    {dept.count}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Bottom Progress Mini Card */}
          <div className="mt-2 p-3 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] flex flex-col gap-1.5 text-[#111827]">
            <div className="flex items-center justify-between text-[12px] font-medium">
              <span>Tỷ lệ nộp bản tự đánh giá</span>
              <span className="text-[#0D9488] font-bold">96%</span>
            </div>
            <div className="w-full h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
              <div className="bg-[#0D9488] h-full rounded-full" style={{ width: "96%" }} />
            </div>
            <span className="text-[11px] font-mono text-[#6B7280] mt-0.5">
              Hạn chót thẩm định: 20/12/2026
            </span>
          </div>
        </>
      )}
    </aside>
  );
}

