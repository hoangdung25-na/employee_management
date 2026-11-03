"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import { getInitials } from "@/lib/utils/format";

export function Header() {
  const router = useRouter();
  const { session, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="h-16 bg-white border-b border-[#E5E7EB] px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5F3FF] text-[#7C3AED] border border-[#7C3AED] text-[12px] leading-[18px] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
          Hệ thống Quản trị Nhân sự HRFlow
        </span>
      </div>

      <div className="flex items-center gap-4">
        {isAuthenticated && session ? (
          <>
            <div className="text-right hidden sm:block">
              <p className="text-[14px] leading-[20px] font-medium text-[#111827]">
                {session.fullName}
              </p>
              <p className="text-[12px] leading-[18px] text-[#0D9488] font-mono">
                {session.roles.join(" • ")}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#EDE9FE] border border-[#A78BFA] flex items-center justify-center text-[#7C3AED] font-semibold text-xs">
              {getInitials(session.fullName)}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="h-8 px-3 rounded-[8px] border border-[#E5E7EB] text-[12px] font-medium text-[#4B5563] hover:border-[#EF4444] hover:text-[#EF4444] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
            >
              Đăng xuất
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[14px] leading-[20px] font-medium text-[#111827]">
                Chế độ Xem trước
              </p>
              <p className="text-[12px] leading-[18px] text-[#6B7280]">
                Đăng nhập để thêm/sửa dữ liệu
              </p>
            </div>
            <Link
              href="/login"
              className="h-9 px-3.5 inline-flex items-center justify-center rounded-[8px] bg-[#7C3AED] text-white text-[13px] font-medium hover:bg-[#5B21B6] transition-colors"
            >
              Đăng nhập
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
