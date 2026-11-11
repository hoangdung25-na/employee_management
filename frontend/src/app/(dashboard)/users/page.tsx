"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Pagination } from "@/components/shared/Pagination";
import { useAuth } from "@/features/auth/context/AuthContext";
import { getCurrentUserApi } from "@/features/auth/services/authService";
import { AUTH_UPDATED_EVENT, setStoredSession } from "@/lib/api/client";
import {
  PERMISSIONS,
  PermissionModuleGroup,
} from "@/features/auth/types/permissions";
import {
  createUserApi,
  getPermissionTreeApi,
  getRoleOptionsApi,
  getUnlinkedEmployeesApi,
  getUsersApi,
  toggleUserStatusApi,
  updateUserApi,
} from "@/features/users/services/userService";
import {
  RoleOption,
  UnlinkedEmployeeOption,
  UserSummary,
} from "@/features/users/types/user";

const ROLE_DISPLAY_MAP: Record<string, string> = {
  SUPER_ADMIN: "Admin",
  HR_MANAGER: "Trưởng phòng Nhân sự",
  HR_STAFF: "Chuyên viên Nhân sự",
  MANAGER: "Quản lý Phòng ban",
  EMPLOYEE: "Nhân viên",
};

const ROLE_PRIORITY: string[] = [
  "SUPER_ADMIN",
  "HR_MANAGER",
  "HR_STAFF",
  "MANAGER",
  "EMPLOYEE",
];

function getPrimaryRoleCode(userRoles: string[]): string {
  for (const priorityRole of ROLE_PRIORITY) {
    if (userRoles.includes(priorityRole)) {
      return priorityRole;
    }
  }
  return userRoles[0] || "EMPLOYEE";
}

function getPrimaryRoleLabel(user: UserSummary): string {
  const code = getPrimaryRoleCode(user.roles);
  return ROLE_DISPLAY_MAP[code] || user.roleNames[0] || code;
}

export default function UsersManagementPage() {
  const { session, hasPermission } = useAuth();
  const canManageUsers = hasPermission(PERMISSIONS.USERS.CREATE);

  const [users, setUsers] = useState<UserSummary[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [permissionTree, setPermissionTree] = useState<PermissionModuleGroup[]>(
    []
  );
  const [unlinkedEmployees, setUnlinkedEmployees] = useState<
    UnlinkedEmployeeOption[]
  >([]);

  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(12);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Modal state (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserSummary | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form fields
  const [formUsername, setFormUsername] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formEmployeeId, setFormEmployeeId] = useState<string>("");
  const [formSelectedRole, setFormSelectedRole] = useState<string>("EMPLOYEE");
  const [formSelectedPermissions, setFormSelectedPermissions] = useState<
    string[]
  >([]);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formMustChangePassword, setFormMustChangePassword] = useState(true);
  const [formUnlockAccount, setFormUnlockAccount] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPageNumber(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const isActiveParam =
        statusFilter === "active"
          ? true
          : statusFilter === "suspended"
          ? false
          : undefined;

      const result = await getUsersApi({
        pageNumber,
        pageSize,
        searchTerm: debouncedSearch || undefined,
        roleCode: roleFilter || undefined,
        isActive: isActiveParam,
      });

      setUsers(result.items || []);
      setTotalCount(result.totalCount || 0);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Không thể tải danh sách người dùng.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsLoading(false);
    }
  }, [pageNumber, pageSize, debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    getRoleOptionsApi()
      .then((res) => setRoles(res || []))
      .catch(() => {});

    getPermissionTreeApi()
      .then((tree) => setPermissionTree(tree || []))
      .catch(() => {});
  }, []);

  const showToast = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Helper to get default permissions for a given roleCode
  const getDefaultPermissionsForRole = useCallback(
    (roleCode: string): string[] => {
      const found = roles.find(
        (r) => r.roleCode.toUpperCase() === roleCode.toUpperCase()
      );
      if (found?.defaultPermissions && found.defaultPermissions.length > 0) {
        return [...found.defaultPermissions];
      }
      if (roleCode.toUpperCase() === "SUPER_ADMIN") {
        return permissionTree.flatMap((m) => m.permissions.map((p) => p.code));
      }
      return [];
    },
    [roles, permissionTree]
  );

  // Open Create Modal
  const handleOpenCreateModal = async () => {
    setEditingUser(null);
    setModalError(null);
    setFormUsername("");
    setFormEmail("");
    setFormPassword("");
    setFormEmployeeId("");
    const defaultRole = "EMPLOYEE";
    setFormSelectedRole(defaultRole);
    setFormSelectedPermissions(getDefaultPermissionsForRole(defaultRole));
    setFormIsActive(true);
    setFormMustChangePassword(true);
    setFormUnlockAccount(false);
    setIsModalOpen(true);

    try {
      const list = await getUnlinkedEmployeesApi(null);
      setUnlinkedEmployees(list || []);
    } catch {
      setUnlinkedEmployees([]);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = async (user: UserSummary) => {
    setEditingUser(user);
    setModalError(null);
    setFormUsername(user.username);
    setFormEmail(user.email);
    setFormPassword("");
    setFormEmployeeId(user.employeeId || "");

    const primaryRole = getPrimaryRoleCode(user.roles);
    setFormSelectedRole(primaryRole);

    const initialPermissions =
      user.permissions && user.permissions.length > 0
        ? [...user.permissions]
        : getDefaultPermissionsForRole(primaryRole);
    setFormSelectedPermissions(initialPermissions);

    setFormIsActive(user.isActive);
    setFormMustChangePassword(user.mustChangePassword);
    setFormUnlockAccount(user.isLocked);
    setIsModalOpen(true);

    try {
      const list = await getUnlinkedEmployeesApi(user.employeeId);
      setUnlinkedEmployees(list || []);
    } catch {
      setUnlinkedEmployees([]);
    }
  };

  // When changing Chức vụ (Role) dropdown -> automatically populate default Tính năng checkboxes for that Role
  const handleRoleDropdownChange = (newRoleCode: string) => {
    setFormSelectedRole(newRoleCode);
    const defaults = getDefaultPermissionsForRole(newRoleCode);
    if (
      editingUser?.username.toLowerCase() === "admin" &&
      !defaults.includes(PERMISSIONS.USERS.VIEW)
    ) {
      defaults.push(PERMISSIONS.USERS.VIEW, PERMISSIONS.USERS.CREATE);
    }
    setFormSelectedPermissions(defaults);
  };

  // Auto-fill Email & Username suggestion when selecting an Employee in Create mode
  const handleSelectEmployee = (empId: string) => {
    setFormEmployeeId(empId);
    if (!empId) return;

    const emp = unlinkedEmployees.find((e) => e.employeeId === empId);
    if (emp) {
      setFormEmail(emp.workEmail);
      if (!editingUser && !formUsername) {
        const emailPrefix = emp.workEmail.split("@")[0] || "";
        setFormUsername(emailPrefix.toLowerCase());
      }
    }
  };

  // Toggle a single child permission checkbox in "Tính năng :"
  const handleTogglePermission = (permCode: string) => {
    if (
      editingUser?.username.toLowerCase() === "admin" &&
      (permCode === PERMISSIONS.USERS.VIEW ||
        permCode === PERMISSIONS.USERS.CREATE)
    ) {
      return;
    }

    setFormSelectedPermissions((prev) =>
      prev.includes(permCode)
        ? prev.filter((p) => p !== permCode)
        : [...prev, permCode]
    );
  };

  // Toggle an entire parent module group checkbox in "Tính năng :"
  const handleToggleModuleGroup = (moduleGroup: PermissionModuleGroup) => {
    const moduleCodes = moduleGroup.permissions.map((p) => p.code);
    const allChecked = moduleCodes.every((code) =>
      formSelectedPermissions.includes(code)
    );

    if (allChecked) {
      setFormSelectedPermissions((prev) =>
        prev.filter((code) => {
          if (
            editingUser?.username.toLowerCase() === "admin" &&
            (code === PERMISSIONS.USERS.VIEW ||
              code === PERMISSIONS.USERS.CREATE)
          ) {
            return true;
          }
          return !moduleCodes.includes(code);
        })
      );
    } else {
      setFormSelectedPermissions((prev) =>
        Array.from(new Set([...prev, ...moduleCodes]))
      );
    }
  };

  // Direct inline toggle [Hoạt động | Đình chỉ]
  const handleInlineStatusChange = async (
    user: UserSummary,
    targetActive: boolean
  ) => {
    if (!canManageUsers) return;
    if (user.isActive === targetActive) return;

    if (session?.userId === user.id && !targetActive) {
      showToast(
        "error",
        "Bạn không thể tự đình chỉ tài khoản đang đăng nhập của chính mình."
      );
      return;
    }

    setTogglingId(user.id);
    try {
      await toggleUserStatusApi(user.id, targetActive);
      setUsers((prev) =>
        prev.map((item) =>
          item.id === user.id
            ? {
                ...item,
                isActive: targetActive,
                isLocked: targetActive ? false : item.isLocked,
              }
            : item
        )
      );
      showToast(
        "success",
        targetActive
          ? `Đã kích hoạt tài khoản '${user.username}'.`
          : `Đã đình chỉ tài khoản '${user.username}' và thu hồi phiên đăng nhập.`
      );
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Không thể cập nhật trạng thái tài khoản.";
      showToast("error", msg);
    } finally {
      setTogglingId(null);
    }
  };

  // Submit Create or Edit Modal
  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setIsSubmitting(true);

    try {
      if (!editingUser) {
        await createUserApi({
          username: formUsername.trim(),
          email: formEmail.trim(),
          password: formPassword,
          employeeId: formEmployeeId || null,
          roleCodes: [formSelectedRole],
          customPermissions: formSelectedPermissions,
          isActive: formIsActive,
          mustChangePassword: formMustChangePassword,
        });
        showToast(
          "success",
          `Tạo tài khoản '${formUsername.trim()}' và phân quyền tính năng thành công.`
        );
      } else {
        await updateUserApi(editingUser.id, {
          email: formEmail.trim(),
          employeeId: formEmployeeId || null,
          roleCodes: [formSelectedRole],
          customPermissions: formSelectedPermissions,
          newPassword: formPassword.trim() ? formPassword : null,
          isActive: formIsActive,
          unlockAccount: formUnlockAccount,
          mustChangePassword: formMustChangePassword,
        });

        // If Admin updated their own currently logged-in account permissions, refresh in-memory session immediately
        if (session?.userId === editingUser.id) {
          try {
            const freshProfile = await getCurrentUserApi();
            if (freshProfile?.userId) {
              const updatedSession = {
                ...session,
                fullName: freshProfile.fullName,
                email: freshProfile.email,
                roles: freshProfile.roles,
                permissions: freshProfile.permissions,
              };
              setStoredSession(updatedSession);
              window.dispatchEvent(
                new CustomEvent(AUTH_UPDATED_EVENT, { detail: updatedSession })
              );
            }
          } catch {
            // Ignore
          }
        }

        showToast(
          "success",
          `Cập nhật tài khoản '${editingUser.username}' và phân quyền tính năng thành công.`
        );
      }

      setIsModalOpen(false);
      await fetchUsers();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi lưu tài khoản.";
      setModalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const totalSystemPermissions = permissionTree.reduce(
    (acc, m) => acc + m.permissions.length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Toast Alert matching HRFlow Design System */}
      {feedback && (
        <div
          className={`p-4 rounded-[12px] border flex items-center justify-between shadow-xs transition-all ${
            feedback.type === "success"
              ? "bg-[#ECFDF5] border-[#059669] text-[#065F46]"
              : "bg-[#FEF2F2] border-[#EF4444] text-[#991B1B]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                feedback.type === "success" ? "bg-[#059669]" : "bg-[#EF4444]"
              }`}
            />
            <p className="text-[14px] font-medium">{feedback.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-[12px] font-bold hover:opacity-75 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Page Header matching HRFlow Design System */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-[28px] lg:text-[32px] leading-[40px] font-bold text-[#111827] tracking-tight">
            Quản lý người dùng
          </h1>
          <p className="text-[14px] leading-[22px] text-[#6B7280] mt-0.5">
            Quản lý tài khoản đăng nhập, phân quyền chức vụ & tính năng động
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchUsers}
            className="h-10 px-4 rounded-[8px] text-[13px] font-medium border border-[#E5E7EB] text-[#4B5563] bg-white hover:bg-[#F9FAFB] transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <Icon name="history_edu" size={15} />
            <span>Làm mới</span>
          </button>
          {canManageUsers && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="h-10 px-4 rounded-[8px] text-[13px] font-medium bg-[#7C3AED] text-white hover:bg-[#5B21B6] transition-colors shadow-xs cursor-pointer inline-flex items-center gap-2"
            >
              <Icon name="add" size={16} />
              <span>Thêm Mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Card Container matching HRFlow Design System */}
      <div className="bg-white border border-[#E5E7EB] rounded-[16px] shadow-xs overflow-hidden">
        {/* Filter & Search Bar */}
        <div className="p-6 border-b border-[#E5E7EB] flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full xl:flex-1 xl:max-w-md">
            <div className="absolute left-3 top-2.5 text-[#9CA3AF]">
              <Icon name="search" size={18} />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo Mã NV, Tên tài khoản, Họ tên hoặc Email..."
              className="w-full h-10 pl-9 pr-4 rounded-[8px] border border-[#E5E7EB] bg-white text-[13px] text-[#111827] placeholder:text-[#9CA3AF] hover:border-[#A78BFA] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="userRoleFilter"
                className="text-[12px] leading-[18px] font-medium text-[#6B7280] whitespace-nowrap"
              >
                Chức vụ:
              </label>
              <select
                id="userRoleFilter"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPageNumber(1);
                }}
                className="h-10 px-3 rounded-[8px] border border-[#E5E7EB] bg-white text-[13px] text-[#111827] hover:border-[#A78BFA] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all"
              >
                <option value="">Tất cả chức vụ</option>
                {roles.map((r) => (
                  <option key={r.roleCode} value={r.roleCode}>
                    {ROLE_DISPLAY_MAP[r.roleCode] || r.roleName}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="userStatusFilter"
                className="text-[12px] leading-[18px] font-medium text-[#6B7280] whitespace-nowrap"
              >
                Trạng thái:
              </label>
              <select
                id="userStatusFilter"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPageNumber(1);
                }}
                className="h-10 px-3 rounded-[8px] border border-[#E5E7EB] bg-white text-[13px] text-[#111827] hover:border-[#A78BFA] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="suspended">Đình chỉ</option>
              </select>
            </div>

            {(searchTerm || roleFilter || statusFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setRoleFilter("");
                  setStatusFilter("");
                  setPageNumber(1);
                }}
                className="h-10 px-3 rounded-[8px] text-[13px] font-medium text-[#6B7280] hover:bg-[#F3F4F6] transition-colors cursor-pointer whitespace-nowrap"
              >
                Xóa lọc
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#FAFAFA] text-[11.5px] leading-[18px] font-semibold text-[#6B7280] uppercase tracking-wider whitespace-nowrap">
                <th className="py-3 px-2 w-[42px] text-center">
                  <div className="inline-flex items-center justify-center text-[#6B7280]">
                    <Icon name="settings" size={15} />
                  </div>
                </th>
                <th className="py-3 px-2 w-[86px]">Mã NV</th>
                <th className="py-3 px-2">Tên tài khoản</th>
                <th className="py-3 px-2">Họ và tên</th>
                <th className="py-3 px-2">Email</th>
                <th className="py-3 px-2">Chức vụ</th>
                <th className="py-3 px-2 text-center w-[148px]">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] bg-white text-[14px] leading-[20px]">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="h-[60px] animate-pulse">
                    <td className="py-3 px-4 text-center">
                      <div className="h-6 w-8 bg-[#EDE9FE] rounded-[6px] mx-auto" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-4 w-20 bg-[#E5E7EB] rounded-[4px]" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-4 w-28 bg-[#E5E7EB] rounded-[4px]" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-4 w-36 bg-[#E5E7EB] rounded-[4px]" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-4 w-44 bg-[#F3F4F6] rounded-[4px]" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-5 w-28 bg-[#F5F3FF] rounded-full" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-7 w-36 bg-[#ECFDF5] rounded-[8px] mx-auto" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 px-6 text-center bg-white">
                    <div className="w-12 h-12 rounded-full bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center mx-auto mb-3 font-heading font-semibold text-lg">
                      0
                    </div>
                    <h3 className="font-heading text-[20px] leading-[28px] font-semibold text-[#111827] mb-1">
                      Không tìm thấy người dùng phù hợp
                    </h3>
                    <p className="text-[14px] leading-[22px] text-[#6B7280] max-w-md mx-auto">
                      Không có tài khoản người dùng nào khớp với bộ lọc hiện tại.
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const roleLabel = getPrimaryRoleLabel(user);
                  const isSelf = session?.userId === user.id;

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-[#F5F3FF]/40 transition-colors"
                    >
                      {/* Column 1: Edit Action (✏️...) */}
                      <td className="py-3 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(user)}
                          title="Chỉnh sửa chức vụ, tính năng & mật khẩu"
                          className="inline-flex items-center gap-0.5 px-1.5 py-1 rounded-[8px] text-[#6B7280] hover:text-[#7C3AED] hover:bg-[#EDE9FE] transition-colors cursor-pointer"
                        >
                          <Icon name="edit_square" size={15} />
                          <span className="text-[11px] font-bold tracking-tighter">
                            ...
                          </span>
                        </button>
                      </td>

                      {/* Column 2: Mã NV */}
                      <td className="py-3 px-2 whitespace-nowrap">
                        <span className="font-mono text-[11px] font-semibold text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] px-1.5 py-0.5 rounded-[6px] inline-block whitespace-nowrap">
                          {user.employeeCode || "—"}
                        </span>
                      </td>

                      {/* Column 3: Tên tài khoản */}
                      <td className="py-3 px-2 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[#111827] text-[13px]">
                            {user.username}
                          </span>
                          {user.isLocked && (
                            <span
                              title="Tài khoản đang tạm khóa do nhập sai mật khẩu nhiều lần"
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FEF3C7] text-[#B45309] border border-[#FCD34D]"
                            >
                              <Icon name="lock" size={12} />
                              Khóa
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 4: Họ và tên */}
                      <td className="py-3 px-2 whitespace-nowrap">
                        <div className="font-medium text-[#111827] text-[13px]">
                          {user.fullName}
                        </div>
                        {user.departmentName &&
                          user.departmentName !== "Hệ thống" && (
                            <div className="text-[11px] text-[#6B7280]">
                              {user.departmentName}
                            </div>
                          )}
                      </td>

                      {/* Column 5: Email */}
                      <td
                        title={user.email}
                        className="py-3 px-2 text-[12px] text-[#4B5563] max-w-[135px] truncate"
                      >
                        {user.email}
                      </td>

                      {/* Column 6: Chức vụ / Vai trò & Số tính năng */}
                      <td className="py-3 px-2 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12.5px] text-[#111827] font-medium">
                            {roleLabel}
                          </span>
                          <span
                            title={`Được cấp ${user.permissions?.length || 0} tính năng`}
                            className="text-[11px] px-1.5 py-0.5 rounded-full bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] font-semibold whitespace-nowrap"
                          >
                            {user.permissions?.length || 0} quyền
                          </span>
                        </div>
                      </td>

                      {/* Column 7: Trạng thái [Hoạt động | Đình chỉ] */}
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <div className="inline-flex items-center rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] p-0.5">
                          <button
                            type="button"
                            disabled={togglingId === user.id || !canManageUsers}
                            onClick={() => handleInlineStatusChange(user, true)}
                            className={`px-2 py-0.5 rounded-[6px] text-[11px] font-medium transition-all ${
                              user.isActive
                                ? "bg-[#ECFDF5] text-[#059669] border border-[#10B981] font-semibold shadow-2xs"
                                : "text-[#6B7280] hover:text-[#111827]"
                            } ${
                              canManageUsers
                                ? "cursor-pointer"
                                : "cursor-default"
                            }`}
                          >
                            Hoạt động
                          </button>
                          <button
                            type="button"
                            disabled={
                              togglingId === user.id ||
                              !canManageUsers ||
                              isSelf
                            }
                            title={
                              isSelf
                                ? "Không thể tự đình chỉ tài khoản đang đăng nhập"
                                : "Đình chỉ tài khoản"
                            }
                            onClick={() =>
                              handleInlineStatusChange(user, false)
                            }
                            className={`px-2 py-0.5 rounded-[6px] text-[11px] font-medium transition-all ${
                              !user.isActive
                                ? "bg-[#FEF2F2] text-[#DC2626] border border-[#F87171] font-semibold shadow-2xs"
                                : "text-[#6B7280] hover:text-[#111827]"
                            } ${
                              canManageUsers && !isSelf
                                ? "cursor-pointer"
                                : "cursor-not-allowed opacity-50"
                            }`}
                          >
                            Đình chỉ
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer using shared HRFlow Pagination component */}
        {!isLoading && (
          <Pagination
            pageNumber={pageNumber}
            pageSize={pageSize}
            totalCount={totalCount}
            totalPages={totalPages}
            onPageChange={(page) => setPageNumber(page)}
            itemLabel="tài khoản"
          />
        )}
      </div>

      {/* Create / Edit User Modal matching HRFlow EmployeeFormModal Design System */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white border border-[#E5E7EB] rounded-[12px] shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-between shrink-0">
              <div>
                <h2 className="font-heading text-[20px] leading-[28px] font-semibold text-[#111827]">
                  {editingUser
                    ? `Chỉnh sửa người dùng: ${editingUser.username}`
                    : "Thêm người dùng mới"}
                </h2>
                <p className="text-[12px] leading-[18px] text-[#6B7280] mt-0.5">
                  Chọn{" "}
                  <span className="font-medium text-[#7C3AED]">Chức vụ</span> để
                  lấy quyền mặc định, sau đó tích chọn các{" "}
                  <span className="font-medium text-[#7C3AED]">Tính năng</span>{" "}
                  cụ thể bên dưới
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-8 px-3 rounded-[6px] text-[13px] font-medium text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors cursor-pointer shrink-0"
              >
                Đóng ✕
              </button>
            </div>

            {/* Modal Form Body */}
            <form
              id="userManagementModalForm"
              onSubmit={handleSubmitModal}
              className="p-6 space-y-5 overflow-y-auto flex-1 text-[13px]"
            >
              {modalError && (
                <div className="p-3.5 rounded-[10px] bg-[#FEF2F2] border border-[#EF4444] text-[#991B1B] text-[13px] font-medium">
                  {modalError}
                </div>
              )}

              {/* Row 1: Link to Employee Profile & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-[#374151] mb-1">
                    Hồ sơ Nhân viên liên kết
                  </label>
                  <select
                    value={formEmployeeId}
                    onChange={(e) => handleSelectEmployee(e.target.value)}
                    className="w-full h-10 px-3 rounded-[8px] border border-[#E5E7EB] bg-white text-[#111827] hover:border-[#A78BFA] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all"
                  >
                    <option value="">
                      -- Tài khoản Quản trị độc lập (Mã: ADM) --
                    </option>
                    {unlinkedEmployees.map((emp) => (
                      <option key={emp.employeeId} value={emp.employeeId}>
                        [{emp.employeeCode}] {emp.fullName} —{" "}
                        {emp.departmentName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#374151] mb-1">
                    <span className="text-[#EF4444] mr-1">*</span>Tên tài khoản
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingUser)}
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="VD: minh.nguyen"
                    className="w-full h-10 px-3 rounded-[8px] border border-[#E5E7EB] bg-white text-[#111827] disabled:bg-[#F3F4F6] disabled:text-[#6B7280] hover:border-[#A78BFA] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all"
                  />
                </div>
              </div>

              {/* Row 2: Địa chỉ Email & Mật khẩu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-[#374151] mb-1">
                    <span className="text-[#EF4444] mr-1">*</span>Địa chỉ Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="admin@company.com"
                    className="w-full h-10 px-3 rounded-[8px] border border-[#E5E7EB] bg-white text-[#111827] hover:border-[#A78BFA] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#374151] mb-1">
                    {editingUser ? (
                      "Đặt lại mật khẩu (Để trống nếu giữ nguyên)"
                    ) : (
                      <>
                        <span className="text-[#EF4444] mr-1">*</span>Mật khẩu
                        khởi tạo
                      </>
                    )}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={
                      editingUser
                        ? "Nhập mật khẩu mới nếu muốn đổi..."
                        : "Tối thiểu 6 ký tự..."
                    }
                    className="w-full h-10 px-3 rounded-[8px] border border-[#E5E7EB] bg-white text-[#111827] hover:border-[#A78BFA] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all"
                  />
                </div>
              </div>

              {/* Row 3: * Chức vụ Dropdown */}
              <div>
                <label className="block text-[12px] font-medium text-[#374151] mb-1">
                  <span className="text-[#EF4444] mr-1">*</span>Chức vụ :
                </label>
                <select
                  value={formSelectedRole}
                  onChange={(e) => handleRoleDropdownChange(e.target.value)}
                  className="w-full h-10 px-3 rounded-[8px] border border-[#E5E7EB] bg-white text-[#111827] font-medium hover:border-[#A78BFA] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all"
                >
                  {roles.map((r) => (
                    <option key={r.roleCode} value={r.roleCode}>
                      {ROLE_DISPLAY_MAP[r.roleCode] || r.roleName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Row 4: [✓] Hoạt động & Security Flags */}
              <div className="flex flex-wrap items-center gap-6 pt-1">
                <label className="inline-flex items-center gap-2 text-[13px] font-medium text-[#111827] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    disabled={
                      Boolean(editingUser) &&
                      session?.userId === editingUser?.id
                    }
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#7C3AED]"
                  />
                  <span>Hoạt động</span>
                </label>

                <label className="inline-flex items-center gap-2 text-[13px] text-[#4B5563] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formMustChangePassword}
                    onChange={(e) =>
                      setFormMustChangePassword(e.target.checked)
                    }
                    className="w-4 h-4 rounded accent-[#7C3AED]"
                  />
                  <span>Đổi mật khẩu lần đăng nhập tới</span>
                </label>

                {editingUser?.isLocked && (
                  <label className="inline-flex items-center gap-2 text-[13px] text-[#B45309] font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formUnlockAccount}
                      onChange={(e) => setFormUnlockAccount(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#7C3AED]"
                    />
                    <span>Mở khóa tài khoản đang bị khóa</span>
                  </label>
                )}
              </div>

              {/* Row 5: Tính năng : (Tree Checkboxes) */}
              <div className="pt-3 border-t border-[#E5E7EB]">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-[#111827]">
                      Tính năng :
                    </span>
                    <span className="text-[12px] px-2.5 py-0.5 rounded-full bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] font-semibold">
                      Đã chọn {formSelectedPermissions.length} /{" "}
                      {totalSystemPermissions}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[12px]">
                    <button
                      type="button"
                      onClick={() =>
                        setFormSelectedPermissions(
                          permissionTree.flatMap((m) =>
                            m.permissions.map((p) => p.code)
                          )
                        )
                      }
                      className="text-[#7C3AED] hover:text-[#5B21B6] hover:underline font-medium cursor-pointer"
                    >
                      Chọn tất cả
                    </button>
                    <span className="text-[#D1D5DB]">|</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleRoleDropdownChange(formSelectedRole)
                      }
                      className="text-[#6B7280] hover:text-[#111827] hover:underline font-medium cursor-pointer"
                    >
                      Mặc định theo Chức vụ
                    </button>
                  </div>
                </div>

                {/* Multi-column Tree Checkbox Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-[#FAFAFA] p-4 rounded-[12px] border border-[#E5E7EB]">
                  {permissionTree.map((moduleGroup) => {
                    const moduleCodes = moduleGroup.permissions.map(
                      (p) => p.code
                    );
                    const checkedCount = moduleCodes.filter((code) =>
                      formSelectedPermissions.includes(code)
                    ).length;
                    const isAllChecked =
                      moduleCodes.length > 0 &&
                      checkedCount === moduleCodes.length;
                    const isPartialChecked =
                      checkedCount > 0 && checkedCount < moduleCodes.length;

                    return (
                      <div
                        key={moduleGroup.moduleCode}
                        className={`p-3 rounded-[10px] border transition-colors space-y-2 ${
                          checkedCount > 0
                            ? "bg-white border-[#DDD6FE]"
                            : "bg-white border-[#E5E7EB]"
                        }`}
                      >
                        {/* Parent Module Checkbox */}
                        <label className="flex items-start gap-2 text-[13px] font-semibold text-[#111827] cursor-pointer select-none hover:text-[#7C3AED]">
                          <input
                            type="checkbox"
                            checked={isAllChecked}
                            ref={(el) => {
                              if (el) el.indeterminate = isPartialChecked;
                            }}
                            onChange={() =>
                              handleToggleModuleGroup(moduleGroup)
                            }
                            className="mt-0.5 w-4 h-4 rounded accent-[#7C3AED] shrink-0"
                          />
                          <span>{moduleGroup.moduleName}</span>
                        </label>

                        {/* Child Feature Checkboxes */}
                        <div className="pl-5 space-y-1.5 border-l border-[#E5E7EB] ml-1.5">
                          {moduleGroup.permissions.map((perm) => {
                            const isChecked = formSelectedPermissions.includes(
                              perm.code
                            );
                            const isProtectedRootAdminPerm =
                              editingUser?.username.toLowerCase() === "admin" &&
                              (perm.code === PERMISSIONS.USERS.VIEW ||
                                perm.code === PERMISSIONS.USERS.CREATE);

                            return (
                              <label
                                key={perm.code}
                                title={perm.description || perm.code}
                                className={`flex items-start gap-2 text-[12.5px] select-none ${
                                  isProtectedRootAdminPerm
                                    ? "text-[#9CA3AF] cursor-not-allowed"
                                    : "text-[#374151] cursor-pointer hover:text-[#7C3AED]"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={isProtectedRootAdminPerm}
                                  onChange={() =>
                                    handleTogglePermission(perm.code)
                                  }
                                  className="mt-0.5 w-3.5 h-3.5 rounded accent-[#7C3AED] shrink-0"
                                />
                                <span className="leading-snug">
                                  {perm.displayName}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </form>

            {/* Modal Footer matching HRFlow EmployeeFormModal */}
            <div className="px-6 py-4 border-t border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-10 px-4 rounded-[8px] border border-[#7C3AED] text-[#7C3AED] text-[14px] font-medium hover:bg-[#F5F3FF] transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                form="userManagementModalForm"
                disabled={isSubmitting}
                className="h-10 px-5 rounded-[8px] bg-[#7C3AED] text-white text-[14px] font-medium hover:bg-[#5B21B6] disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isSubmitting ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
