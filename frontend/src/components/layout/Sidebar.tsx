"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import { PERMISSIONS } from "@/features/auth/types/permissions";
import { Icon, IconName } from "@/components/ui/Icon";

interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  permission?: string | null;
}

const BACKOFFICE_NAV_ITEMS: NavItem[] = [
  {
    label: "Tổng quan",
    href: "/dashboard",
    icon: "dashboard",
    permission: null,
  },
  {
    label: "Hồ sơ nhân sự",
    href: "/employees",
    icon: "badge",
    permission: PERMISSIONS.EMPLOYEES.VIEW,
  },
  {
    label: "Cơ cấu phòng ban",
    href: "/departments",
    icon: "apartment",
    permission: PERMISSIONS.DEPARTMENTS.VIEW,
  },
  {
    label: "Tiếp nhận & Nghỉ việc",
    href: "/onboarding",
    icon: "flag",
    permission: PERMISSIONS.ONBOARDING.MANAGE,
  },
  {
    label: "Chấm công & Ca làm",
    href: "/attendance",
    icon: "more_time",
    permission: PERMISSIONS.ATTENDANCE.MANAGE,
  },
  {
    label: "Nghỉ phép & Quỹ phép",
    href: "/leaves",
    icon: "history_edu",
    permission: PERMISSIONS.LEAVES.APPROVE,
  },
  {
    label: "Kê khai giờ làm",
    href: "/timesheets",
    icon: "schedule",
    permission: PERMISSIONS.TIMESHEETS.APPROVE,
  },
  {
    label: "Đánh giá KPI",
    href: "/performance",
    icon: "trending_up",
    permission: PERMISSIONS.PERFORMANCE.EVALUATE,
  },
  {
    label: "Đào tạo nội bộ",
    href: "/training",
    icon: "school",
    permission: PERMISSIONS.TRAINING.MANAGE,
  },
  {
    label: "Người dùng",
    href: "/users",
    icon: "groups",
    permission: PERMISSIONS.USERS.VIEW,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { session, hasPermission } = useAuth();

  const visibleBackofficeItems = BACKOFFICE_NAV_ITEMS.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );

  return (
    <aside className="w-[260px] shrink-0 bg-white border-r border-[#E5E7EB] hidden lg:flex flex-col justify-between sticky top-0 h-screen overflow-y-auto">
      <div className="p-5 space-y-6">
        {/* Brand Identity */}
        <div className="flex items-center gap-3 px-1">
          <div className="w-9 h-9 rounded-[10px] bg-[#7C3AED] flex items-center justify-center text-white font-heading font-bold text-lg shadow-sm shrink-0">
            H
          </div>
          <div className="min-w-0">
            <span className="font-heading text-[20px] leading-[26px] font-bold text-[#111827] tracking-tight block">
              HRFlow
            </span>
            <span className="text-[11px] leading-[14px] text-[#0D9488] font-semibold block uppercase tracking-wider">
              Quản trị Nhân sự
            </span>
          </div>
        </div>

        {/* Back-Office Navigation Links */}
        {visibleBackofficeItems.length > 0 && (
          <div className="space-y-1">
            <p className="px-3 mb-2 text-[11px] leading-[16px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
              Danh mục quản lý
            </p>
            {visibleBackofficeItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-[10px] text-[13px] leading-[20px] transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-[#EDE9FE] text-[#7C3AED] font-semibold border-l-[3px] border-[#7C3AED]"
                      : "text-[#4B5563] hover:bg-[#F5F3FF] hover:text-[#7C3AED]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      name={item.icon}
                      size={18}
                      className={`shrink-0 ${
                        isActive ? "text-[#7C3AED]" : "text-[#6B7280]"
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Employee Self-Service Section */}
        {session?.employeeId && (
          <div className="space-y-1 pt-2 border-t border-[#F3F4F6]">
            <p className="px-3 mb-2 text-[11px] leading-[16px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
              Cá nhân
            </p>
            <Link
              href={`/employees/${session.employeeId}`}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-[10px] text-[13px] leading-[20px] transition-all whitespace-nowrap ${
                pathname === `/employees/${session.employeeId}`
                  ? "bg-[#EDE9FE] text-[#7C3AED] font-semibold border-l-[3px] border-[#7C3AED]"
                  : "text-[#4B5563] hover:bg-[#F5F3FF] hover:text-[#7C3AED]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  name="badge"
                  size={18}
                  className={
                    pathname === `/employees/${session.employeeId}`
                      ? "text-[#7C3AED]"
                      : "text-[#6B7280]"
                  }
                />
                <span>Hồ sơ của tôi</span>
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-[#F3F4F6] shrink-0">
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-[10px] p-3 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[6px] bg-[#EDE9FE] flex items-center justify-center text-[#7C3AED] shrink-0">
            <Icon name="verified" size={15} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[12px] font-semibold text-[#111827] leading-tight truncate">
              Hệ thống Quản trị Nhân sự
            </span>
            <span className="text-[11px] text-[#9CA3AF] leading-tight truncate mt-0.5">
              HRFlow v1.0
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
