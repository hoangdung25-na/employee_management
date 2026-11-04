"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Icon } from "@/components/ui/Icon";
import { getInitials } from "@/lib/utils/format";

export function Header() {
  const router = useRouter();
  const { session, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="h-16 bg-white border-b border-[#E5E7EB] px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left Area: Breadcrumbs & Global Search */}
      <div className="flex items-center gap-6">
        <nav className="hidden lg:flex items-center gap-1.5 text-[12px] text-[#6B7280]">
          <span className="font-semibold text-[#111827]">HRFlow</span>
          <Icon name="chevron_right" size={14} className="text-[#D1D5DB]" />
          <span className="font-medium text-[#7C3AED]">Hệ thống Quản trị</span>
        </nav>

        {/* Global Search Bar */}
        <div className="relative min-w-[280px] sm:min-w-[340px]">
          <div className="absolute left-3 top-2.5 text-[#9CA3AF]">
            <Icon name="search" size={18} />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm nhân sự, ứng viên..."
            className="w-full h-10 pl-9 pr-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-[10px] text-[13px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20 transition-all"
          />
        </div>
      </div>

      {/* Right Area: Actions & User Info */}
      <div className="flex items-center gap-4">
        {/* Quick action icon buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="relative w-9 h-9 rounded-[8px] flex items-center justify-center text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors cursor-pointer"
            title="Thông báo"
          >
            <Icon name="notifications" size={19} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F97316] ring-2 ring-white" />
          </button>

          <button
            type="button"
            className="w-9 h-9 rounded-[8px] flex items-center justify-center text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors cursor-pointer"
            title="Trợ giúp"
          >
            <Icon name="help_outline" size={19} />
          </button>
        </div>

        <div className="h-7 w-px bg-[#E5E7EB]" />

        {/* User Profile info */}
        {isAuthenticated && session ? (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[13px] leading-[18px] font-semibold text-[#111827]">
                {session.fullName}
              </p>
              <p className="text-[11px] leading-[14px] text-[#0D9488] font-mono">
                {session.roles.join(" • ")}
              </p>
            </div>

            <div className="w-9 h-9 rounded-full bg-[#EDE9FE] border border-[#DDD6FE] flex items-center justify-center text-[#7C3AED] font-heading font-bold text-xs shrink-0">
              {getInitials(session.fullName)}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="h-8 px-2.5 rounded-[8px] border border-[#E5E7EB] text-[12px] font-medium text-[#4B5563] hover:border-[#EF4444] hover:text-[#EF4444] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
            >
              Đăng xuất
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="h-9 px-4 rounded-[8px] bg-[#7C3AED] hover:bg-[#5B21B6] text-white text-[13px] font-medium transition-colors inline-flex items-center"
            >
              Đăng nhập
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
