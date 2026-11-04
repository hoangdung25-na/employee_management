"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { EmployeeDetail } from "@/features/employees/types/employee";
import {
  getEmployeeById,
  terminateEmployee,
} from "@/features/employees/services/employeeService";
import { EmployeeFormModal } from "@/features/employees/components/EmployeeFormModal";
import { EmployeeDocumentsTab } from "@/features/employees/components/EmployeeDocumentsTab";
import { EmployeeContractsTab } from "@/features/employees/components/EmployeeContractsTab";
import { EmployeeDecisionsTab } from "@/features/employees/components/EmployeeDecisionsTab";
import { EmployeeProfileHeader } from "@/features/employees/components/EmployeeProfileHeader";
import { PersonalInfoCard } from "@/features/employees/components/PersonalInfoCard";
import { JobInfoCard } from "@/features/employees/components/JobInfoCard";
import { ContactEmergencyCard } from "@/features/employees/components/ContactEmergencyCard";
import { CareerTimelineCard } from "@/features/employees/components/CareerTimelineCard";
import { CompensationSummaryCard } from "@/features/employees/components/CompensationSummaryCard";
import { TabsNav, TabItem } from "@/components/ui/TabsNav";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/features/auth/context/AuthContext";

interface EmployeeDetailViewProps {
  id: string;
}

export function EmployeeDetailView({ id }: EmployeeDetailViewProps) {
  const { hasPermission, hasRole } = useAuth();
  const canManageDocs =
    hasPermission("Document.Manage") ||
    hasRole("SUPER_ADMIN") ||
    hasRole("HR_MANAGER") ||
    hasRole("HR_STAFF");

  const [activeTab, setActiveTab] = useState<string>("profile");
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  // Termination Modal State
  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState<boolean>(false);
  const [terminationDate, setTerminationDate] = useState<string>("");
  const [terminationReason, setTerminationReason] = useState<string>("");
  const [isTerminating, setIsTerminating] = useState<boolean>(false);
  const [terminateError, setTerminateError] = useState<string | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getEmployeeById(id);
      setEmployee(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tải hồ sơ chi tiết nhân sự."
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleEditSuccess = (updated: EmployeeDetail) => {
    setEmployee(updated);
    setIsEditModalOpen(false);
    setToastMessage("Cập nhật hồ sơ thành viên thành công!");
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleTerminateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminationReason.trim()) {
      setTerminateError("Vui lòng nhập lý do thôi việc chi tiết.");
      return;
    }

    setIsTerminating(true);
    setTerminateError(null);
    try {
      await terminateEmployee(id, {
        terminationDate,
        terminationReason: terminationReason.trim(),
      });
      setIsTerminateModalOpen(false);
      setToastMessage(
        "Đã hoàn thành thủ tục thôi việc và thu hồi quyền truy cập thành công!"
      );
      setTimeout(() => setToastMessage(null), 4000);
      fetchDetail();
    } catch (err) {
      setTerminateError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi thực hiện thủ tục thôi việc."
      );
    } finally {
      setIsTerminating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-72 bg-[#E5E7EB] rounded animate-pulse" />
        <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-[#EDE9FE] animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-56 bg-[#E5E7EB] rounded animate-pulse" />
              <div className="h-4 w-40 bg-[#F3F4F6] rounded animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#E5E7EB]">
            <div className="h-32 bg-[#F9FAFB] rounded-[12px] animate-pulse" />
            <div className="h-32 bg-[#F9FAFB] rounded-[12px] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-[24px] font-bold text-[#111827]">
            Hồ sơ Nhân sự
          </h1>
          <Link
            href="/employees"
            className="h-10 px-4 rounded-[8px] border border-[#7C3AED] text-[#7C3AED] text-[13px] font-medium hover:bg-[#F5F3FF] transition-colors inline-flex items-center gap-1.5"
          >
            ← Quay lại danh sách
          </Link>
        </div>

        <div className="bg-[#FEF2F2] border border-[#EF4444] rounded-[16px] p-6 text-[#EF4444]">
          <p className="font-semibold text-[15px]">Không thể mở hồ sơ nhân sự</p>
          <p className="text-[13px] mt-1">
            {error || "Hồ sơ không tồn tại hoặc đã bị xóa."}
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={fetchDetail}
              className="h-9 px-4 rounded-[8px] bg-[#EF4444] text-white text-[13px] font-medium hover:bg-[#DC2626] transition-colors cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  const [decisionsCount, setDecisionsCount] = useState<number | undefined>(undefined);

  const tabs: TabItem[] = [
    { id: "profile", label: "Thông tin chung", icon: "badge" },
    { id: "contracts", label: "Hợp đồng lao động", icon: "description" },
    { id: "decisions", label: "Quyết định nhân sự", icon: "military_tech", count: decisionsCount },
    { id: "documents", label: "Tài liệu đính kèm", icon: "school" },
  ];

  return (
    <div className="space-y-6">
      {/* Toast message */}
      {toastMessage && (
        <div className="p-4 rounded-[12px] bg-[#ECFDF5] border border-[#059669] text-[#065F46] flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
            <p className="text-[14px] font-medium">{toastMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-[13px] font-bold text-[#065F46] hover:opacity-75 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Breadcrumbs Context Navigation */}
      <nav className="flex items-center gap-1.5 text-[12px] leading-[18px] text-[#6B7280]">
        <Link
          href="/employees"
          className="hover:text-[#7C3AED] transition-colors flex items-center gap-1 font-medium"
        >
          <Icon name="groups" size={15} />
          <span>Hồ sơ nhân sự</span>
        </Link>
        <Icon name="chevron_right" size={14} className="text-[#D1D5DB]" />
        <Link href="/employees" className="hover:text-[#7C3AED] transition-colors">
          Danh sách nhân sự
        </Link>
        <Icon name="chevron_right" size={14} className="text-[#D1D5DB]" />
        <span className="font-semibold text-[#111827]">{employee.fullName}</span>
        <span className="bg-[#EDE9FE] font-mono text-[11px] px-2 py-0.5 rounded text-[#7C3AED] font-semibold">
          {employee.employeeCode}
        </span>
      </nav>

      {/* 2. Master Profile Header Card */}
      <EmployeeProfileHeader
        employee={employee}
        canEdit={canManageDocs}
        canTerminate={canManageDocs}
        onEdit={() => setIsEditModalOpen(true)}
        onTerminate={() => {
          setTerminationDate(new Date().toISOString().slice(0, 10));
          setTerminationReason("");
          setTerminateError(null);
          setIsTerminateModalOpen(true);
        }}
      />

      {/* 3. Horizontal Navigation Tabs Bar */}
      <TabsNav
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId)}
      />

      {/* 4. Tab Content: Profile (Asymmetric Bento Grid: 7 cols left, 5 cols right) */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <PersonalInfoCard employee={employee} />
            <JobInfoCard employee={employee} />
            <ContactEmergencyCard employee={employee} />
          </div>

          {/* Right Column (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <CareerTimelineCard />
            <CompensationSummaryCard employee={employee} />
          </div>
        </div>
      )}

      {/* 5. Tab Content: Contracts */}
      {activeTab === "contracts" && (
        <EmployeeContractsTab
          employeeId={employee.id}
          currentSalary={employee.baseSalary}
          canManage={canManageDocs}
          onSalaryUpdated={(newSalary) =>
            setEmployee((prev) => (prev ? { ...prev, baseSalary: newSalary } : null))
          }
        />
      )}

      {/* 6. Tab Content: Decisions */}
      {activeTab === "decisions" && (
        <EmployeeDecisionsTab
          employeeId={employee.id}
          canManage={canManageDocs}
          onProfileUpdated={fetchDetail}
          onCountChange={setDecisionsCount}
        />
      )}

      {/* 7. Tab Content: Documents */}
      {activeTab === "documents" && (
        <EmployeeDocumentsTab
          employeeId={employee.id}
          canManage={canManageDocs}
        />
      )}

      {/* Edit Employee Modal */}
      {isEditModalOpen && (
        <EmployeeFormModal
          isOpen={isEditModalOpen}
          mode="edit"
          employeeId={employee.id}
          initialDetail={employee}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Termination Modal */}
      {isTerminateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-[16px] max-w-lg w-full p-6 shadow-xl border border-[#E5E7EB] space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-3 border-b border-[#E5E7EB] pb-3">
              <div className="w-10 h-10 rounded-full bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center">
                <Icon name="person_off" size={20} />
              </div>
              <div>
                <h3 className="font-heading text-[18px] font-semibold text-[#111827]">
                  Thủ tục Thôi việc (Offboarding)
                </h3>
                <p className="text-[12px] text-[#6B7280]">
                  Thao tác sẽ chuyển trạng thái sang Terminated và khóa tài khoản ESS.
                </p>
              </div>
            </div>

            {terminateError && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-[8px] text-[13px] text-[#991B1B]">
                {terminateError}
              </div>
            )}

            <form onSubmit={handleTerminateSubmit} className="space-y-4">
              <div>
                <label className="text-[12px] font-medium text-[#4B5563] block mb-1">
                  Ngày thôi việc chính thức <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="date"
                  required
                  className="w-full h-10 px-3 border border-[#E5E7EB] rounded-[8px] text-[13px] font-mono focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                  value={terminationDate}
                  onChange={(e) => setTerminationDate(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#4B5563] block mb-1">
                  Lý do thôi việc chi tiết <span className="text-[#EF4444]">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ghi rõ lý do (hết hạn hợp đồng, đơn phương chấm dứt, kỷ luật...)"
                  className="w-full p-3 border border-[#E5E7EB] rounded-[8px] text-[13px] focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                  value={terminationReason}
                  onChange={(e) => setTerminationReason(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsTerminateModalOpen(false)}
                  className="h-10 px-4 rounded-[8px] border border-[#E5E7EB] text-[13px] font-medium text-[#4B5563] hover:bg-[#F3F4F6]"
                  disabled={isTerminating}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isTerminating}
                  className="h-10 px-4 rounded-[8px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[13px] font-medium shadow-xs disabled:opacity-50"
                >
                  {isTerminating ? "Đang xử lý..." : "Xác nhận Thôi việc"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
