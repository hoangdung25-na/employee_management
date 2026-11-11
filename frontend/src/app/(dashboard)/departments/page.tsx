"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CreateDepartmentPayload,
  Department,
  DepartmentDetail,
  UpdateDepartmentPayload,
} from "@/features/departments/types/department";
import {
  createDepartment,
  deleteDepartment,
  getDepartmentById,
  getDepartments,
  updateDepartment,
} from "@/features/departments/services/departmentService";
import { getEmployees } from "@/features/employees/services/employeeService";
import { EmployeeSummary } from "@/features/employees/types/employee";
import { useAuth } from "@/features/auth/context/AuthContext";
import { formatDateVN } from "@/lib/utils/format";

export default function DepartmentsPage() {
  const { hasPermission } = useAuth();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [keyword, setKeyword] = useState("");
  const [includeInactive, setIncludeInactive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create / Edit Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [departmentCode, setDepartmentCode] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [parentDepartmentId, setParentDepartmentId] = useState<string>("");
  const [managerId, setManagerId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail Modal state
  const [detailDept, setDetailDept] = useState<DepartmentDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [deptList, empResult] = await Promise.all([
        getDepartments({ keyword, includeInactive }),
        getEmployees({ pageNumber: 1, pageSize: 100 }).catch(() => ({ items: [] })),
      ]);
      setDepartments(deptList);
      setEmployees(empResult.items);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tải danh sách phòng ban. Vui lòng kiểm tra quyền truy cập."
      );
    } finally {
      setIsLoading(false);
    }
  }, [keyword, includeInactive]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = () => {
    setEditingDept(null);
    setDepartmentCode("");
    setDepartmentName("");
    setParentDepartmentId("");
    setManagerId("");
    setDescription("");
    setIsActive(true);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditModal = (dept: Department) => {
    setEditingDept(dept);
    setDepartmentCode(dept.departmentCode);
    setDepartmentName(dept.departmentName);
    setParentDepartmentId(dept.parentDepartmentId || "");
    setManagerId(dept.managerId || "");
    setDescription(dept.description || "");
    setIsActive(dept.isActive);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenDetail = async (id: string) => {
    setIsLoadingDetail(true);
    try {
      const detail = await getDepartmentById(id);
      setDetailDept(detail);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Không thể tải chi tiết phòng ban."
      );
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingDept) {
        const payload: UpdateDepartmentPayload = {
          departmentName,
          parentDepartmentId: parentDepartmentId || null,
          managerId: managerId || null,
          description: description || null,
          isActive,
        };
        await updateDepartment(editingDept.id, payload);
      } else {
        const payload: CreateDepartmentPayload = {
          departmentCode: departmentCode.trim().toUpperCase(),
          departmentName,
          parentDepartmentId: parentDepartmentId || null,
          managerId: managerId || null,
          description: description || null,
        };
        await createDepartment(payload);
      }
      setIsFormOpen(false);
      await loadData();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Thao tác lưu phòng ban thất bại."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (dept: Department) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn ngừng hoạt động phòng ban "${dept.departmentName}" (${dept.departmentCode})?`
      )
    ) {
      return;
    }

    try {
      await deleteDepartment(dept.id);
      await loadData();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Không thể xóa phòng ban. Vui lòng kiểm tra nhân sự trực thuộc."
      );
    }
  };

  const totalHeadcount = departments.reduce(
    (sum, d) => sum + d.employeeCount,
    0
  );
  const activeDeptsCount = departments.filter((d) => d.isActive).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-[28px] leading-[36px] font-bold text-[#111827]">
            Cơ cấu Phòng ban
          </h1>
          <p className="text-[14px] leading-[22px] text-[#6B7280] mt-1">
            Quản lý sơ đồ tổ chức, bổ nhiệm Trưởng bộ phận và theo dõi quân số từng đơn vị.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={loadData}
            className="h-10 px-4 rounded-[8px] text-[14px] font-medium border border-[#7C3AED] text-[#7C3AED] bg-transparent hover:bg-[#F5F3FF] transition-colors cursor-pointer"
          >
            Làm mới
          </button>
          {hasPermission("Department.Create") && (
            <button
              type="button"
              onClick={openCreateModal}
              className="h-10 px-4 rounded-[8px] text-[14px] font-medium bg-[#7C3AED] text-white hover:bg-[#5B21B6] transition-colors shadow-xs cursor-pointer"
            >
              + Thêm phòng ban
            </button>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 shadow-xs">
          <span className="text-[12px] leading-[18px] font-medium text-[#6B7280] uppercase tracking-wider">
            Tổng số đơn vị / Phòng ban
          </span>
          <p className="font-heading text-[24px] leading-[32px] font-semibold text-[#111827] mt-2">
            {departments.length}{" "}
            <span className="text-[14px] font-normal text-[#6B7280]">
              phòng ban
            </span>
          </p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 shadow-xs">
          <span className="text-[12px] leading-[18px] font-medium text-[#6B7280] uppercase tracking-wider">
            Đang hoạt động
          </span>
          <p className="font-heading text-[24px] leading-[32px] font-semibold text-[#059669] mt-2">
            {activeDeptsCount}{" "}
            <span className="text-[14px] font-normal text-[#6B7280]">
              đơn vị
            </span>
          </p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 shadow-xs">
          <span className="text-[12px] leading-[18px] font-medium text-[#6B7280] uppercase tracking-wider">
            Tổng quân số trực thuộc
          </span>
          <p className="font-heading text-[24px] leading-[32px] font-semibold text-[#0D9488] mt-2">
            {totalHeadcount}{" "}
            <span className="text-[14px] font-normal text-[#6B7280]">
              nhân sự đang làm việc
            </span>
          </p>
        </div>
      </div>

      {/* Search & Table Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-[12px] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo mã phòng ban (BOD, TECH, HR...) hoặc tên phòng ban..."
            className="h-10 w-full sm:max-w-md px-3 py-2 rounded-[8px] border border-[#E5E7EB] bg-white text-[14px] text-[#111827] hover:border-[#A78BFA] focus:outline-none focus:border-[#7C3AED] focus:ring-3 focus:ring-[#7C3AED]/25"
          />

          <label className="inline-flex items-center gap-2 text-[14px] text-[#4B5563] cursor-pointer">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="w-4 h-4 accent-[#7C3AED] rounded-[4px]"
            />
            Hiển thị cả phòng ban ngừng hoạt động
          </label>
        </div>

        {error && (
          <div className="m-6 p-4 rounded-[8px] bg-[#FEF2F2] border border-[#EF4444] text-[#EF4444] flex items-center justify-between gap-4">
            <p className="text-[14px]">{error}</p>
            <Link
              href="/login"
              className="h-8 px-3 inline-flex items-center rounded-[8px] bg-[#7C3AED] text-white text-[12px] font-medium shrink-0"
            >
              Đăng nhập
            </Link>
          </div>
        )}

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[900px] text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#FAFAFA] text-[12px] leading-[18px] font-semibold text-[#6B7280] uppercase tracking-wider">
                <th className="py-3 px-4">Đơn vị / Phòng ban</th>
                <th className="py-3 px-4">Đơn vị cấp trên</th>
                <th className="py-3 px-4">Trưởng bộ phận</th>
                <th className="py-3 px-4">Quân số</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-[14px]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#6B7280]">
                    Đang tải cơ cấu phòng ban...
                  </td>
                </tr>
              ) : departments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#6B7280]">
                    Không tìm thấy phòng ban phù hợp.
                  </td>
                </tr>
              ) : (
                departments.map((dept) => (
                  <tr
                    key={dept.id}
                    className="h-[60px] hover:bg-[#F5F3FF] transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[12px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] shrink-0">
                          {dept.departmentCode}
                        </span>
                        <div>
                          <p className="font-medium text-[#111827]">
                            {dept.departmentName}
                          </p>
                          {dept.description && (
                            <p className="text-[12px] text-[#6B7280] truncate max-w-xs">
                              {dept.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#4B5563]">
                      {dept.parentDepartmentName || "— Cấp cao nhất —"}
                    </td>
                    <td className="py-3 px-4">
                      {dept.managerName ? (
                        <span className="font-medium text-[#111827]">
                          {dept.managerName}
                        </span>
                      ) : (
                        <span className="text-[12px] text-[#9CA3AF]">
                          Chưa bổ nhiệm
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[#F0FDFA] text-[#0D9488] border border-[#CCFBF1]">
                        {dept.employeeCount} nhân sự
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {dept.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[#ECFDF5] text-[#059669]">
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[#FEF2F2] text-[#EF4444]">
                          Ngừng hoạt động
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(dept.id)}
                          disabled={isLoadingDetail}
                          className="h-7 px-2.5 rounded-[6px] text-[12px] font-medium text-[#4B5563] hover:bg-[#F3F4F6] cursor-pointer"
                        >
                          Chi tiết
                        </button>
                        {hasPermission("Department.Update") && (
                          <button
                            type="button"
                            onClick={() => openEditModal(dept)}
                            className="h-7 px-2.5 rounded-[6px] text-[12px] font-medium text-[#7C3AED] hover:bg-[#F5F3FF] cursor-pointer"
                          >
                            Sửa
                          </button>
                        )}
                        {hasPermission("Department.Delete") && (
                          <button
                            type="button"
                            onClick={() => handleDelete(dept)}
                            className="h-7 px-2.5 rounded-[6px] text-[12px] font-medium text-[#EF4444] hover:bg-[#FEF2F2] cursor-pointer"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm / Sửa Phòng ban */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-[12px] border border-[#E5E7EB] shadow-lg max-h-[90vh] flex flex-col overflow-hidden my-auto">
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FAFAFA] shrink-0">
              <h2 className="font-heading text-[18px] leading-[26px] font-semibold text-[#111827]">
                {editingDept
                  ? `Cập nhật Phòng ban (${editingDept.departmentCode})`
                  : "Thêm phòng ban mới"}
              </h2>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-[#6B7280] hover:text-[#111827] text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              id="departmentForm"
              onSubmit={handleFormSubmit}
              className="p-6 space-y-4 flex-1 overflow-y-auto"
            >
              {formError && (
                <div className="p-3 rounded-[8px] bg-[#FEF2F2] border border-[#EF4444] text-[#EF4444] text-[13px]">
                  {formError}
                </div>
              )}

              {!editingDept && (
                <div>
                  <label className="block text-[14px] font-medium text-[#111827] mb-1">
                    Mã phòng ban *
                  </label>
                  <input
                    type="text"
                    required
                    value={departmentCode}
                    onChange={(e) =>
                      setDepartmentCode(e.target.value.toUpperCase())
                    }
                    placeholder="VD: QA, MARKETING, FINANCE"
                    className="w-full h-10 px-3 py-2 rounded-[8px] border border-[#E5E7EB] font-mono text-[14px] focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>
              )}

              <div>
                <label className="block text-[14px] font-medium text-[#111827] mb-1">
                  Tên phòng ban *
                </label>
                <input
                  type="text"
                  required
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  placeholder="VD: Phòng Đảm Bảo Chất Lượng"
                  className="w-full h-10 px-3 py-2 rounded-[8px] border border-[#E5E7EB] text-[14px] focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[14px] font-medium text-[#111827] mb-1">
                    Phòng ban cấp trên
                  </label>
                  <select
                    value={parentDepartmentId}
                    onChange={(e) => setParentDepartmentId(e.target.value)}
                    className="w-full h-10 px-3 py-2 rounded-[8px] border border-[#E5E7EB] bg-white text-[14px] focus:outline-none focus:border-[#7C3AED]"
                  >
                    <option value="">— Không (Cấp cao nhất) —</option>
                    {departments
                      .filter((d) => !editingDept || d.id !== editingDept.id)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          [{d.departmentCode}] {d.departmentName}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[14px] font-medium text-[#111827] mb-1">
                    Trưởng bộ phận
                  </label>
                  <select
                    value={managerId}
                    onChange={(e) => setManagerId(e.target.value)}
                    className="w-full h-10 px-3 py-2 rounded-[8px] border border-[#E5E7EB] bg-white text-[14px] focus:outline-none focus:border-[#7C3AED]"
                  >
                    <option value="">— Chưa bổ nhiệm —</option>
                    {employees
                      .filter((emp) => emp.status !== "Terminated")
                      .map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.fullName} ({emp.employeeCode})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[14px] font-medium text-[#111827] mb-1">
                  Mô tả chức năng
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả phạm vi chuyên môn của phòng ban..."
                  className="w-full px-3 py-2 rounded-[8px] border border-[#E5E7EB] text-[14px] focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              {editingDept && (
                <label className="inline-flex items-center gap-2 text-[14px] text-[#111827] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 accent-[#7C3AED]"
                  />
                  Phòng ban đang hoạt động
                </label>
              )}
            </form>

            <div className="px-6 py-4 border-t border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="h-10 px-4 rounded-[8px] border border-[#E5E7EB] bg-white text-[14px] font-medium text-[#6B7280] hover:bg-[#F3F4F6] cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                form="departmentForm"
                disabled={isSubmitting}
                className="h-10 px-5 rounded-[8px] bg-[#7C3AED] text-white text-[14px] font-medium hover:bg-[#5B21B6] disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? "Đang lưu..." : "Lưu thông tin"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chi tiết Phòng ban */}
      {detailDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-[12px] border border-[#E5E7EB] shadow-lg max-h-[90vh] flex flex-col overflow-hidden my-auto">
            <div className="px-6 py-4 flex items-center justify-between border-b border-[#E5E7EB] bg-[#FAFAFA] shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[12px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#F5F3FF] text-[#7C3AED]">
                    {detailDept.departmentCode}
                  </span>
                  <h2 className="font-heading text-[18px] font-semibold text-[#111827]">
                    {detailDept.departmentName}
                  </h2>
                </div>
                <p className="text-[12px] text-[#6B7280] mt-1">
                  Trưởng phòng: {detailDept.managerName || "Chưa bổ nhiệm"} • Ngày tạo:{" "}
                  {formatDateVN(detailDept.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailDept(null)}
                className="text-[#6B7280] hover:text-[#111827] text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <h3 className="text-[14px] font-semibold text-[#111827] mb-3">
                Nhân sự trực thuộc ({detailDept.members.length})
              </h3>
              {detailDept.members.length === 0 ? (
                <p className="text-[13px] text-[#6B7280] py-4">
                  Chưa có nhân sự đang làm việc tại phòng ban này.
                </p>
              ) : (
                <div className="divide-y divide-[#E5E7EB] border border-[#E5E7EB] rounded-[8px]">
                  {detailDept.members.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 flex items-center justify-between text-[13px] hover:bg-[#F9FAFB]"
                    >
                      <div>
                        <p className="font-medium text-[#111827]">
                          {m.fullName}{" "}
                          <span className="font-mono text-[12px] text-[#7C3AED]">
                            ({m.employeeCode})
                          </span>
                        </p>
                        <p className="text-[12px] text-[#6B7280]">
                          {m.positionName} • {m.workEmail}
                        </p>
                      </div>
                      <Link
                        href={`/employees/${m.id}`}
                        className="text-[12px] font-medium text-[#7C3AED] hover:underline shrink-0"
                      >
                        Xem hồ sơ →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
