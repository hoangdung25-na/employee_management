"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AssignedRole,
  OnboardingTask,
  ProcessType,
  TaskStatus,
} from "@/features/onboarding/types/onboarding";
import {
  getOnboardingTasks,
  updateOnboardingTaskStatus,
} from "@/features/onboarding/services/onboardingService";
import { formatDateVN } from "@/lib/utils/format";

const ROLE_BADGES: Record<
  AssignedRole,
  { label: string; bg: string; text: string; border: string }
> = {
  HR: {
    label: "Phòng Nhân sự (HR)",
    bg: "bg-[#F5F3FF]",
    text: "text-[#7C3AED]",
    border: "border-[#DDD6FE]",
  },
  IT: {
    label: "Bộ phận CNTT (IT)",
    bg: "bg-[#EFF6FF]",
    text: "text-[#2563EB]",
    border: "border-[#BFDBFE]",
  },
  MANAGER: {
    label: "Quản lý trực tiếp",
    bg: "bg-[#FFFBEB]",
    text: "text-[#D97706]",
    border: "border-[#FDE68A]",
  },
  EMPLOYEE: {
    label: "Nhân sự tự xử lý",
    bg: "bg-[#F0FDFA]",
    text: "text-[#0D9488]",
    border: "border-[#99F6E4]",
  },
};

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; bg: string; text: string; icon: string }
> = {
  Pending: {
    label: "Chờ xử lý",
    bg: "bg-[#F3F4F6]",
    text: "text-[#4B5563]",
    icon: "⏳",
  },
  InProgress: {
    label: "Đang tiến hành",
    bg: "bg-[#EFF6FF]",
    text: "text-[#2563EB]",
    icon: "⚙️",
  },
  Completed: {
    label: "Đã hoàn tất",
    bg: "bg-[#ECFDF5]",
    text: "text-[#059669]",
    icon: "✓",
  },
  Skipped: {
    label: "Bỏ qua",
    bg: "bg-[#FEF2F2]",
    text: "text-[#9CA3AF]",
    icon: "⊘",
  },
};

export default function OnboardingPage() {
  const [activeProcess, setActiveProcess] = useState<ProcessType>("Onboarding");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null
  );

  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getOnboardingTasks({
        processType: activeProcess,
        assignedRole: selectedRole !== "ALL" ? selectedRole : undefined,
        status: selectedStatus !== "ALL" ? selectedStatus : undefined,
        employeeId: selectedEmployeeId || undefined,
      });
      setTasks(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tải danh sách đầu việc tiếp nhận / thôi việc."
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeProcess, selectedRole, selectedStatus, selectedEmployeeId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Handle task status transition
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    setUpdatingTaskId(taskId);
    try {
      const updated = await updateOnboardingTaskStatus(taskId, {
        status: newStatus,
      });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      setToastMessage(
        `Đã cập nhật trạng thái đầu việc thành: ${STATUS_CONFIG[newStatus].label}`
      );
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi cập nhật trạng thái."
      );
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Group tasks by Employee to compute progress percentages
  const employeeProgress = useMemo(() => {
    const map = new Map<
      string,
      {
        employeeId: string;
        employeeName: string;
        employeeCode: string;
        total: number;
        completed: number;
      }
    >();

    tasks.forEach((t) => {
      const existing = map.get(t.employeeId) || {
        employeeId: t.employeeId,
        employeeName: t.employeeName,
        employeeCode: t.employeeCode,
        total: 0,
        completed: 0,
      };
      existing.total += 1;
      if (t.status === "Completed") {
        existing.completed += 1;
      }
      map.set(t.employeeId, existing);
    });

    return Array.from(map.values());
  }, [tasks]);

  // Overall Statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const inProgressTasks = tasks.filter((t) => t.status === "InProgress").length;
  const pendingTasks = tasks.filter((t) => t.status === "Pending").length;
  const overallPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">
              GIAI ĐOẠN 5 • VERTICAL SLICE
            </span>
          </div>
          <h1 className="font-heading text-[26px] font-bold text-[#111827] mt-1">
            Quy trình Tiếp nhận & Nghỉ việc (Onboarding / Offboarding)
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            Tự động kích hoạt checklist phân bổ đầu việc cho HR, IT, Quản lý và
            Nhân sự mới gia nhập hoặc thôi việc
          </p>
        </div>

        {/* Process Type Switcher */}
        <div className="flex items-center bg-[#F3F4F6] p-1 rounded-[10px] border border-[#E5E7EB] shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveProcess("Onboarding");
              setSelectedEmployeeId(null);
            }}
            className={`px-4 py-2 rounded-[8px] text-[13px] font-medium transition-all cursor-pointer flex items-center gap-2 ${
              activeProcess === "Onboarding"
                ? "bg-white text-[#7C3AED] shadow-xs font-semibold"
                : "text-[#6B7280] hover:text-[#111827]"
            }`}
          >
            <span>🚀</span> Tiếp nhận mới (Onboarding)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveProcess("Offboarding");
              setSelectedEmployeeId(null);
            }}
            className={`px-4 py-2 rounded-[8px] text-[13px] font-medium transition-all cursor-pointer flex items-center gap-2 ${
              activeProcess === "Offboarding"
                ? "bg-white text-[#DC2626] shadow-xs font-semibold"
                : "text-[#6B7280] hover:text-[#111827]"
            }`}
          >
            <span>🚪</span> Thủ tục nghỉ việc (Offboarding)
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-[8px] text-[13px] text-[#059669]">
          {toastMessage}
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 shadow-xs">
          <p className="text-[12px] text-[#6B7280] font-medium">Tổng đầu việc</p>
          <p className="text-[24px] font-bold text-[#111827] mt-1 font-mono">
            {totalTasks}
          </p>
          <p className="text-[11px] text-[#9CA3AF] mt-0.5">
            Toàn bộ quy trình {activeProcess}
          </p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 shadow-xs">
          <p className="text-[12px] text-[#6B7280] font-medium">Đã hoàn thành</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-[24px] font-bold text-[#059669] font-mono">
              {completedTasks}
            </span>
            <span className="text-[13px] font-semibold text-[#059669]">
              ({overallPercent}%)
            </span>
          </div>
          <div className="w-full bg-[#E5E7EB] h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-[#059669] h-full rounded-full transition-all duration-300"
              style={{ width: `${overallPercent}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 shadow-xs">
          <p className="text-[12px] text-[#6B7280] font-medium">Đang tiến hành</p>
          <p className="text-[24px] font-bold text-[#2563EB] mt-1 font-mono">
            {inProgressTasks}
          </p>
          <p className="text-[11px] text-[#9CA3AF] mt-0.5">Đã phân công xử lý</p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 shadow-xs">
          <p className="text-[12px] text-[#6B7280] font-medium">Chờ thực hiện</p>
          <p className="text-[24px] font-bold text-[#D97706] mt-1 font-mono">
            {pendingTasks}
          </p>
          <p className="text-[11px] text-[#9CA3AF] mt-0.5">Cần phân bổ hành động</p>
        </div>
      </div>

      {/* Progress Cards per Employee */}
      {employeeProgress.length > 0 && (
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-[15px] font-semibold text-[#111827]">
              Tiến độ theo Nhân sự ({employeeProgress.length})
            </h3>
            {selectedEmployeeId && (
              <button
                type="button"
                onClick={() => setSelectedEmployeeId(null)}
                className="text-[12px] text-[#7C3AED] font-medium hover:underline cursor-pointer"
              >
                ✕ Bỏ lọc nhân sự (Xem tất cả)
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {employeeProgress.map((ep) => {
              const isSelected = selectedEmployeeId === ep.employeeId;
              const pct =
                ep.total > 0 ? Math.round((ep.completed / ep.total) * 100) : 0;

              return (
                <div
                  key={ep.employeeId}
                  onClick={() =>
                    setSelectedEmployeeId(isSelected ? null : ep.employeeId)
                  }
                  className={`p-3.5 rounded-[10px] border transition-all cursor-pointer ${
                    isSelected
                      ? "border-[#7C3AED] bg-[#F5F3FF] shadow-xs"
                      : "border-[#E5E7EB] bg-[#FAFAFA] hover:border-[#D1D5DB] hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-[#111827]">
                        {ep.employeeName}
                      </p>
                      <span className="font-mono text-[11px] text-[#6B7280]">
                        {ep.employeeCode}
                      </span>
                    </div>
                    <span
                      className={`text-[13px] font-bold font-mono ${
                        pct === 100 ? "text-[#059669]" : "text-[#7C3AED]"
                      }`}
                    >
                      {pct}%
                    </span>
                  </div>

                  <div className="w-full bg-[#E5E7EB] h-2 rounded-full mt-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        pct === 100 ? "bg-[#059669]" : "bg-[#7C3AED]"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-[#6B7280] mt-1.5 flex items-center justify-between">
                    <span>
                      Đã hoàn thành: {ep.completed}/{ep.total} đầu việc
                    </span>
                    <Link
                      href={`/employees/${ep.employeeId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[#7C3AED] hover:underline"
                    >
                      Hồ sơ ↗
                    </Link>
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Tabs Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-4 rounded-[10px] border border-[#E5E7EB] shadow-xs">
        {/* Role Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[12px] text-[#6B7280] font-medium mr-1">
            Bộ phận:
          </span>
          {[
            { key: "ALL", label: "Tất cả" },
            { key: "HR", label: "Phòng Nhân sự" },
            { key: "IT", label: "Bộ phận IT" },
            { key: "MANAGER", label: "Quản lý" },
            { key: "EMPLOYEE", label: "Nhân viên" },
          ].map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setSelectedRole(r.key)}
              className={`h-8 px-3 rounded-[6px] text-[12px] font-medium transition-colors cursor-pointer ${
                selectedRole === r.key
                  ? "bg-[#7C3AED] text-white font-semibold"
                  : "bg-[#F3F4F6] text-[#4B5563] hover:bg-[#E5E7EB]"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[#6B7280] font-medium">
            Trạng thái:
          </span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-8 px-3 rounded-[6px] border border-[#E5E7EB] text-[12px] text-[#374151] bg-white focus:outline-none focus:border-[#7C3AED]"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="Pending">Chờ xử lý (Pending)</option>
            <option value="InProgress">Đang tiến hành (InProgress)</option>
            <option value="Completed">Đã hoàn tất (Completed)</option>
          </select>
        </div>
      </div>

      {/* Task Checklist Items */}
      {isLoading ? (
        <div className="py-12 text-center text-[#6B7280] text-[14px]">
          Đang tải dữ liệu quy trình...
        </div>
      ) : error ? (
        <div className="p-4 bg-[#FEF2F2] border border-[#FCA5A5] rounded-[8px] text-[#EF4444] text-[13px]">
          {error}
        </div>
      ) : tasks.length === 0 ? (
        <div className="py-12 text-center bg-white border border-[#E5E7EB] rounded-[12px] p-8">
          <p className="text-[#4B5563] font-medium">
            Không tìm thấy đầu việc nào phù hợp với bộ lọc
          </p>
          <p className="text-[#9CA3AF] text-[13px] mt-1">
            Các đầu việc sẽ tự động sinh khi tiếp nhận nhân viên mới hoặc thực
            hiện thủ tục thôi việc.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const roleBadge = ROLE_BADGES[task.assignedRole] || ROLE_BADGES.HR;
            const statusBadge =
              STATUS_CONFIG[task.status] || STATUS_CONFIG.Pending;
            const isCompleted = task.status === "Completed";
            const isUpdating = updatingTaskId === task.id;

            return (
              <div
                key={task.id}
                className={`bg-white border rounded-[10px] p-4 shadow-xs transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isCompleted
                    ? "border-[#E5E7EB] bg-[#FCFDFD]"
                    : "border-[#E5E7EB] hover:border-[#DDD6FE]"
                }`}
              >
                {/* Left: Task Info */}
                <div className="flex items-start gap-3.5">
                  {/* Status Toggle Checkbox */}
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() =>
                      handleStatusChange(
                        task.id,
                        isCompleted ? "Pending" : "Completed"
                      )
                    }
                    className={`w-6 h-6 rounded-[6px] border flex items-center justify-center shrink-0 mt-0.5 transition-colors cursor-pointer ${
                      isCompleted
                        ? "bg-[#059669] border-[#059669] text-white"
                        : "border-[#D1D5DB] hover:border-[#7C3AED] bg-white text-transparent"
                    }`}
                    title={
                      isCompleted ? "Đánh dấu chưa hoàn tất" : "Đánh dấu đã hoàn tất"
                    }
                  >
                    ✓
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={`font-heading text-[14px] font-semibold text-[#111827] ${
                          isCompleted ? "line-through text-[#9CA3AF]" : ""
                        }`}
                      >
                        {task.taskName}
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${roleBadge.bg} ${roleBadge.text} ${roleBadge.border}`}
                      >
                        {roleBadge.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[12px] text-[#6B7280] flex-wrap">
                      <span>
                        Nhân sự:{" "}
                        <Link
                          href={`/employees/${task.employeeId}`}
                          className="font-medium text-[#7C3AED] hover:underline"
                        >
                          {task.employeeName} ({task.employeeCode})
                        </Link>
                      </span>
                      <span>•</span>
                      <span>
                        Hạn hoàn thành:{" "}
                        <strong className="text-[#374151]">
                          {formatDateVN(task.dueDate)}
                        </strong>
                      </span>
                      {task.completedAt && (
                        <>
                          <span>•</span>
                          <span className="text-[#059669] font-medium">
                            Đã ký duyệt: {formatDateVN(task.completedAt)}
                          </span>
                        </>
                      )}
                    </div>

                    {task.notes && (
                      <p className="text-[12px] text-[#6B7280] italic bg-[#F9FAFB] p-2 rounded-[6px] mt-1 border border-[#F3F4F6]">
                        {task.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Status Switcher Dropdown */}
                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2.5 py-1 rounded-[6px] text-[12px] font-medium inline-flex items-center gap-1 ${statusBadge.bg} ${statusBadge.text}`}
                    >
                      <span>{statusBadge.icon}</span>
                      <span>{statusBadge.label}</span>
                    </span>
                  </div>

                  <select
                    disabled={isUpdating}
                    value={task.status}
                    onChange={(e) =>
                      handleStatusChange(task.id, e.target.value as TaskStatus)
                    }
                    className="h-8 px-2.5 rounded-[6px] border border-[#E5E7EB] text-[12px] text-[#374151] bg-white focus:outline-none focus:border-[#7C3AED] cursor-pointer"
                  >
                    <option value="Pending">Chờ xử lý</option>
                    <option value="InProgress">Đang tiến hành</option>
                    <option value="Completed">Đã hoàn tất</option>
                    <option value="Skipped">Bỏ qua</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
