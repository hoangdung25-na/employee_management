"use client";

import React, { useEffect, useState } from "react";
import {
  CreateEmployeePayload,
  EmployeeDetail,
  ManagerOption,
  UpdateEmployeePayload,
} from "@/features/employees/types/employee";
import {
  createEmployee,
  getDepartmentManagers,
  getEmployeeById,
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
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState<boolean>(false);
  const [isLoadingPositions, setIsLoadingPositions] = useState<boolean>(false);
  const [isLoadingManagers, setIsLoadingManagers] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [employeeCodeDisplay, setEmployeeCodeDisplay] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [dateOfBirth, setDateOfBirth] = useState<string>("1998-05-15");
  const [gender, setGender] = useState<string>("Nam");
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

  const targetEmployeeId = initialDetail?.id ?? employeeId ?? undefined;
  const isExecutive = positions.find((p) => p.id === positionId)?.jobLevel === 1;
  const isDeptHead = departments.find((d) => d.id === departmentId)?.managerId === targetEmployeeId;

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setErrorMessage(null);
    setIsLoadingMeta(true);

    async function loadFormContext() {
      try {
        const deptList = await getDepartments({ includeInactive: false });

        if (!isMounted) return;
        setDepartments(deptList);

        if (mode === "edit" && (initialDetail || employeeId)) {
          const detail =
            initialDetail ?? (await getEmployeeById(employeeId as string));
          if (!isMounted) return;

          setEmployeeCodeDisplay(detail.employeeCode);
          setFullName(detail.fullName);
          setDateOfBirth(detail.dateOfBirth);
          setGender(
            detail.gender === "Male"
              ? "Nam"
              : detail.gender === "Female"
              ? "Nữ"
              : detail.gender === "Other"
              ? "Khác"
              : detail.gender || "Nam"
          );
          setCitizenId(detail.citizenId || "");
          setPhoneNumber(detail.phoneNumber || "");
          setWorkEmail(detail.workEmail);
          setPersonalEmail(detail.personalEmail || "");
          setAddress(detail.address || "");
          setDepartmentId(detail.departmentId);
          setPositionId(detail.positionId);
          setHireDate(detail.hireDate);
          setProbationEndDate(detail.probationEndDate || "");
          setStatus(detail.status);
          setBaseSalary(String(detail.baseSalary ?? 0));
          setTaxCode(detail.taxCode || "");
          setSocialInsuranceNumber(detail.socialInsuranceNumber || "");
          setBankAccountNumber(detail.bankAccountNumber || "");
          setBankName(detail.bankName || "");

          // Load positions and eligible managers for this specific department
          let posList: PositionItem[] = [];
          let mgrList: ManagerOption[] = [];
          if (detail.departmentId) {
            [posList, mgrList] = await Promise.all([
              getPositions(false, detail.departmentId),
              getDepartmentManagers(detail.departmentId, detail.id),
            ]);
          }

          if (!isMounted) return;
          setPositions(posList);
          setManagers(mgrList);

          const currentPos = posList.find((p) => p.id === detail.positionId);
          const isCurrentDeptHead =
            detail.departmentId &&
            deptList.find((d) => d.id === detail.departmentId)?.managerId === detail.id;

          if (currentPos && currentPos.jobLevel === 1) {
            setDirectManagerId("");
          } else if (isCurrentDeptHead) {
            // Trưởng phòng mặc định báo cáo trực tiếp cho Giám đốc cấp cao nhất (BOD)
            const bodManager = mgrList.find((m) => m.jobLevel === 1);
            setDirectManagerId(detail.directManagerId || (bodManager ? bodManager.id : ""));
          } else {
            setDirectManagerId(detail.directManagerId || "");
          }
        } else {
          // Reset for Create mode
          const defaultDept = deptList[0];
          const defaultDeptId = defaultDept ? defaultDept.id : "";

          let posList: PositionItem[] = [];
          let mgrList: ManagerOption[] = [];
          if (defaultDeptId) {
            [posList, mgrList] = await Promise.all([
              getPositions(false, defaultDeptId),
              getDepartmentManagers(defaultDeptId),
            ]);
          }

          if (!isMounted) return;
          setPositions(posList);
          setManagers(mgrList);

          setEmployeeCodeDisplay("Tự động cấp (EMP-xxxxx)");
          setFullName("");
          setDateOfBirth("1998-05-15");
          setGender("Nam");
          setCitizenId("");
          setPhoneNumber("");
          setWorkEmail("");
          setPersonalEmail("");
          setAddress("");
          setDepartmentId(defaultDeptId);

          const defaultPos = posList[0];
          const defaultPosId = defaultPos ? defaultPos.id : "";
          setPositionId(defaultPosId);

          if (defaultPos && defaultPos.jobLevel === 1) {
            setDirectManagerId("");
          } else {
            const head = mgrList.find((m) => m.isDepartmentHead);
            setDirectManagerId(head ? head.id : "");
          }

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

  const handleDepartmentChange = async (newDeptId: string) => {
    setDepartmentId(newDeptId);
    if (!newDeptId) {
      setPositions([]);
      setPositionId("");
      setManagers([]);
      setDirectManagerId("");
      return;
    }

    try {
      setIsLoadingPositions(true);
      setIsLoadingManagers(true);

      const [posList, mgrList] = await Promise.all([
        getPositions(false, newDeptId),
        getDepartmentManagers(newDeptId, targetEmployeeId),
      ]);

      setPositions(posList);
      setManagers(mgrList);

      // Check whether current selected position is mapped to this department
      const stillValidPos = posList.find((p) => p.id === positionId);
      const nextPos = stillValidPos || posList[0];
      const nextPosId = nextPos ? nextPos.id : "";
      setPositionId(nextPosId);

      // If next position is Executive (JobLevel == 1), auto-lock manager
      const isNowDeptHead = departments.find((d) => d.id === newDeptId)?.managerId === targetEmployeeId;
      if (nextPos && nextPos.jobLevel === 1) {
        setDirectManagerId("");
      } else if (isNowDeptHead) {
        // Trưởng phòng mặc định báo cáo trực tiếp cho Giám đốc cấp cao nhất (BOD)
        const bodManager = mgrList.find((m) => m.jobLevel === 1);
        setDirectManagerId(bodManager ? bodManager.id : "");
      } else {
        const stillValidMgr = mgrList.find((m) => m.id === directManagerId);
        if (stillValidMgr) {
          // Keep current manager
        } else {
          // Default to department head if present, else empty
          const deptHead = mgrList.find((m) => m.isDepartmentHead);
          setDirectManagerId(deptHead ? deptHead.id : "");
        }
      }
    } catch (err) {
      console.error("Lỗi cập nhật chức vụ & quản lý theo phòng ban:", err);
    } finally {
      setIsLoadingPositions(false);
      setIsLoadingManagers(false);
    }
  };

  const handlePositionChange = (newPosId: string) => {
    setPositionId(newPosId);
    const pos = positions.find((p) => p.id === newPosId);
    if (pos && pos.jobLevel === 1) {
      setDirectManagerId("");
    }
  };

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
          directManagerId: isExecutive ? null : directManagerId || null,
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
          throw new Error("Thiếu mã nhân viên cần cập nhật.");
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
          directManagerId: isExecutive ? null : directManagerId || null,
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
          : "Đã xảy ra lỗi khi lưu hồ sơ nhân sự."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white border border-[#E5E7EB] rounded-[12px] shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-heading text-[20px] leading-[28px] font-semibold text-[#111827]">
              {mode === "create"
                ? "Thêm nhân viên mới"
                : "Chỉnh sửa hồ sơ nhân sự"}
            </h2>
            <p className="text-[12px] leading-[18px] text-[#6B7280] mt-0.5">
              Mã nhân viên:{" "}
              <span className="font-mono font-medium text-[#7C3AED]">
                {employeeCodeDisplay || "EMP-xxxxx"}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-3 rounded-[6px] text-[13px] font-medium text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors cursor-pointer shrink-0"
          >
            Đóng ✕
          </button>
        </div>

        {/* Modal Body */}
        {isLoadingMeta ? (
          <div className="p-8 space-y-4 flex-1 overflow-y-auto">
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
            className="p-6 flex-1 overflow-y-auto space-y-6 text-[14px]"
          >
            {errorMessage && (
              <div className="p-3.5 rounded-[8px] bg-[#FEF2F2] border border-[#EF4444] text-[#EF4444] text-[13px]">
                <p className="font-semibold">Không thể lưu hồ sơ:</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            )}

            {/* Section 1: Thông tin cá nhân & Liên hệ */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-2">
                <span className="w-2 h-2 rounded-full bg-[#7C3AED]" />
                <h3 className="font-heading text-[15px] font-semibold text-[#111827]">
                  1. Thông tin cá nhân & Liên hệ
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
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
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
                  2. Phòng ban, Chức vụ & Công việc
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
                    onChange={(e) => handleDepartmentChange(e.target.value)}
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[12px] font-medium text-[#374151]">
                      Chức vụ <span className="text-[#EF4444]">*</span>
                    </label>
                    {isLoadingPositions && (
                      <span className="text-[11px] text-[#7C3AED] animate-pulse">
                        Đang lọc...
                      </span>
                    )}
                  </div>
                  <select
                    required
                    value={positionId}
                    onChange={(e) => handlePositionChange(e.target.value)}
                    disabled={!departmentId || isLoadingPositions}
                    className="w-full h-10 px-3 rounded-[8px] border border-[#E5E7EB] bg-white text-[#111827] hover:border-[#A78BFA] focus:outline-none focus:border-[#7C3AED] disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF] disabled:cursor-not-allowed"
                  >
                    <option value="">-- Chọn chức vụ --</option>
                    {positions.map((pos) => (
                      <option key={pos.id} value={pos.id}>
                        {pos.positionName} ({pos.positionCode})
                        {pos.jobLevel === 1 ? " [BOD / Lãnh đạo]" : pos.jobLevel === 2 ? " [Quản lý/Lead]" : ""}
                      </option>
                    ))}
                  </select>
                  {departmentId && positions.length === 0 && !isLoadingPositions && (
                    <p className="text-[11px] text-[#DC2626] mt-1">
                      Phòng ban này chưa có chức vụ phân bổ.
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[12px] font-medium text-[#374151]">
                      Quản lý trực tiếp
                    </label>
                    {isLoadingManagers && (
                      <span className="text-[11px] text-[#7C3AED] animate-pulse">
                        Đang lọc...
                      </span>
                    )}
                  </div>
                  <select
                    value={directManagerId}
                    onChange={(e) => setDirectManagerId(e.target.value)}
                    disabled={isExecutive || isLoadingManagers}
                    className="w-full h-10 px-3 rounded-[8px] border border-[#E5E7EB] bg-white text-[#111827] hover:border-[#A78BFA] focus:outline-none focus:border-[#7C3AED] disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF] disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {isExecutive
                        ? "-- Báo cáo Hội đồng Quản trị (Không có Quản lý trực tiếp) --"
                        : "-- Không có / Báo cáo Ban Giám đốc --"}
                    </option>
                    {!isExecutive &&
                      managers.map((mgr) => (
                        <option key={mgr.id} value={mgr.id}>
                          {mgr.fullName} ({mgr.employeeCode} - {mgr.positionName})
                          {mgr.isDepartmentHead ? " ⭐ Trưởng bộ phận" : mgr.jobLevel === 1 ? " [Ban Giám đốc]" : ""}
                        </option>
                      ))}
                  </select>
                  {isExecutive ? (
                    <p className="text-[11px] text-[#7C3AED] font-medium mt-1 flex items-center gap-1">
                      🔒 Cấp Lãnh đạo điều hành / BOD - Trực thuộc Hội đồng Quản trị.
                    </p>
                  ) : isDeptHead ? (
                    <p className="text-[11px] text-[#7C3AED] font-medium mt-1 flex items-center gap-1">
                      ⭐ Trưởng bộ phận - Mặc định báo cáo trực tiếp Giám đốc cấp cao nhất.
                    </p>
                  ) : departmentId && managers.length === 0 && !isLoadingManagers ? (
                    <p className="text-[11px] text-[#6B7280] mt-1">
                      Chưa có quản lý cấp cao trong phòng ban này (Mặc định báo cáo Ban Giám đốc).
                    </p>
                  ) : null}
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
                    <option value="Probation">Thử việc</option>
                    <option value="Active">Chính thức</option>
                    <option value="Suspended">Tạm đình chỉ</option>
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
                  3. Tiền lương, Bảo hiểm & Tài khoản Ngân hàng
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
        <div className="px-6 py-4 border-t border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-end gap-3 shrink-0">
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
              ? "Lưu nhân viên"
              : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}
