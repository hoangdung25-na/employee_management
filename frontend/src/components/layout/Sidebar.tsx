"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Icon, IconName } from "@/components/ui/Icon";

interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  badge?: string | null;
  permission?: string | null;
}

const BACKOFFICE_NAV_ITEMS: NavItem[] = [
  {
    label: "Tổng quan",
    href: "/dashboard",
    icon: "dashboard",
    badge: null,
    permission: null,
  },
  {
    label: "Hồ sơ nhân sự",
    href: "/employees",
    icon: "badge",
    badge: "Core",
    permission: "Employee.View",
  },
  {
    label: "Cơ cấu phòng ban",
    href: "/departments",
    icon: "apartment",
    badge: null,
    permission: "Department.View",
  },
  {
    label: "Quy trình Nhận / Nghỉ",
    href: "/onboarding",
    icon: "flag",
    badge: "SOP",
    permission: "Onboarding.Manage",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { session, hasPermission } = useAuth();

  const visibleBackofficeItems = BACKOFFICE_NAV_ITEMS.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );

  return (
    <aside className="w-[260px] shrink-0 bg-white border-r border-[#E5E7EB] hidden lg:flex flex-col justify-between min-h-screen">
      <div className="p-5 space-y-6">
        {/* Brand Identity */}
        <div className="flex items-center gap-3 px-1">
          <div className="w-9 h-9 rounded-[10px] bg-[#7C3AED] flex items-center justify-center text-white font-heading font-bold text-lg shadow-sm">
            H
          </div>
          <div>
            <span className="font-heading text-[20px] leading-[26px] font-bold text-[#111827] tracking-tight block">
              HRFlow
            </span>
            <span className="text-[11px] leading-[14px] text-[#0D9488] font-semibold block uppercase tracking-wider">
              Warm Enterprise HR
            </span>
          </div>
        </div>

        {/* Back-Office Navigation Links */}
        {visibleBackofficeItems.length > 0 && (
          <div className="space-y-1">
            <p className="px-3 mb-2 text-[11px] leading-[16px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
              Không gian Quản trị
            </p>
            {visibleBackofficeItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-[10px] text-[13px] leading-[20px] transition-all ${
                    isActive
                      ? "bg-[#EDE9FE] text-[#7C3AED] font-semibold border-l-[3px] border-[#7C3AED]"
                      : "text-[#4B5563] hover:bg-[#F5F3FF] hover:text-[#7C3AED]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      name={item.icon}
                      size={18}
                      className={isActive ? "text-[#7C3AED]" : "text-[#6B7280]"}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-[#F0FDFA] text-[#0D9488] border border-[#99F6E4]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* Employee Self-Service (ESS) Section */}
        {session?.employeeId && (
          <div className="space-y-1 pt-2 border-t border-[#F3F4F6]">
            <p className="px-3 mb-2 text-[11px] leading-[16px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
              Cổng Tự phục vụ (ESS)
            </p>
            <Link
              href={`/employees/${session.employeeId}`}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-[10px] text-[13px] leading-[20px] transition-all ${
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
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">
                ESS
              </span>
            </Link>
          </div>
        )}
      </div>

      {/* Bottom Section: Enterprise License + RBAC */}
      <div className="p-4 space-y-3 border-t border-[#F3F4F6]">
        {/* Stitch Enterprise badge */}
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-[10px] p-3 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[6px] bg-[#EDE9FE] flex items-center justify-center text-[#7C3AED] shrink-0">
            <Icon name="verified" size={15} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[12px] font-semibold text-[#111827] leading-tight truncate">
              Bản Doanh Nghiệp
            </span>
            <span className="text-[11px] text-[#6B7280] font-mono leading-tight">
              HRFlow v2.4 (Enterprise)
            </span>
          </div>
        </div>

        {/* Security / RBAC Banner */}
        <div className="px-3 py-2 rounded-[8px] bg-[#F5F3FF] border border-[#DDD6FE] text-[11px] leading-[16px] text-[#5B21B6]">
          <span className="font-semibold block">
            {session ? `Quyền: ${session.roles.join(", ")}` : "HR Admin Mode"}
          </span>
          <span className="text-[#6B7280]">Bảo vệ 5-Role RBAC & Row-level ESS.</span>
        </div>
      </div>
    </aside>
  );
}
