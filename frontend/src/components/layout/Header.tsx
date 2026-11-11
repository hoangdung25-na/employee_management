"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import { ROLE_LABELS } from "@/features/auth/types/roles";
import { Icon } from "@/components/ui/Icon";
import { getInitials } from "@/lib/utils/format";

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  isUnread: boolean;
  link: string;
}

export function Header() {
  const router = useRouter();
  const { session, isAuthenticated, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "notif-1",
      title: "Kỳ công tháng 11/2026",
      desc: "Dữ liệu chấm công trực tuyến đã sẵn sàng để tổng hợp và rà soát.",
      time: "10 phút trước",
      isUnread: true,
      link: "/attendance",
    },
    {
      id: "notif-2",
      title: "Đơn xin nghỉ phép mới",
      desc: "Có đề xuất nghỉ phép mới đang chờ trưởng bộ phận duyệt.",
      time: "1 giờ trước",
      isUnread: true,
      link: "/leaves",
    },
    {
      id: "notif-3",
      title: "Kỳ đánh giá KPI Q4/2026",
      desc: "Hệ thống đã mở đợt tự đánh giá định kỳ cho toàn bộ nhân sự.",
      time: "Hôm qua",
      isUnread: true,
      link: "/performance",
    },
  ]);

  const notifRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        helpRef.current &&
        !helpRef.current.contains(event.target as Node)
      ) {
        setShowHelp(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const q = searchQuery.trim();
      if (q) {
        router.push(`/employees?search=${encodeURIComponent(q)}`);
      } else {
        router.push("/employees");
      }
    }
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
  };

  const unreadCount = notifications.filter((n) => n.isUnread).length;

  const roleDisplay = session?.roles?.length
    ? session.roles.map((r) => ROLE_LABELS[r] || r).join(" • ")
    : "Nhân viên";

  return (
    <header className="h-16 bg-white border-b border-[#E5E7EB] px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Left Area: Breadcrumbs & Global Search */}
      <div className="flex items-center gap-4 min-w-0 flex-1 mr-2">
        <nav className="hidden xl:flex items-center gap-1.5 text-[13px] leading-none text-[#6B7280] whitespace-nowrap shrink-0">
          <Link href="/dashboard" className="font-semibold text-[#111827] hover:text-[#7C3AED] transition-colors">
            HRFlow
          </Link>
          <Icon name="chevron_right" size={14} className="text-[#D1D5DB] shrink-0" />
          <span className="font-medium text-[#7C3AED]">Hệ thống Quản trị</span>
        </nav>

        {/* Global Search Bar */}
        <div className="relative w-full max-w-[320px] min-w-0 flex-1">
          <div className="absolute inset-y-0 left-3 flex items-center text-[#9CA3AF] pointer-events-none">
            <Icon name="search" size={18} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Tìm kiếm nhân sự, phòng ban (Nhấn Enter)..."
            className="w-full h-10 pl-9 pr-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-[10px] text-[13px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20 transition-all"
          />
        </div>
      </div>

      {/* Right Area: Actions & User Info */}
      <div className="flex items-center gap-3.5 shrink-0">
        {/* Quick action icon buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                setShowNotifications((prev) => !prev);
                setShowHelp(false);
              }}
              className="relative w-9 h-9 rounded-[8px] flex items-center justify-center text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors cursor-pointer shrink-0"
              title="Thông báo"
            >
              <Icon name="notifications" size={19} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F97316] ring-2 ring-white" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-[12px] border border-[#E5E7EB] shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-semibold text-[15px] text-[#111827]">
                      Thông báo hệ thống
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF7ED] text-[#EA580C] border border-[#FFEDD5]">
                        {unreadCount} mới
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-[12px] font-medium text-[#7C3AED] hover:underline cursor-pointer"
                    >
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>

                <div className="divide-y divide-[#F3F4F6] max-h-80 overflow-y-auto my-2">
                  {notifications.map((n) => (
                    <Link
                      key={n.id}
                      href={n.link}
                      onClick={() => setShowNotifications(false)}
                      className="block p-3 rounded-[8px] hover:bg-[#F9FAFB] transition-colors group cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {n.isUnread && (
                            <span className="w-2 h-2 rounded-full bg-[#7C3AED] shrink-0" />
                          )}
                          <p className="text-[13px] font-semibold text-[#111827] group-hover:text-[#7C3AED] transition-colors">
                            {n.title}
                          </p>
                        </div>
                        <span className="text-[11px] text-[#9CA3AF] whitespace-nowrap shrink-0">
                          {n.time}
                        </span>
                      </div>
                      <p className="text-[12px] text-[#6B7280] mt-1 leading-relaxed pl-3.5">
                        {n.desc}
                      </p>
                    </Link>
                  ))}
                </div>

                <div className="pt-2 border-t border-[#F3F4F6] text-center">
                  <Link
                    href="/dashboard"
                    onClick={() => setShowNotifications(false)}
                    className="text-[12px] font-semibold text-[#7C3AED] hover:underline"
                  >
                    Xem tất cả thông báo →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Help Dropdown */}
          <div className="relative" ref={helpRef}>
            <button
              type="button"
              onClick={() => {
                setShowHelp((prev) => !prev);
                setShowNotifications(false);
              }}
              className="w-9 h-9 rounded-[8px] flex items-center justify-center text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors cursor-pointer shrink-0"
              title="Trợ giúp"
            >
              <Icon name="help_outline" size={19} />
            </button>

            {showHelp && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-[12px] border border-[#E5E7EB] shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center gap-2 pb-3 border-b border-[#F3F4F6]">
                  <div className="w-7 h-7 rounded-[6px] bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center">
                    <Icon name="help_outline" size={16} />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-[14px] text-[#111827]">
                      Trung tâm Trợ giúp HRFlow
                    </h3>
                    <p className="text-[11px] text-[#6B7280]">Hệ thống Quản trị Nhân sự Doanh nghiệp</p>
                  </div>
                </div>

                <div className="space-y-2.5 py-3 text-[13px]">
                  <div className="p-2.5 rounded-[8px] bg-[#F9FAFB] border border-[#E5E7EB] flex items-center gap-2.5">
                    <Icon name="call" size={16} className="text-[#059669]" />
                    <div>
                      <p className="text-[11px] text-[#6B7280]">Hotline Hỗ trợ Kỹ thuật</p>
                      <p className="font-semibold text-[#111827]">1900 6868 (Ext: 102)</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-[8px] bg-[#F9FAFB] border border-[#E5E7EB] flex items-center gap-2.5">
                    <Icon name="email" size={16} className="text-[#3B82F6]" />
                    <div>
                      <p className="text-[11px] text-[#6B7280]">Email Hỗ trợ Khách hàng</p>
                      <p className="font-semibold text-[#111827]">support@hrflow.vn</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-[8px] bg-[#F9FAFB] border border-[#E5E7EB] flex items-center gap-2.5">
                    <Icon name="description" size={16} className="text-[#D97706]" />
                    <div>
                      <p className="text-[11px] text-[#6B7280]">Tài liệu Hướng dẫn</p>
                      <Link href="/dashboard" onClick={() => setShowHelp(false)} className="font-medium text-[#7C3AED] hover:underline">
                        Xem cẩm nang sử dụng HRFlow
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#F3F4F6] text-center text-[11px] text-[#9CA3AF]">
                  Phiên bản: HRFlow Enterprise v2.4.0
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="h-6 w-px bg-[#E5E7EB] shrink-0" />

        {/* User Profile info */}
        {isAuthenticated && session ? (
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:flex flex-col justify-center whitespace-nowrap shrink-0">
              <p className="text-[13px] leading-[18px] font-semibold text-[#111827] whitespace-nowrap">
                {session.fullName}
              </p>
              <p className="text-[11px] leading-[15px] text-[#0D9488] font-medium whitespace-nowrap">
                {roleDisplay}
              </p>
            </div>

            <div className="w-9 h-9 rounded-full bg-[#EDE9FE] border border-[#DDD6FE] flex items-center justify-center text-[#7C3AED] font-heading font-bold text-[12px] leading-none shrink-0">
              {getInitials(session.fullName)}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="h-9 px-3.5 inline-flex items-center justify-center rounded-[8px] border border-[#E5E7EB] bg-white text-[13px] leading-none font-medium text-[#4B5563] hover:border-[#EF4444] hover:text-[#EF4444] hover:bg-[#FEF2F2] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Đăng xuất
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/login"
              className="h-9 px-4 rounded-[8px] bg-[#7C3AED] hover:bg-[#5B21B6] text-white text-[13px] leading-none font-medium transition-colors inline-flex items-center justify-center whitespace-nowrap shrink-0"
            >
              Đăng nhập
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
