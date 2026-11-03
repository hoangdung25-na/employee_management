"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";

const BACKOFFICE_NAV_ITEMS = [
  {
    label: "Tổng quan nhân sự",
    href: "/dashboard",
    badge: null,
    permission: null,
  },
  {
    label: "Thành viên đội ngũ",
    href: "/employees",
    badge: "HRFlow",
    permission: "Employee.View",
  },
  {
    label: "Cơ cấu phòng ban",
    href: "/departments",
    badge: null,
    permission: "Department.View",
  },
  {
    label: "Quy trình Nhận / Nghỉ việc",
    href: "/onboarding",
    badge: "Checklist",
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
    <aside className="w-64 shrink-0 bg-white border-r border-[#E5E7EB] hidden lg:flex flex-col justify-between min-h-screen">
      <div className="p-6 space-y-6">
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[8px] bg-[#7C3AED] flex items-center justify-center text-white font-heading font-bold text-lg shadow-xs">
            H
          </div>
          <div>
            <span className="font-heading text-[20px] leading-[28px] font-semibold text-[#111827] tracking-tight block">
              HRFlow
            </span>
            <span className="text-[11px] leading-[16px] text-[#0D9488] font-medium block">
              HRM & Self-Service
            </span>
          </div>
        </div>

        {/* Back-Office Navigation Links */}
        {visibleBackofficeItems.length > 0 && (
          <div className="space-y-1">
            <p className="px-3 mb-2 text-[12px] leading-[18px] font-medium text-[#6B7280] uppercase tracking-wider">
              Không gian Quản trị
            </p>
            {visibleBackofficeItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-4 py-3 min-h-[48px] rounded-[8px] text-[14px] leading-[22px] transition-colors ${
                    isActive
                      ? "bg-[#EDE9FE] text-[#7C3AED] font-medium border-l-[3px] border-[#7C3AED]"
                      : "text-[#4B5563] hover:bg-[#F5F3FF] hover:text-[#7C3AED]"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-[#F0FDFA] text-[#0D9488] border border-[#99F6E4]">
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
          <div className="space-y-1">
            <p className="px-3 mb-2 text-[12px] leading-[18px] font-medium text-[#6B7280] uppercase tracking-wider">
              Cổng Tự phục vụ (ESS)
            </p>
            <Link
              href={`/employees/${session.employeeId}`}
              className={`flex items-center justify-between px-4 py-3 min-h-[48px] rounded-[8px] text-[14px] leading-[22px] transition-colors ${
                pathname === `/employees/${session.employeeId}`
                  ? "bg-[#EDE9FE] text-[#7C3AED] font-medium border-l-[3px] border-[#7C3AED]"
                  : "text-[#4B5563] hover:bg-[#F5F3FF] hover:text-[#7C3AED]"
              }`}
            >
              <span>Hồ sơ cá nhân của tôi</span>
              <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">
                ESS
              </span>
            </Link>
          </div>
        )}
      </div>

      {/* Security Notice Banner (AGENTS.md Golden Rule #3) */}
      <div className="p-4 m-4 rounded-[8px] bg-[#F5F3FF] border border-[#DDD6FE]">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#0D9488]" />
          <span className="text-[12px] leading-[18px] font-semibold text-[#5B21B6]">
            {session ? `Vai trò: ${session.roles.join(", ")}` : "Chế độ Nội bộ HR/Admin"}
          </span>
        </div>
        <p className="text-[12px] leading-[18px] text-[#6B7280]">
          Dữ liệu hồ sơ & lương thưởng được bảo vệ theo chuẩn phân quyền 5-Role RBAC & ESS.
        </p>
      </div>
    </aside>
  );
}
