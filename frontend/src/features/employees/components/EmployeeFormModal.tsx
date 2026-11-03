"use client";

import React, { useEffect, useState } from "react";
import {
  CreateEmployeePayload,
  EmployeeDetail,
  EmployeeSummary,
  UpdateEmployeePayload,
} from "@/features/employees/types/employee";
import {
  createEmployee,
  getEmployeeById,
  getEmployees,
  updateEmployee,
} from "@/features/employees/services/employeeService";
import {
  getDepartments,
  getPositions,
} from "@/features/departments/services/departmentService";
import {
  Department,
  PositionItem,
} from "@/features/departments/types/department";

interface EmployeeFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  employeeId?: string | null;
  initialDetail?: EmployeeDetail | null;
  onClose: () => void;
  onSuccess: (employee: EmployeeDetail) => void;
}

export function EmployeeFormModal({
  isOpen,
  mode,
  employeeId,
  initialDetail,
  onClose,
  onSuccess,
}: EmployeeFormModalProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [managers, setManagers] = useState<EmployeeSummary[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [employeeCodeDisplay, setEmployeeCodeDisplay] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [dateOfBirth, setDateOfBirth] = useState<string>("1998-05-15");
  const [gender, setGender] = useState<string>("Male");
  const [citizenId, setCitizenId] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [workEmail, setWorkEmail] = useState<string>("");
  const [personalEmail, setPersonalEmail] = useState<string>("");
  const [address, setAddress] = useState<string>("");

  const [departmentId, setDepartmentId] = useState<string>("");
  const [positionId, setPositionId] = useState<string>("");
  const [directManagerId, setDirectManagerId] = useState<string>("");
  const [hireDate, setHireDate] = useState<string>("");
  const [probationEndDate, setProbationEndDate] = useState<string>("");
  const [status, setStatus] = useState<string>("Probation");

  const [baseSalary, setBaseSalary] = useState<string>("18000000");
  const [taxCode, setTaxCode] = useState<string>("");
  const [socialInsuranceNumber, setSocialInsuranceNumber] =
    useState<string>("");
  const [bankAccountNumber, setBankAccountNumber] = useState<string>("");
  const [bankName, setBankName] = useState<string>("");

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setErrorMessage(null);
    setIsLoadingMeta(true);

    async function loadFormContext() {
      try {
        const [deptList, posList, empPaged] = await Promise.all([
          getDepartments({ includeInactive: false }),
          getPositions(false),
          getEmployees({ pageNumber: 1, pageSize: 100 }),
        ]);

        if (!isMounted) return;
        setDepartments(deptList);
        setPositions(posList);
        setManagers(empPaged.items ?? []);

        if (mode === "edit" && (initialDetail || employeeId)) {
          const detail =
            initialDetail ?? (await getEmployeeById(employeeId as string));
          if (!isMounted) return;

          setEmployeeCodeDisplay(detail.employeeCode);
          setFullName(detail.fullName);
          setDateOfBirth(detail.dateOfBirth);
          setGender(detail.gender);
          setCitizenId(detail.citizenId || "");
          setPhoneNumber(detail.phoneNumber || "");
          setWorkEmail(detail.workEmail);
          setPersonalEmail(detail.personalEmail || "");
          setAddress(detail.address || "");
          setDepartmentId(detail.departmentId);
          setPositionId(detail.positionId);
          setDirectManagerId(detail.directManagerId || "");
          setHireDate(detail.hireDate);
          setProbationEndDate(detail.probationEndDate || "");
          setStatus(detail.status);
          setBaseSalary(String(detail.baseSalary ?? 0));
          setTaxCode(detail.taxCode || "");
          setSocialInsuranceNumber(detail.socialInsuranceNumber || "");
          setBankAccountNumber(detail.bankAccountNumber || "");
          setBankName(detail.bankName || "");
        } else {
          // Reset for Create mode
          setEmployeeCodeDisplay("Tự động cấp (EMP-xxxxx)");
          setFullName("");
          setDateOfBirth("1998-05-15");
          setGender("Male");
          setCitizenId("");
          setPhoneNumber("");
          setWorkEmail("");
          setPersonalEmail("");
          setAddress("");
          setDepartmentId(deptList[0]?.id ?? "");
          setPositionId(posList[0]?.id ?? "");
          setDirectManagerId("");
          const today = new Date().toISOString().slice(0, 10);
          setHireDate(today);
          setProbationEndDate("");
          setStatus("Probation");
          setBaseSalary("18000000");
          setTaxCode("");
          setSocialInsuranceNumber("");
          setBankAccountNumber("");
          setBankName("Vietcombank");
        }
      } catch (err) {
        if (!isMounted) return;
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Không thể tải danh mục Phòng ban / Chức vụ."
        );
      } finally {
        if (isMounted) {
          setIsLoadingMeta(false);
        }
      }
    }

    loadFormContext();
    return () => {
      isMounted = false;
    };
  }, [isOpen, mode, employeeId, initialDetail]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const numericSalary = Number(baseSalary);
      if (Number.isNaN(numericSalary) || numericSalary <= 0) {
        throw new Error("Mức lương cơ bản phải lớn hơn 0 VNĐ.");
      }

      if (mode === "create") {
        const payload: CreateEmployeePayload = {
          fullName: fullName.trim(),
          dateOfBirth,
          gender,
          citizenId: citizenId.trim(),
          phoneNumber: phoneNumber.trim() || null,
          workEmail: workEmail.trim(),
          personalEmail: personalEmail.trim() || null,
          address: address.trim() || null,
          hireDate,
          departmentId,
          positionId,
          directManagerId: directManagerId || null,
          baseSalary: numericSalary,
          status,
          probationEndDate: probationEndDate || null,
          taxCode: taxCode.trim() || null,
          socialInsuranceNumber: socialInsuranceNumber.trim() || null,
          bankAccountNumber: bankAccountNumber.trim() || null,
          bankName: bankName.trim() || null,
        };
        const created = await createEmployee(payload);
        onSuccess(created);
      } else {
        const targetId = initialDetail?.id ?? employeeId;
        if (!targetId) {
          throw new Error("Thiếu định danh GUID của thành viên cần cập nhật.");
        }
        const payload: UpdateEmployeePayload = {
          fullName: fullName.trim(),
          dateOfBirth,
          gender,
          phoneNumber: phoneNumber.trim() || null,
          personalEmail: personalEmail.trim() || null,
          address: address.trim() || null,
          departmentId,
          positionId,
          directManagerId: directManagerId || null,
          baseSalary: numericSalary,
          avatarUrl: initialDetail?.avatarUrl ?? null,
          status,
          citizenId: citizenId.trim() || null,
          hireDate: hireDate || null,
          probationEndDate: probationEndDate || null,
          taxCode: taxCode.trim() || null,
          socialInsuranceNumber: socialInsuranceNumber.trim() || null,
          bankAccountNumber: bankAccountNumber.trim() || null,
          bankName: bankName.trim() || null,
        };
        const updated = await updateEmployee(targetId, payload);
        onSuccess(updated);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi lưu hồ sơ thành viên."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white border border-[#E5E7EB] rounded-[12px] shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-between">
          <div>
            <h2 className="font-heading text-[20px] leading-[28px] font-semibold text-[#111827]">
              {mode === "create"
                ? "Tiếp nhận Thành viên Đội ngũ mới"
                : "Chỉnh sửa Hồ sơ Thành viên"}
            </h2>
            <p className="text-[12px] leading-[18px] text-[#6B7280] mt-0.5">
              Mã nghiệp vụ:{" "}
              <span className="font-mono font-medium text-[#7C3AED]">
                {employeeCodeDisplay || "EMP-xxxxx"}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-3 rounded-[6px] text-[13px] font-medium text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors cursor-pointer"
          >
            Đóng ✕
          </button>
        </div>

        {/* Modal Body */}
        {isLoadingMeta ? (
          <div className="p-8 space-y-4">
            <div className="h-5 w-48 bg-[#E5E7EB] rounded animate-pulse" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-[#F3F4F6] rounded-[8px] animate-pulse" />
              <div className="h-10 bg-[#F3F4F6] rounded-[8px] animate-pulse" />
              <div className="h-10 bg-[#F3F4F6] rounded-[8px] animate-pulse" />
              <div className="h-10 bg-[#F3F4F6] rounded-[8px] animate-pulse" />
            </div>
          </div>
        ) : (
          <form
            id="employeeFormModal"
            onSubmit={handleSubmit}
            className="p-6 overflow-y-auto space-y-6 text-[14px]"
          >
            {errorMessage && (
              <div className="p-3.5 rounded-[8px] bg-[#FEF2F2] border border-[#EF4444] text-[#EF4444] text-[13px]">
                <p className="font-semibold">Không thể lưu hồ sơ:</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            )}

            {/* Section 1: Thông tin cá nhân & định danh */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-2">
                <span className="w-2 h-2 rounded-full bg-[#7C3AED]" />
                <h3 className="font-heading text-[15px] font-semibold text-[#111827]">
                  1. Định danh Cá nhân & Liên hệ
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-[#374151] mb-1">
                    Họ và tên <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="VD: Nguyễn Minh Khôi"
                    className="w-full h-10 px-3 rounded-[8px] border border-[#E5E7EB] text-[#111827] hover:border-[#A78BFA] focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#374151] mb-1">
                    Số CCCD (12 chữ số) <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    value={citizenId}
                    onChange={(e) => setCitizenId(e.target.value)}
                    placeholder="VD: 079098001234"
                    className="w-full h-10 px-3 rounded-[8px] border border-[#E5E7EB] font-mono text-[#111827] hover:border-[#A78BFA] focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#374151] mb-1">
                    Ngày sinh (Đủ 18 tuổi trở lên){" "}
                    <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full h-10 px-3 rounded-[8px] border border-[#E5E7EB] text-[#111827] hover:border-[#A78BFA] focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#374151] mb-1">
                    Giới tính <span className="text-[#EF4444]">*</span>
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full h-10 px-3 rounded-[8px] border border-[#E5E7EB] bg-white text-[#111827] hover:border-[#A78BFA] focus:outline-none focus:border-[#7C3AED]"
                  >
                    <option value="Male">Nam (Male)</option>
                    <option value="Female">Nữ (Female)</option>
                    <option value="Other">Khác (Other)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#374151] mb-1">
                    Email công việc <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    disabled={mode === "edit"}
                    value={workEmail}
                    onChange={(e) => setWorkEmail(e.target.value)}
                    placeholder="khoi.nguyen@company.com.vn"
                    className={`w-full h-10 px-3 rounded-[8px] border border-[#E5E7EB] text-[#111827] ${
                      mode === "edit"
                        ? "bg-[#F3F4F6] text-[#6B7280] cursor-not-allowed"
                        : "hover:border-[#A78BFA] focus:outline-none focus:border-[#7C3AED]"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#374151] mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0909123456"
                    className="w-full h-10 px-3 rounded-[8px] border border-[#E5E7EB] font-mono text-[#111827] hover:border-[#A78BFA] focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#374151] mb-1">
                    Email cá nhân
                  </label>
                  <input
                    type="email"
                    value={personalEmail}
                    onChange={(e) => setPersonalEmail(e.target.value)}
                    placeholder="personal@gmail.com"
                    className="w-full h-10 px-3 rounded-[8px] border border-[#E5E7EB] text-[#111827] hover:border-[#A78BFA] focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#374151] mb-1">
                    Địa chỉ thường trú / Liên hệ
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Số nhà, Đường, Quận/Huyện, Tỉnh/TP"
                    className="w-full h-10 px-3 rounded-[8px] border border-[#E5E7EB] text-[#111827] hover:border-[#A78BFA] focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Tổ chức & Công việc */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-2">
                <span className="w-2 h-2 rounded-full bg-[#0D9488]" />
                <h3 className="font-heading text-[15px] font-semibold text-[#111827]">
                  2. Phòng ban, Chức vụ & Lộ trình Công việc
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-[#374151] mb-1">
                    Phòng ban <span className="text-[#EF4444]">*</span>
                  </label>
                  <select
                    required
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full h-10 px-3 rounded-[8px] border border-[#E5E7EB] bg-white text-[#111827] hover:border-[#A78BFA] focus:outline-none focus:border-[#7C3AED]"
                  >
                    <option value="">-- Chọn phòng ban --</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.departmentName} ({dept.departmentCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#374151] mb-1">
                    Chức vụ <span className="text-[#EF4444]">*</span>
                  </label>
                  <select
                    required
                    value={positionId}
                    onChange={(e) => setPositionId(e.target.value)}
                    className="w-full h-10 px-3 rounded-[8px] border border-[#E5E7EB] bg-white text-[#111827] hover:border-[#A78BFA] focus:outline-none focus:border-[#7C3AED]"
                  >
                    <option value="">-- Chọn chức vụ --</option>
                    {positions.map((pos) => (
                      <option key={pos.id} value={pos.id}>
                        {pos.positionName} ({pos.positionCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#374151] mb-1">
                    Quản lý trực tiếp (Direct Manager)
                  </label>
                  <select
                    value={directManagerId}
                    onChange={(e) => setDirectManagerId(e.target.value)}
                    className="w-full h-10 px-3 rounded-[8px] border border-[#E5E7EB] bg-white text-[#111827] hover:border-[#A78BFA] focus:outline-none focus:border-[#7C3AED]"
                  >
                    <option value="">-- Không có / Báo cáo Ban Giám đốc --</option>
                    {managers
                      .filter(
                        (m) =>
                          m.id !== (initialDetail?.id ?? employeeId) &&
                          m.status !== "Terminated"
                      )
                      .map((mgr) => (
                        <option key={mgr.id} value={mgr.id}>
                          {mgr.fullName} ({mgr.employeeCode} - {mgr.positionName})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#374151] mb-1">
                    Trạng thái làm việc <span className="text-[#EF4444]">*</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full h-10 px-3 rounded-[8px] border border-[#E5E7EB] bg-white text-[#111827] hover:border-[#A78BFA] focus:outline-none focus:border-[#7C3AED]"
                  >
                    <option value="Probation">Thử việc (Probation)</option>
                    <option value="Active">Chính thức (Active)</option>
                    <option value="Suspended">Tạm đình chỉ (Suspended)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#374151] mb-1">
                    Ngày gia nhập <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={hireDate}
                    onChange={(e) => setHireDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-[8px] border border-[#E5E7EB] text-[#111827] hover:border-[#A78BFA] focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#374151] mb-1">
                    Ngày kết thúc thử việc
                  </label>
                  <input
                    type="date"
                    value={probationEndDate}
                    onChange={(e) => setProbationEndDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-[8px] border border-[#E5E7EB] text-[#111827] hover:border-[#A78BFA] focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Đãi ngộ, Thuế & Ngân hàng */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-2">
                <span className="w-2 h-2 rounded-full bg-[#059669]" />
                <h3 className="font-heading text-[15px] font-semibold text-[#111827]">
                  3. Đãi ngộ, Bảo hiểm & Tài khoản Ngân hàng
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-[#374151] mb-1">
                    Lương cơ bản (VNĐ/tháng){" "}
                    <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="number"
                    min={1000000}
                    step={500000}
                    required
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(e.target.value)}
                    className="w-full h-10 px-3 rounded-[8px] border border-[#E5E7EB] font-mono text-[#0D9488] font-medium hover:border-[#A78BFA] focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#374151] mb-1">
                    Mã số thuế TNCN
                  </label>
                  <input
                    type="text"
                    value={taxCode}
                    onChange={(e) => setTaxCode(e.target.value)}
                    placeholder="8001234567"
                    className="w-full h-10 px-3 rounded-[8px] border border-[#E5E7EB] font-mono text-[#111827] hover:border-[#A78BFA] focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#374151] mb-1">
                    Mã số BHXH
                  </label>
                  <input
                    type="text"
                    value={socialInsuranceNumber}
                    onChange={(e) => setSocialInsuranceNumber(e.target.value)}
                    placeholder="7912345678"
                    className="w-full h-10 px-3 rounded-[8px] border border-[#E5E7EB] font-mono text-[#111827] hover:border-[#A78BFA] focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-medium text-[#374151] mb-1">
                    Số tài khoản ngân hàng nhận lương
                  </label>
                  <input
                    type="text"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="1023456789"
                    className="w-full h-10 px-3 rounded-[8px] border border-[#E5E7EB] font-mono text-[#111827] hover:border-[#A78BFA] focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#374151] mb-1">
                    Tên Ngân hàng
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Vietcombank / Techcombank"
                    className="w-full h-10 px-3 rounded-[8px] border border-[#E5E7EB] text-[#111827] hover:border-[#A78BFA] focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-[8px] border border-[#7C3AED] text-[#7C3AED] text-[14px] font-medium hover:bg-[#F5F3FF] transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            form="employeeFormModal"
            disabled={isSubmitting || isLoadingMeta}
            className="h-10 px-5 rounded-[8px] bg-[#7C3AED] text-white text-[14px] font-medium hover:bg-[#5B21B6] disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isSubmitting
              ? "Đang lưu hồ sơ..."
              : mode === "create"
              ? "Tiếp nhận Thành viên"
              : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}

