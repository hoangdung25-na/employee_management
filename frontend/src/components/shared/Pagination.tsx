"use client";

import React from "react";

interface PaginationProps {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalCount === 0) return null;

  const startItem = (pageNumber - 1) * pageSize + 1;
  const endItem = Math.min(pageNumber * pageSize, totalCount);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3.5 bg-white border-t border-[#E5E7EB]">
      <p className="text-[12px] leading-[18px] text-[#6B7280]">
        Hiển thị{" "}
        <span className="font-semibold text-[#111827]">{startItem}</span> –{" "}
        <span className="font-semibold text-[#111827]">{endItem}</span> trên tổng
        số <span className="font-semibold text-[#7C3AED]">{totalCount}</span>{" "}
        thành viên đội ngũ
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={pageNumber <= 1}
          onClick={() => onPageChange(pageNumber - 1)}
          className="h-8 px-3 rounded-[8px] text-[12px] font-medium border border-[#E5E7EB] text-[#374151] bg-white hover:bg-[#F5F3FF] hover:text-[#7C3AED] hover:border-[#A78BFA] disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          Trước
        </button>

        <span className="px-3 py-1 rounded-full bg-[#F5F3FF] text-[#7C3AED] border border-[#7C3AED] text-[12px] leading-[18px] font-medium">
          Trang {pageNumber} / {Math.max(1, totalPages)}
        </span>

        <button
          type="button"
          disabled={pageNumber >= totalPages}
          onClick={() => onPageChange(pageNumber + 1)}
          className="h-8 px-3 rounded-[8px] text-[12px] font-medium border border-[#E5E7EB] text-[#374151] bg-white hover:bg-[#F5F3FF] hover:text-[#7C3AED] hover:border-[#A78BFA] disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          Tiếp
        </button>
      </div>
    </div>
  );
}

