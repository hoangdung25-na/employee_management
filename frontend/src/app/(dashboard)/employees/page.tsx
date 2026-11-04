"use client";

import React, { useEffect, useState } from "react";
import { useEmployees } from "@/features/employees/hooks/useEmployees";
import { EmployeeTable } from "@/features/employees/components/EmployeeTable";
import { EmployeeFormModal } from "@/features/employees/components/EmployeeFormModal";
import { Pagination } from "@/components/shared/Pagination";
import { MetricCard } from "@/components/ui/MetricCard";
import { Icon } from "@/components/ui/Icon";
import {
  EmployeeDetail,
  EmployeeStatus,
  EmployeeSummary,
} from "@/features/employees/types/employee";
import { getDepartments } from "@/features/departments/services/departmentService";
import { Department } from "@/features/departments/types/department";

const STATUS_FILTERS: Array<{ label: string; value: EmployeeStatus | "" }> = [
  { label: "Tất cả thành viên", value: "" },
  { label: "Chính thức (Active)", value: "Active" },
  { label: "Thử việc (Probation)", value: "Probation" },
  { label: "Tạm đình chỉ", value: "Suspended" },
  { label: "Đã thôi việc", value: "Terminated" },
];

export default function EmployeesPage() {
  const {
    data,
    employees,
    isLoading,
    error,
    filters,
    updateFilters,
    resetFilters,
    refresh,
  } = useEmployees();

  const [searchInput, setSearchInput] = useState(filters.keyword ?? "");
  const [departments, setDepartments] = useState<Department[]>([]);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    getDepartments({ includeInactive: false })
      .then((depts) => setDepartments(depts))
      .catch(() => {
        // Silent catch for filter dropdown
      });
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ keyword: searchInput });
  };

  const handleOpenCreate = () => {
    setFormMode("create");
    setSelectedEmployeeId(null);
    setIsFormOpen(true);
  };

  const handleEditEmployee = (emp: EmployeeSummary) => {
    setFormMode("edit");
    setSelectedEmployeeId(emp.id);
    setIsFormOpen(true);
  };

  const handleFormSuccess = (emp: EmployeeDetail) => {
    setIsFormOpen(false);
    refresh();
    const actionText =
      formMode === "create"
        ? `Đã tiếp nhận thành công nhân sự mới: ${emp.fullName} (${emp.employeeCode})`
        : `Đã cập nhật hồ sơ nhân sự: ${emp.fullName} (${emp.employeeCode})`;
    setToastMessage(actionText);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const activeCount = employees.filter((e) => e.status === "Active").length;
  const probationCount = employees.filter(
    (e) => e.status === "Probation"
  ).length;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 rounded-[12px] bg-[#ECFDF5] border border-[#059669] text-[#065F46] flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
            <p className="text-[14px] font-medium">{toastMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-[12px] font-bold text-[#065F46] hover:opacity-75 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-[28px] lg:text-[32px] leading-[40px] font-bold text-[#111827] tracking-tight">
            Thành viên Đội ngũ
          </h1>
          <p className="text-[14px] leading-[22px] text-[#6B7280] mt-0.5">
            Quản lý tập trung hồ sơ nhân sự, chức danh và thông tin hợp đồng toàn doanh nghiệp.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={refresh}
            className="h-10 px-4 rounded-[8px] text-[13px] font-medium border border-[#E5E7EB] text-[#4B5563] bg-white hover:bg-[#F9FAFB] transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <Icon name="history_edu" size={15} />
            <span>Làm mới</span>
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="h-10 px-4 rounded-[8px] text-[13px] font-medium bg-[#7C3AED] text-white hover:bg-[#5B21B6] transition-colors shadow-xs cursor-pointer inline-flex items-center gap-2"
          >
            <Icon name="add" size={16} />
            <span>Tiếp nhận thành viên</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <MetricCard
          title="Tổng quy mô nhân sự"
          value={data?.totalCount ?? 0}
          icon="groups"
          subtitle="Hồ sơ nhân sự toàn hệ thống"
        />

        <MetricCard
          title="Đang làm việc chính thức"
          value={activeCount}
          icon="verified"
          iconBgClass="bg-[#ECFDF5]"
          iconColorClass="text-[#059669]"
          subtitle="Thành viên chính thức"
        />

        <MetricCard
          title="Đang thử việc & Đào tạo"
          value={probationCount}
          icon="military_tech"
          iconBgClass="bg-[#F0FDFA]"
          iconColorClass="text-[#0D9488]"
          subtitle="Nhân sự giai đoạn Probation"
        />
      </div>

      {/* Filter & Search Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-[16px] shadow-xs overflow-hidden">
        <div className="p-6 border-b border-[#E5E7EB] space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Form */}
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center gap-2 flex-1 max-w-xl"
            >
              <div className="relative flex-1">
                <div className="absolute left-3 top-2.5 text-[#9CA3AF]">
                  <Icon name="search" size={18} />
                </div>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Tìm theo Họ tên, Mã EMP-xxxxx, Email hoặc SĐT..."
                  className="w-full h-10 pl-9 pr-4 rounded-[8px] border border-[#E5E7EB] bg-white text-[13px] text-[#111827] placeholder:text-[#9CA3AF] hover:border-[#A78BFA] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all"
                />
              </div>

              <button
                type="submit"
                className="h-10 px-4 rounded-[8px] text-[13px] font-medium border border-[#7C3AED] text-[#7C3AED] bg-[#F5F3FF] hover:bg-[#EDE9FE] transition-colors cursor-pointer"
              >
                Tìm kiếm
              </button>
              {(filters.keyword || filters.status || filters.departmentId) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    resetFilters();
                  }}
                  className="h-10 px-3 rounded-[8px] text-[13px] font-medium text-[#6B7280] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                >
                  Xóa lọc
                </button>
              )}
            </form>

            {/* Department Filter & Sort Selector */}
            <div className="flex flex-wrap items-center gap-3">
              {departments.length > 0 && (
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="departmentFilter"
                    className="text-[12px] leading-[18px] font-medium text-[#6B7280]"
                  >
                    Phòng ban:
                  </label>
                  <select
                    id="departmentFilter"
                    value={filters.departmentId ?? ""}
                    onChange={(e) =>
                      updateFilters({ departmentId: e.target.value || undefined })
                    }
                    className="h-10 px-3 rounded-[8px] border border-[#E5E7EB] bg-white text-[13px] text-[#111827] hover:border-[#A78BFA] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                  >
                    <option value="">Tất cả phòng ban</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.departmentName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2">
                <label
                  htmlFor="sortBySelect"
                  className="text-[12px] leading-[18px] font-medium text-[#6B7280]"
                >
                  Sắp xếp:
                </label>
                <select
                  id="sortBySelect"
                  value={`${filters.sortBy ?? "EmployeeCode"}-${
                    filters.sortOrder ?? "asc"
                  }`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split("-") as [
                      "FullName" | "BaseSalary" | "EmployeeCode" | "HireDate",
                      "asc" | "desc",
                    ];
                    updateFilters({ sortBy, sortOrder });
                  }}
                  className="h-10 px-3 rounded-[8px] border border-[#E5E7EB] bg-white text-[13px] text-[#111827] hover:border-[#A78BFA] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                >
                  <option value="EmployeeCode-asc">Mã NV (Tăng dần)</option>
                  <option value="EmployeeCode-desc">Mã NV (Giảm dần)</option>
                  <option value="FullName-asc">Họ và tên (A → Z)</option>
                  <option value="HireDate-desc">Mới gia nhập gần nhất</option>
                  <option value="BaseSalary-desc">Mức lương (Cao → Thấp)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center flex-wrap gap-2 pt-1">
            {STATUS_FILTERS.map((chip) => {
              const active = (filters.status ?? "") === chip.value;
              return (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => updateFilters({ status: chip.value })}
                  className={`px-3 py-1 rounded-full text-[12px] leading-[18px] font-medium transition-colors cursor-pointer ${
                    active
                      ? "bg-[#EDE9FE] text-[#7C3AED] border border-[#7C3AED]"
                      : "bg-[#F9FAFB] text-[#6B7280] border border-[#E5E7EB] hover:border-[#A78BFA] hover:text-[#7C3AED]"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="m-6 p-4 rounded-[12px] bg-[#FEF2F2] border border-[#EF4444] text-[#EF4444] flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-[14px]">
                Không thể kết nối dữ liệu từ máy chủ (.NET 8 Web API)
              </p>
              <p className="text-[12px] leading-[18px] mt-0.5">{error}</p>
            </div>
            <button
              type="button"
              onClick={refresh}
              className="h-8 px-3 rounded-[8px] bg-[#EF4444] text-white text-[12px] font-medium hover:bg-[#DC2626] transition-colors shrink-0 cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Employee Table */}
        <EmployeeTable
          employees={employees}
          isLoading={isLoading}
          onEditEmployee={handleEditEmployee}
        />

        {/* Pagination */}
        {!isLoading && data && (
          <Pagination
            pageNumber={data.pageNumber}
            pageSize={data.pageSize}
            totalCount={data.totalCount}
            totalPages={data.totalPages}
            onPageChange={(page) => updateFilters({ pageNumber: page })}
          />
        )}
      </div>

      {/* Employee Create / Edit Modal */}
      <EmployeeFormModal
        isOpen={isFormOpen}
        mode={formMode}
        employeeId={selectedEmployeeId}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
