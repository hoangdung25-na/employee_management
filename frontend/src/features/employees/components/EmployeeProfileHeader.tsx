"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { EmployeeDetail } from "../types/employee";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Icon } from "@/components/ui/Icon";
import { getInitials } from "@/lib/utils/format";

interface EmployeeProfileHeaderProps {
  employee: EmployeeDetail;
  canEdit?: boolean;
  canTerminate?: boolean;
  onEdit?: () => void;
  onTerminate?: () => void;
  onAvatarChange?: () => void;
}

export function EmployeeProfileHeader({
  employee,
  canEdit = true,
  canTerminate = true,
  onEdit,
  onTerminate,
  onAvatarChange,
}: EmployeeProfileHeaderProps) {
  const [avatarError, setAvatarError] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const hasAvatar = Boolean(employee.avatarUrl) && !avatarError;
  const isTerminated = employee.status === "Terminated";

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[16px] shadow-xs p-6 relative overflow-hidden">
      {/* Ambient decorative gradient splash */}
      <div className="absolute -right-24 -top-24 w-80 h-80 bg-[#7C3AED]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 relative z-10">
        {/* Left Profile Details Block */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 min-w-0">
          {/* Avatar Wrapper */}
          <div className="relative shrink-0 group">
            <div className="w-20 h-20 rounded-full overflow-hidden shadow-xs bg-[#F5F3FF] border-2 border-[#DDD6FE] flex items-center justify-center">
              {hasAvatar ? (
                <Image
                  src={employee.avatarUrl!}
                  alt={employee.fullName}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <span className="font-heading font-bold text-[24px] text-[#7C3AED]">
                  {getInitials(employee.fullName)}
                </span>
              )}
            </div>

            {onAvatarChange && (
              <button
                type="button"
                onClick={onAvatarChange}
                className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#7C3AED] text-white flex items-center justify-center shadow-md hover:bg-[#5B21B6] transition-colors cursor-pointer"
                title="Đổi ảnh đại diện"
              >
                <Icon name="badge" size={13} />
              </button>
            )}
          </div>

          {/* Name & Badges */}
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-heading text-[24px] lg:text-[28px] leading-[34px] font-bold text-[#111827] tracking-tight">
                {employee.fullName}
              </h1>

              <span className="bg-[#EDE9FE] text-[#7C3AED] font-mono text-[13px] px-2.5 py-0.5 rounded-[6px] font-semibold">
                {employee.employeeCode}
              </span>

              <StatusBadge status={employee.status} />

              <span className="px-2.5 py-0.5 rounded-full text-[12px] leading-[18px] font-medium bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">
                {employee.positionName || "Thành viên chính thức"}
              </span>
            </div>

            <p className="text-[14px] leading-[22px] text-[#6B7280] font-medium">
              {employee.positionName} • {employee.departmentName}
            </p>

            {/* Quick Contact Strip */}
            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 pt-1 text-[13px] text-[#6B7280]">
              <a
                href={`mailto:${employee.workEmail}`}
                className="flex items-center gap-1.5 hover:text-[#7C3AED] transition-colors"
              >
                <Icon name="email" size={15} className="text-[#7C3AED]" />
                <span>{employee.workEmail}</span>
              </a>

              {employee.phoneNumber && (
                <>
                  <span className="text-[#D1D5DB]">•</span>
                  <a
                    href={`tel:${employee.phoneNumber}`}
                    className="flex items-center gap-1.5 hover:text-[#7C3AED] transition-colors font-mono"
                  >
                    <Icon name="call" size={15} className="text-[#0D9488]" />
                    <span>{employee.phoneNumber}</span>
                  </a>
                </>
              )}

              <span className="text-[#D1D5DB]">•</span>
              <div className="flex items-center gap-1.5">
                <Icon name="apartment" size={15} className="text-[#F97316]" />
                <span>Văn phòng Trụ sở chính</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Right */}
        <div className="flex items-center flex-wrap gap-2.5 shrink-0 self-stretch sm:self-auto justify-end">
          <button
            type="button"
            onClick={() => window.print()}
            className="h-10 px-3.5 rounded-[8px] bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB] text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Icon name="print" size={16} />
            <span className="hidden md:inline">In hồ sơ</span>
          </button>

          {canEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="h-10 px-4 rounded-[8px] bg-[#7C3AED] hover:bg-[#5B21B6] text-white text-[13px] font-medium shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Icon name="edit_square" size={16} />
              <span>Chỉnh sửa hồ sơ</span>
            </button>
          )}

          {/* More Actions Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="w-10 h-10 rounded-[8px] bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] text-[#4B5563] flex items-center justify-center transition-colors cursor-pointer"
              title="Thao tác khác"
            >
              <Icon name="more_vert" size={18} />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E5E7EB] rounded-[12px] shadow-lg py-1.5 z-30 text-[13px] text-[#111827]">
                <Link
                  href="/employees"
                  className="flex items-center gap-2.5 px-4 py-2 hover:bg-[#F5F3FF] hover:text-[#7C3AED] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Icon name="groups" size={16} className="text-[#6B7280]" />
                  <span>Danh sách nhân sự</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    alert("Yêu cầu gửi email cấp lại mật khẩu đã được xử lý.");
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-[#F5F3FF] hover:text-[#7C3AED] transition-colors text-left cursor-pointer"
                >
                  <Icon name="lock_reset" size={16} className="text-[#6B7280]" />
                  <span>Cấp lại mật khẩu ESS</span>
                </button>

                {canTerminate && !isTerminated && (
                  <>
                    <div className="my-1 border-t border-[#F3F4F6]" />
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onTerminate?.();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-[#FEF2F2] text-[#EF4444] transition-colors text-left cursor-pointer font-medium"
                    >
                      <Icon name="person_off" size={16} className="text-[#EF4444]" />
                      <span>Thủ tục thôi việc</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

