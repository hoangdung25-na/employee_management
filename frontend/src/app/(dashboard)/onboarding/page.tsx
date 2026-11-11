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
  createOnboardingTask,
  deleteOnboardingTask,
  getOnboardingTasks,
  updateOnboardingTask,
  updateOnboardingTaskStatus,
} from "@/features/onboarding/services/onboardingService";
import { getEmployees } from "@/features/employees/services/employeeService";
import { EmployeeSummary } from "@/features/employees/types/employee";
import { formatDateVN } from "@/lib/utils/format";
import { Icon } from "@/components/ui/Icon";

const ROLE_BADGES: Record<
  AssignedRole,
  { label: string; bg: string; text: string; border: string }
> = {
  HR: {
    label: "Phòng Nhân sự",
    bg: "bg-[#F5F3FF]",
    text: "text-[#7C3AED]",
    border: "border-[#DDD6FE]",
  },
  IT: {
    label: "Bộ phận CNTT",
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
    label: "Nhân viên",
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

type ProgressFilterTab = "ACTIVE" | "COMPLETED" | "ALL";

interface EmployeeGroup {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  tasks: OnboardingTask[];
  total: number;
  completed: number;
  percent: number;
  isFullyCompleted: boolean;
}

const PAGE_SIZE = 8;

export default function OnboardingPage() {
  const [activeProcess, setActiveProcess] = useState<ProcessType>("Onboarding");
  const [progressTab, setProgressTab] = useState<ProgressFilterTab>("ACTIVE");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [hideCompletedTasks, setHideCompletedTasks] = useState<boolean>(true);

  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [employeesList, setEmployeesList] = useState<EmployeeSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  // Accordion expanded state: store expanded employeeIds
  const [expandedEmployeeIds, setExpandedEmployeeIds] = useState<
    Record<string, boolean>
  >({});
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modal states: View Detail, Create/Edit Form, Delete Confirm
  const [viewingTask, setViewingTask] = useState<OnboardingTask | null>(null);
  const [editingTask, setEditingTask] = useState<OnboardingTask | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [deletingTask, setDeletingTask] = useState<OnboardingTask | null>(null);

  // Form fields for Create / Edit
  const [formEmployeeId, setFormEmployeeId] = useState<string>("");
  const [formProcessType, setFormProcessType] =
    useState<ProcessType>("Onboarding");
  const [formTaskName, setFormTaskName] = useState<string>("");
  const [formAssignedRole, setFormAssignedRole] = useState<AssignedRole>("HR");
  const [formDueDate, setFormDueDate] = useState<string>("");
  const [formStatus, setFormStatus] = useState<TaskStatus>("Pending");
  const [formNotes, setFormNotes] = useState<string>("");
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getOnboardingTasks({
        processType: activeProcess,
      });
      setTasks(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tải danh sách đầu việc tiếp nhận / nghỉ việc."
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeProcess]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    getEmployees({ pageNumber: 1, pageSize: 100 })
      .then((res) => setEmployeesList(res.items || []))
      .catch(() => { });
  }, []);

  // Group all tasks by employee
  const allEmployeeGroups = useMemo<EmployeeGroup[]>(() => {
    const map = new Map<string, EmployeeGroup>();

    tasks.forEach((t) => {
      const existing = map.get(t.employeeId) || {
        employeeId: t.employeeId,
        employeeName: t.employeeName,
        employeeCode: t.employeeCode,
        tasks: [],
        total: 0,
        completed: 0,
        percent: 0,
        isFullyCompleted: false,
      };
      existing.tasks.push(t);
      existing.total += 1;
      if (t.status === "Completed" || t.status === "Skipped") {
        existing.completed += 1;
      }
      map.set(t.employeeId, existing);
    });

    const groups = Array.from(map.values()).map((g) => {
      const pct = g.total > 0 ? Math.round((g.completed / g.total) * 100) : 0;
      return {
        ...g,
        percent: pct,
        isFullyCompleted: g.total > 0 && g.completed === g.total,
      };
    });

    return groups;
  }, [tasks]);

  // Auto-expand the first incomplete employee group on initial load if nothing is expanded yet
  useEffect(() => {
    if (allEmployeeGroups.length > 0 && Object.keys(expandedEmployeeIds).length === 0) {
      const firstActive =
        allEmployeeGroups.find((g) => !g.isFullyCompleted) ||
        allEmployeeGroups[0];
      if (firstActive) {
        setExpandedEmployeeIds({ [firstActive.employeeId]: true });
      }
    }
  }, [allEmployeeGroups, expandedEmployeeIds]);

  const activeGroupsCount = useMemo(
    () => allEmployeeGroups.filter((g) => !g.isFullyCompleted).length,
    [allEmployeeGroups]
  );
  const completedGroupsCount = useMemo(
    () => allEmployeeGroups.filter((g) => g.isFullyCompleted).length,
    [allEmployeeGroups]
  );

  // Filter employee groups by tab, search query, and role
  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return allEmployeeGroups
      .filter((group) => {
        if (progressTab === "ACTIVE" && group.isFullyCompleted) return false;
        if (progressTab === "COMPLETED" && !group.isFullyCompleted) return false;

        if (selectedRole !== "ALL") {
          const hasRoleTask = group.tasks.some(
            (t) => t.assignedRole === selectedRole
          );
          if (!hasRoleTask) return false;
        }

        if (q) {
          const matchEmp =
            group.employeeName.toLowerCase().includes(q) ||
            group.employeeCode.toLowerCase().includes(q);
          const matchTask = group.tasks.some(
            (t) =>
              t.taskName.toLowerCase().includes(q) ||
              (t.notes && t.notes.toLowerCase().includes(q))
          );
          if (!matchEmp && !matchTask) return false;
        }

        return true;
      });
  }, [allEmployeeGroups, progressTab, selectedRole, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedGroups = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredGroups.slice(start, start + PAGE_SIZE);
  }, [filteredGroups, safePage]);

  const toggleExpandEmployee = (empId: string) => {
    setExpandedEmployeeIds((prev) => ({
      ...prev,
      [empId]: !prev[empId],
    }));
  };

  const expandAllVisible = () => {
    const next: Record<string, boolean> = { ...expandedEmployeeIds };
    paginatedGroups.forEach((g) => {
      next[g.employeeId] = true;
    });
    setExpandedEmployeeIds(next);
  };

  const collapseAllVisible = () => {
    const next: Record<string, boolean> = { ...expandedEmployeeIds };
    paginatedGroups.forEach((g) => {
      next[g.employeeId] = false;
    });
    setExpandedEmployeeIds(next);
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    setUpdatingTaskId(taskId);
    try {
      const updated = await updateOnboardingTaskStatus(taskId, {
        status: newStatus,
      });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      if (viewingTask?.id === taskId) {
        setViewingTask(updated);
      }
      showToast(
        `Đã cập nhật trạng thái công việc thành: ${STATUS_CONFIG[newStatus].label}`
      );
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

  // Open Create Modal
  const openCreateModal = (preselectedEmployeeId?: string) => {
    setEditingTask(null);
    setFormError(null);
    const defaultEmpId =
      preselectedEmployeeId ||
      allEmployeeGroups[0]?.employeeId ||
      employeesList[0]?.id ||
      "";
    setFormEmployeeId(defaultEmpId);
    setFormProcessType(activeProcess);
    setFormTaskName("");
    setFormAssignedRole("HR");
    const defaultDue = new Date();
    defaultDue.setDate(defaultDue.getDate() + 3);
    setFormDueDate(defaultDue.toISOString().slice(0, 10));
    setFormStatus("Pending");
    setFormNotes("");
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (task: OnboardingTask) => {
    setEditingTask(task);
    setFormError(null);
    setFormEmployeeId(task.employeeId);
    setFormProcessType(task.processType);
    setFormTaskName(task.taskName);
    setFormAssignedRole(task.assignedRole);
    setFormDueDate(task.dueDate.slice(0, 10));
    setFormStatus(task.status);
    setFormNotes(task.notes || "");
    setIsFormModalOpen(true);
  };

  // Handle Create / Update Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTaskName.trim()) {
      setFormError("Vui lòng nhập tên đầu việc.");
      return;
    }
    if (!editingTask && !formEmployeeId) {
      setFormError("Vui lòng chọn nhân sự áp dụng.");
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    try {
      if (editingTask) {
        const updated = await updateOnboardingTask(editingTask.id, {
          taskName: formTaskName.trim(),
          assignedRole: formAssignedRole,
          dueDate: formDueDate,
          status: formStatus,
          notes: formNotes.trim() || null,
        });
        setTasks((prev) =>
          prev.map((t) => (t.id === editingTask.id ? updated : t))
        );
        if (viewingTask?.id === editingTask.id) {
          setViewingTask(updated);
        }
        showToast("Đã cập nhật thông tin đầu việc thành công.");
      } else {
        const created = await createOnboardingTask({
          employeeId: formEmployeeId,
          processType: formProcessType,
          taskName: formTaskName.trim(),
          assignedRole: formAssignedRole,
          dueDate: formDueDate,
          notes: formNotes.trim() || null,
        });
        if (created.processType === activeProcess) {
          setTasks((prev) => [...prev, created]);
        } else {
          setActiveProcess(created.processType);
        }
        setExpandedEmployeeIds((prev) => ({
          ...prev,
          [created.employeeId]: true,
        }));
        showToast("Đã thêm đầu việc mới thành công.");
      }
      setIsFormModalOpen(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Không thể lưu đầu việc."
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Delete Confirm
  const handleConfirmDelete = async () => {
    if (!deletingTask) return;
    setFormSubmitting(true);
    try {
      await deleteOnboardingTask(deletingTask.id);
      setTasks((prev) => prev.filter((t) => t.id !== deletingTask.id));
      if (viewingTask?.id === deletingTask.id) {
        setViewingTask(null);
      }
      showToast("Đã xóa đầu việc khỏi quy trình.");
      setDeletingTask(null);
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Không thể xóa đầu việc này."
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const inProgressTasks = tasks.filter((t) => t.status === "InProgress").length;
  const pendingTasks = tasks.filter((t) => t.status === "Pending").length;
  const overallPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-[24px] lg:text-[26px] font-bold text-[#111827]">
            Quy trình Tiếp nhận & Nghỉ việc
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-1">
            Theo dõi tiến độ theo từng nhân sự, phân công và cập nhật các đầu việc cho Phòng Nhân sự, CNTT và Quản lý.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Process Type Switcher */}
          <div className="flex items-center bg-[#F3F4F6] p-1 rounded-[10px] border border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => {
                setActiveProcess("Onboarding");
                setCurrentPage(1);
              }}
              className={`px-3.5 py-2 rounded-[8px] text-[13px] font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${activeProcess === "Onboarding"
                  ? "bg-white text-[#7C3AED] shadow-xs font-semibold"
                  : "text-[#6B7280] hover:text-[#111827]"
                }`}
            >
              <span>🚀</span> Tiếp nhận nhân sự
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveProcess("Offboarding");
                setCurrentPage(1);
              }}
              className={`px-3.5 py-2 rounded-[8px] text-[13px] font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${activeProcess === "Offboarding"
                  ? "bg-white text-[#DC2626] shadow-xs font-semibold"
                  : "text-[#6B7280] hover:text-[#111827]"
                }`}
            >
              <span>🚪</span> Thủ tục nghỉ việc
            </button>
          </div>

          {/* Add Task Button */}
          <button
            type="button"
            onClick={() => openCreateModal()}
            className="h-10 px-4 rounded-[10px] bg-[#7C3AED] hover:bg-[#5B21B6] text-white text-[13px] font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <Icon name="add" size={16} />
            <span>Thêm đầu việc mới</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-[8px] text-[13px] text-[#059669] flex items-center justify-between">
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-[#059669] hover:opacity-75 text-[12px] font-semibold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 shadow-xs">
          <p className="text-[12px] text-[#6B7280] font-medium">Tổng đầu việc</p>
          <p className="text-[24px] font-bold text-[#111827] mt-1 font-mono">
            {totalTasks}
          </p>
          <p className="text-[11px] text-[#9CA3AF] mt-0.5">
            Của {allEmployeeGroups.length} nhân sự trong quy trình
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
          <p className="text-[11px] text-[#9CA3AF] mt-0.5">Đang thực hiện</p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 shadow-xs">
          <p className="text-[12px] text-[#6B7280] font-medium">Chờ thực hiện</p>
          <p className="text-[24px] font-bold text-[#D97706] mt-1 font-mono">
            {pendingTasks}
          </p>
          <p className="text-[11px] text-[#9CA3AF] mt-0.5">Cần xử lý</p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-[12px] border border-[#E5E7EB] shadow-xs space-y-3.5">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          {/* Progress Status Tabs (Active vs Completed Employees) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setProgressTab("ACTIVE");
                setHideCompletedTasks(true);
                setCurrentPage(1);
              }}
              className={`h-9 px-3.5 rounded-[8px] text-[13px] font-medium transition-colors cursor-pointer flex items-center gap-2 ${progressTab === "ACTIVE"
                  ? "bg-[#7C3AED] text-white font-semibold shadow-2xs"
                  : "bg-[#F3F4F6] text-[#4B5563] hover:bg-[#E5E7EB]"
                }`}
            >
              <span>Đang thực hiện</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[11px] font-mono ${progressTab === "ACTIVE"
                    ? "bg-white/20 text-white"
                    : "bg-white text-[#4B5563]"
                  }`}
              >
                {activeGroupsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setProgressTab("COMPLETED");
                setHideCompletedTasks(false);
                setCurrentPage(1);
              }}
              className={`h-9 px-3.5 rounded-[8px] text-[13px] font-medium transition-colors cursor-pointer flex items-center gap-2 ${progressTab === "COMPLETED"
                  ? "bg-[#059669] text-white font-semibold shadow-2xs"
                  : "bg-[#F3F4F6] text-[#4B5563] hover:bg-[#E5E7EB]"
                }`}
            >
              <span>Đã hoàn tất 100%</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[11px] font-mono ${progressTab === "COMPLETED"
                    ? "bg-white/20 text-white"
                    : "bg-white text-[#059669]"
                  }`}
              >
                {completedGroupsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setProgressTab("ALL");
                setHideCompletedTasks(false);
                setCurrentPage(1);
              }}
              className={`h-9 px-3.5 rounded-[8px] text-[13px] font-medium transition-colors cursor-pointer flex items-center gap-2 ${progressTab === "ALL"
                  ? "bg-[#111827] text-white font-semibold shadow-2xs"
                  : "bg-[#F3F4F6] text-[#4B5563] hover:bg-[#E5E7EB]"
                }`}
            >
              <span>Tất cả nhân sự</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[11px] font-mono ${progressTab === "ALL"
                    ? "bg-white/20 text-white"
                    : "bg-white text-[#4B5563]"
                  }`}
              >
                {allEmployeeGroups.length}
              </span>
            </button>
          </div>

          {/* Search Input & Toggle Hide Completed Tasks */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[250px] flex-1 sm:flex-initial">
              <span className="absolute left-3 top-2.5 text-[#9CA3AF]">
                <Icon name="search" size={16} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm tên nhân sự, mã NV hoặc đầu việc..."
                className="w-full h-9 pl-9 pr-3 rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] text-[13px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#7C3AED] focus:bg-white"
              />
            </div>

            {progressTab !== "COMPLETED" && (
              <label className="flex items-center gap-2 text-[12px] text-[#374151] font-medium cursor-pointer select-none bg-[#F9FAFB] px-3 py-2 rounded-[8px] border border-[#E5E7EB]">
                <input
                  type="checkbox"
                  checked={hideCompletedTasks}
                  onChange={(e) => setHideCompletedTasks(e.target.checked)}
                  className="rounded text-[#7C3AED] focus:ring-[#7C3AED] w-4 h-4"
                />
                <span>Ẩn đầu việc đã hoàn tất</span>
              </label>
            )}
          </div>
        </div>

        {/* Bottom row of Toolbar: Role filter + Expand/Collapse all */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#F3F4F6]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[12px] text-[#6B7280] font-medium mr-1">
              Bộ phận phụ trách:
            </span>
            {[
              { key: "ALL", label: "Tất cả" },
              { key: "HR", label: "Phòng Nhân sự" },
              { key: "IT", label: "Bộ phận CNTT" },
              { key: "MANAGER", label: "Quản lý" },
              { key: "EMPLOYEE", label: "Nhân viên" },
            ].map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => {
                  setSelectedRole(r.key);
                  setCurrentPage(1);
                }}
                className={`h-7 px-2.5 rounded-[6px] text-[12px] font-medium transition-colors cursor-pointer ${selectedRole === r.key
                    ? "bg-[#EDE9FE] text-[#7C3AED] font-semibold border border-[#DDD6FE]"
                    : "bg-[#F9FAFB] text-[#4B5563] hover:bg-[#F3F4F6]"
                  }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {paginatedGroups.length > 0 && (
            <div className="flex items-center gap-2 text-[12px]">
              <button
                type="button"
                onClick={expandAllVisible}
                className="text-[#7C3AED] hover:underline font-medium cursor-pointer"
              >
                Mở rộng tất cả
              </button>
              <span className="text-[#D1D5DB]">•</span>
              <button
                type="button"
                onClick={collapseAllVisible}
                className="text-[#6B7280] hover:text-[#111827] hover:underline font-medium cursor-pointer"
              >
                Thu gọn tất cả
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Accordion Employee List */}
      {isLoading ? (
        <div className="py-12 text-center bg-white border border-[#E5E7EB] rounded-[12px] text-[#6B7280] text-[14px]">
          Đang tải dữ liệu quy trình...
        </div>
      ) : error ? (
        <div className="p-4 bg-[#FEF2F2] border border-[#FCA5A5] rounded-[8px] text-[#EF4444] text-[13px]">
          {error}
        </div>
      ) : paginatedGroups.length === 0 ? (
        <div className="py-12 text-center bg-white border border-[#E5E7EB] rounded-[12px] p-8 space-y-2">
          <p className="text-[#374151] font-semibold text-[15px]">
            {progressTab === "ACTIVE"
              ? "Tất cả nhân sự hiện tại đã hoàn tất 100% đầu việc!"
              : "Không tìm thấy nhân sự hoặc đầu việc nào phù hợp."}
          </p>
          <p className="text-[#9CA3AF] text-[13px]">
            {progressTab === "ACTIVE" && completedGroupsCount > 0
              ? `Bạn có thể bấm sang tab "Đã hoàn tất 100% (${completedGroupsCount})" để xem lại lịch sử các đầu việc đã xong.`
              : "Bấm nút '+ Thêm đầu việc mới' ở góc trên để giao thêm đầu việc cho nhân sự."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedGroups.map((group) => {
            const isExpanded = !!expandedEmployeeIds[group.employeeId];

            // Filter tasks inside this employee group
            const visibleTasks = group.tasks.filter((t) => {
              if (selectedRole !== "ALL" && t.assignedRole !== selectedRole) {
                return false;
              }
              if (
                hideCompletedTasks &&
                progressTab !== "COMPLETED" &&
                (t.status === "Completed" || t.status === "Skipped")
              ) {
                return false;
              }
              if (searchQuery.trim()) {
                const q = searchQuery.trim().toLowerCase();
                const empMatches =
                  group.employeeName.toLowerCase().includes(q) ||
                  group.employeeCode.toLowerCase().includes(q);
                if (!empMatches) {
                  return (
                    t.taskName.toLowerCase().includes(q) ||
                    (t.notes && t.notes.toLowerCase().includes(q))
                  );
                }
              }
              return true;
            });

            const hiddenCompletedCount = group.tasks.length - visibleTasks.length;

            // Summarize remaining tasks by role for quick overview when collapsed
            const pendingByRole = group.tasks.reduce<Record<string, number>>(
              (acc, t) => {
                if (t.status !== "Completed" && t.status !== "Skipped") {
                  acc[t.assignedRole] = (acc[t.assignedRole] || 0) + 1;
                }
                return acc;
              },
              {}
            );

            return (
              <div
                key={group.employeeId}
                className="bg-white border border-[#E5E7EB] rounded-[12px] shadow-xs overflow-hidden transition-all"
              >
                {/* Accordion Header Row */}
                <div
                  onClick={() => toggleExpandEmployee(group.employeeId)}
                  className={`px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 cursor-pointer select-none transition-colors ${isExpanded
                      ? "bg-[#FAFAFA] border-b border-[#E5E7EB]"
                      : "hover:bg-[#F9FAFB]"
                    }`}
                >
                  {/* Left: Arrow + Employee Name & Code */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-[#6B7280] bg-white border border-[#E5E7EB] transition-transform shrink-0 ${isExpanded ? "rotate-90 text-[#7C3AED] border-[#DDD6FE]" : ""
                        }`}
                    >
                      <Icon name="chevron_right" size={16} />
                    </span>

                    <div className="w-9 h-9 rounded-full bg-[#EDE9FE] text-[#7C3AED] font-heading font-bold text-[13px] flex items-center justify-center shrink-0">
                      {group.employeeName
                        .split(" ")
                        .slice(-2)
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-heading text-[15px] font-bold text-[#111827]">
                          {group.employeeName}
                        </span>
                        <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-[#F3F4F6] text-[#4B5563]">
                          {group.employeeCode}
                        </span>
                        <Link
                          href={`/employees/${group.employeeId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[12px] text-[#7C3AED] hover:underline font-medium"
                        >
                          Hồ sơ ↗
                        </Link>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {group.isFullyCompleted ? (
                          <span className="text-[12px] text-[#059669] font-medium">
                            ✓ Đã hoàn tất toàn bộ {group.total} đầu việc
                          </span>
                        ) : (
                          <>
                            <span className="text-[12px] text-[#6B7280]">
                              Còn {group.total - group.completed} việc cần làm:
                            </span>
                            {Object.entries(pendingByRole).map(([rKey, count]) => {
                              const badge =
                                ROLE_BADGES[rKey as AssignedRole] || ROLE_BADGES.HR;
                              return (
                                <span
                                  key={rKey}
                                  className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${badge.bg} ${badge.text} ${badge.border}`}
                                >
                                  {badge.label}: {count}
                                </span>
                              );
                            })}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Progress Bar & Quick Add Task Button */}
                  <div className="flex items-center gap-4 shrink-0 self-end lg:self-center">
                    <div className="w-36 sm:w-44">
                      <div className="flex items-center justify-between text-[12px] mb-1">
                        <span className="text-[#6B7280]">
                          Hoàn thành: {group.completed}/{group.total}
                        </span>
                        <span
                          className={`font-mono font-bold ${group.isFullyCompleted
                              ? "text-[#059669]"
                              : "text-[#7C3AED]"
                            }`}
                        >
                          {group.percent}%
                        </span>
                      </div>
                      <div className="w-full bg-[#E5E7EB] h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${group.isFullyCompleted
                              ? "bg-[#059669]"
                              : "bg-[#7C3AED]"
                            }`}
                          style={{ width: `${group.percent}%` }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openCreateModal(group.employeeId);
                      }}
                      className="h-8 px-3 rounded-[8px] border border-[#DDD6FE] bg-[#F5F3FF] hover:bg-[#EDE9FE] text-[#7C3AED] text-[12px] font-semibold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                      title="Thêm đầu việc cho nhân sự này"
                    >
                      <Icon name="add" size={14} />
                      <span>Thêm việc</span>
                    </button>
                  </div>
                </div>

                {/* Accordion Body: Task List for this Employee */}
                {isExpanded && (
                  <div className="p-4 space-y-2.5 bg-white">
                    {visibleTasks.length === 0 ? (
                      <div className="py-6 text-center text-[13px] text-[#6B7280] bg-[#F9FAFB] rounded-[8px] border border-dashed border-[#E5E7EB]">
                        <span>
                          Đã ẩn {hiddenCompletedCount} đầu việc đã hoàn tất của{" "}
                          <strong>{group.employeeName}</strong>.
                        </span>{" "}
                        <button
                          type="button"
                          onClick={() => setHideCompletedTasks(false)}
                          className="text-[#7C3AED] font-semibold hover:underline cursor-pointer ml-1"
                        >
                          Hiện lại để xem
                        </button>
                      </div>
                    ) : (
                      visibleTasks.map((task) => {
                        const roleBadge =
                          ROLE_BADGES[task.assignedRole] || ROLE_BADGES.HR;
                        const statusBadge =
                          STATUS_CONFIG[task.status] || STATUS_CONFIG.Pending;
                        const isCompleted = task.status === "Completed";
                        const isUpdating = updatingTaskId === task.id;

                        return (
                          <div
                            key={task.id}
                            className={`border rounded-[10px] p-3.5 transition-colors flex flex-col xl:flex-row xl:items-center justify-between gap-3 ${isCompleted
                                ? "border-[#E5E7EB] bg-[#F9FAFB]"
                                : "border-[#E5E7EB] hover:border-[#DDD6FE] bg-white"
                              }`}
                          >
                            {/* Left: Checkbox + Task details */}
                            <div className="flex items-start gap-3 min-w-0">
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() =>
                                  handleStatusChange(
                                    task.id,
                                    isCompleted ? "Pending" : "Completed"
                                  )
                                }
                                className={`w-5 h-5 rounded-[6px] border flex items-center justify-center shrink-0 mt-0.5 transition-colors cursor-pointer ${isCompleted
                                    ? "bg-[#059669] border-[#059669] text-white"
                                    : "border-[#D1D5DB] hover:border-[#7C3AED] bg-white text-transparent"
                                  }`}
                                title={
                                  isCompleted
                                    ? "Đánh dấu chưa hoàn tất"
                                    : "Đánh dấu đã hoàn tất"
                                }
                              >
                                ✓
                              </button>

                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4
                                    onClick={() => setViewingTask(task)}
                                    className={`font-heading text-[14px] font-semibold text-[#111827] hover:text-[#7C3AED] cursor-pointer ${isCompleted
                                        ? "line-through text-[#9CA3AF]"
                                        : ""
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
                                    Hạn hoàn thành:{" "}
                                    <strong className="text-[#374151]">
                                      {formatDateVN(task.dueDate)}
                                    </strong>
                                  </span>
                                  {task.assignedToEmployeeName && (
                                    <>
                                      <span>•</span>
                                      <span>
                                        Người phụ trách:{" "}
                                        <strong className="text-[#374151]">
                                          {task.assignedToEmployeeName}
                                        </strong>
                                      </span>
                                    </>
                                  )}
                                  {task.completedAt && (
                                    <>
                                      <span>•</span>
                                      <span className="text-[#059669] font-medium">
                                        Hoàn tất: {formatDateVN(task.completedAt)}
                                      </span>
                                    </>
                                  )}
                                </div>

                                {task.notes && (
                                  <p className="text-[12px] text-[#4B5563] bg-[#F9FAFB] px-2.5 py-1.5 rounded-[6px] mt-1 border border-[#F3F4F6]">
                                    <span className="font-medium text-[#6B7280]">
                                      Ghi chú:{" "}
                                    </span>
                                    {task.notes}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Right: Status Select + CRUD Action Buttons (Xem, Sửa, Xóa) */}
                            <div className="flex items-center flex-wrap gap-2 shrink-0 self-end xl:self-center">
                              <span
                                className={`px-2.5 py-1 rounded-[6px] text-[12px] font-medium inline-flex items-center gap-1 ${statusBadge.bg} ${statusBadge.text}`}
                              >
                                <span>{statusBadge.icon}</span>
                                <span>{statusBadge.label}</span>
                              </span>

                              <select
                                disabled={isUpdating}
                                value={task.status}
                                onChange={(e) =>
                                  handleStatusChange(
                                    task.id,
                                    e.target.value as TaskStatus
                                  )
                                }
                                className="h-8 px-2.5 rounded-[6px] border border-[#E5E7EB] text-[12px] text-[#374151] bg-white focus:outline-none focus:border-[#7C3AED] cursor-pointer"
                              >
                                <option value="Pending">Chờ xử lý</option>
                                <option value="InProgress">Đang tiến hành</option>
                                <option value="Completed">Đã hoàn tất</option>
                                <option value="Skipped">Bỏ qua</option>
                              </select>

                              {/* View / Note Button */}
                              <button
                                type="button"
                                onClick={() => setViewingTask(task)}
                                className="h-8 px-2.5 rounded-[6px] border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-[#374151] text-[12px] font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                                title="Xem chi tiết & Ghi chú"
                              >
                                <Icon name="visibility" size={14} />
                                <span>Chi tiết</span>
                              </button>

                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => openEditModal(task)}
                                className="h-8 px-2.5 rounded-[6px] border border-[#E5E7EB] bg-white hover:bg-[#F5F3FF] hover:border-[#DDD6FE] text-[#7C3AED] text-[12px] font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                                title="Chỉnh sửa đầu việc"
                              >
                                <Icon name="edit_square" size={14} />
                                <span>Sửa</span>
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => setDeletingTask(task)}
                                className="h-8 px-2.5 rounded-[6px] border border-[#FECACA] bg-white hover:bg-[#FEF2F2] text-[#DC2626] text-[12px] font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                                title="Xóa đầu việc"
                              >
                                <Icon name="delete" size={14} />
                                <span>Xóa</span>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}

                    {hideCompletedTasks &&
                      progressTab !== "COMPLETED" &&
                      hiddenCompletedCount > 0 &&
                      visibleTasks.length > 0 && (
                        <div className="pt-1 flex items-center justify-between text-[12px] text-[#6B7280] px-1">
                          <span>
                            Đã ẩn {hiddenCompletedCount} đầu việc đã hoàn tất của nhân sự này.
                          </span>
                          <button
                            type="button"
                            onClick={() => setHideCompletedTasks(false)}
                            className="text-[#7C3AED] hover:underline font-medium cursor-pointer"
                          >
                            Hiện tất cả ({group.total})
                          </button>
                        </div>
                      )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="bg-white border border-[#E5E7EB] rounded-[12px] px-5 py-3.5 flex items-center justify-between text-[13px]">
              <span className="text-[#6B7280]">
                Hiển thị trang <strong>{safePage}</strong> /{" "}
                <strong>{totalPages}</strong> ({filteredGroups.length} nhân sự)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-3 rounded-[6px] border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] disabled:opacity-40 text-[12px] font-medium cursor-pointer"
                >
                  Trang trước
                </button>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  className="h-8 px-3 rounded-[6px] border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] disabled:opacity-40 text-[12px] font-medium cursor-pointer"
                >
                  Trang sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: VIEW TASK DETAILS & NOTES */}
      {viewingTask && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[14px] border border-[#E5E7EB] shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden my-auto">
            <div className="px-6 py-4 border-b border-[#F3F4F6] flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-heading text-[17px] font-bold text-[#111827]">
                  Chi tiết đầu việc quy trình
                </h3>
                <p className="text-[12px] text-[#6B7280] mt-0.5">
                  {viewingTask.processType === "Onboarding"
                    ? "Quy trình tiếp nhận nhân sự mới"
                    : "Quy trình bàn giao nghỉ việc"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingTask(null)}
                className="w-8 h-8 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] flex items-center justify-center cursor-pointer"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-[13px]">
              <div className="p-3.5 rounded-[10px] bg-[#F9FAFB] border border-[#E5E7EB] space-y-1">
                <span className="text-[11px] font-semibold text-[#6B7280] uppercase">
                  Tên công việc
                </span>
                <p className="font-heading text-[15px] font-bold text-[#111827]">
                  {viewingTask.taskName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="p-3 rounded-[8px] border border-[#E5E7EB]">
                  <span className="text-[11px] text-[#6B7280] block">
                    Nhân sự áp dụng
                  </span>
                  <span className="font-semibold text-[#111827] mt-0.5 block">
                    {viewingTask.employeeName} ({viewingTask.employeeCode})
                  </span>
                </div>

                <div className="p-3 rounded-[8px] border border-[#E5E7EB]">
                  <span className="text-[11px] text-[#6B7280] block">
                    Bộ phận phụ trách
                  </span>
                  <span className="font-semibold text-[#7C3AED] mt-0.5 block">
                    {ROLE_BADGES[viewingTask.assignedRole]?.label ||
                      viewingTask.assignedRole}
                  </span>
                </div>

                <div className="p-3 rounded-[8px] border border-[#E5E7EB]">
                  <span className="text-[11px] text-[#6B7280] block">
                    Hạn hoàn thành
                  </span>
                  <span className="font-semibold text-[#111827] mt-0.5 block">
                    {formatDateVN(viewingTask.dueDate)}
                  </span>
                </div>

                <div className="p-3 rounded-[8px] border border-[#E5E7EB]">
                  <span className="text-[11px] text-[#6B7280] block">
                    Trạng thái hiện tại
                  </span>
                  <span className="font-semibold text-[#111827] mt-0.5 block">
                    {STATUS_CONFIG[viewingTask.status]?.label ||
                      viewingTask.status}
                  </span>
                </div>
              </div>

              {viewingTask.completedAt && (
                <div className="p-3 rounded-[8px] bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669]">
                  Đã hoàn tất vào ngày:{" "}
                  <strong>{formatDateVN(viewingTask.completedAt)}</strong>
                </div>
              )}

              <div className="space-y-1.5">
                <span className="text-[12px] font-semibold text-[#374151] block">
                  Ghi chú hướng dẫn / Kết quả bàn giao
                </span>
                <div className="p-3.5 rounded-[8px] bg-[#F9FAFB] border border-[#E5E7EB] text-[#374151] min-h-[72px] whitespace-pre-wrap">
                  {viewingTask.notes || "Chưa có ghi chú cho đầu việc này."}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#F3F4F6] bg-[#FAFAFA] flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const taskToEdit = viewingTask;
                  setViewingTask(null);
                  openEditModal(taskToEdit);
                }}
                className="h-9 px-4 rounded-lg border border-[#DDD6FE] bg-[#F5F3FF] hover:bg-[#EDE9FE] text-[#7C3AED] text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Icon name="edit_square" size={14} />
                <span>Chỉnh sửa / Ghi chú</span>
              </button>

              <button
                type="button"
                onClick={() => setViewingTask(null)}
                className="h-9 px-4 rounded-lg border border-[#D1D5DB] bg-white hover:bg-[#F3F4F6] text-[#374151] text-[12px] font-medium cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE / EDIT TASK */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[14px] border border-[#E5E7EB] shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden my-auto">
            <div className="px-6 py-4 border-b border-[#F3F4F6] flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-heading text-[17px] font-bold text-[#111827]">
                  {editingTask
                    ? "Chỉnh sửa đầu việc quy trình"
                    : "Thêm đầu việc mới"}
                </h3>
                <p className="text-[12px] text-[#6B7280] mt-0.5">
                  {editingTask
                    ? `Nhân sự: ${editingTask.employeeName} (${editingTask.employeeCode})`
                    : "Phân công đầu việc tiếp nhận hoặc bàn giao nghỉ việc cho nhân sự"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="w-8 h-8 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] flex items-center justify-center cursor-pointer"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <form
              id="onboardingTaskForm"
              onSubmit={handleFormSubmit}
              className="p-6 space-y-4 overflow-y-auto flex-1 text-[13px]"
            >
              {formError && (
                <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[12px] text-[#EF4444]">
                  {formError}
                </div>
              )}

              {!editingTask && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[12px] font-semibold text-[#111827] block">
                      Nhân sự áp dụng *
                    </label>
                    <select
                      value={formEmployeeId}
                      onChange={(e) => setFormEmployeeId(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-[#D1D5DB] text-[13px] text-[#111827] bg-white focus:outline-none focus:border-[#7C3AED]"
                      required
                    >
                      <option value="">-- Chọn nhân sự --</option>
                      {employeesList.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.fullName} ({emp.employeeCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[12px] font-semibold text-[#111827] block">
                      Loại quy trình *
                    </label>
                    <select
                      value={formProcessType}
                      onChange={(e) =>
                        setFormProcessType(e.target.value as ProcessType)
                      }
                      className="w-full h-9 px-3 rounded-lg border border-[#D1D5DB] text-[13px] text-[#111827] bg-white focus:outline-none focus:border-[#7C3AED]"
                    >
                      <option value="Onboarding">Tiếp nhận nhân sự</option>
                      <option value="Offboarding">Thủ tục nghỉ việc</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[12px] font-semibold text-[#111827] block">
                  Tên đầu việc *
                </label>
                <input
                  type="text"
                  value={formTaskName}
                  onChange={(e) => setFormTaskName(e.target.value)}
                  placeholder="VD: Cấp thẻ từ ra vào tòa nhà và tài khoản nội bộ..."
                  className="w-full h-9 px-3 rounded-lg border border-[#D1D5DB] text-[13px] text-[#111827] focus:outline-none focus:border-[#7C3AED]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-[#111827] block">
                    Bộ phận phụ trách *
                  </label>
                  <select
                    value={formAssignedRole}
                    onChange={(e) =>
                      setFormAssignedRole(e.target.value as AssignedRole)
                    }
                    className="w-full h-9 px-3 rounded-lg border border-[#D1D5DB] text-[13px] text-[#111827] bg-white focus:outline-none focus:border-[#7C3AED]"
                  >
                    <option value="HR">Phòng Nhân sự</option>
                    <option value="IT">Bộ phận CNTT</option>
                    <option value="MANAGER">Quản lý trực tiếp</option>
                    <option value="EMPLOYEE">Nhân viên</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-[#111827] block">
                    Hạn hoàn thành *
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-[#D1D5DB] text-[13px] text-[#111827] focus:outline-none focus:border-[#7C3AED]"
                    required
                  />
                </div>
              </div>

              {editingTask && (
                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-[#111827] block">
                    Trạng thái thực hiện
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) =>
                      setFormStatus(e.target.value as TaskStatus)
                    }
                    className="w-full h-9 px-3 rounded-lg border border-[#D1D5DB] text-[13px] text-[#111827] bg-white focus:outline-none focus:border-[#7C3AED]"
                  >
                    <option value="Pending">Chờ xử lý</option>
                    <option value="InProgress">Đang tiến hành</option>
                    <option value="Completed">Đã hoàn tất</option>
                    <option value="Skipped">Bỏ qua</option>
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[12px] font-semibold text-[#111827] block">
                  Ghi chú hướng dẫn / Bàn giao
                </label>
                <textarea
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ghi chú chi tiết hồ sơ cần nộp, mã thiết bị cấp phát hoặc biên bản bàn giao..."
                  className="w-full p-2.5 rounded-lg border border-[#D1D5DB] text-[13px] text-[#111827] focus:outline-none focus:border-[#7C3AED]"
                />
              </div>
            </form>

            <div className="px-6 py-4 border-t border-[#F3F4F6] bg-[#FAFAFA] flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="h-9 px-4 rounded-lg border border-[#D1D5DB] bg-white hover:bg-[#F3F4F6] text-[#4B5563] text-[12px] font-medium cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                form="onboardingTaskForm"
                disabled={formSubmitting}
                className="h-9 px-4 rounded-lg bg-[#7C3AED] hover:bg-[#5B21B6] text-white text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {formSubmitting && (
                  <Icon name="sync" size={14} className="animate-spin" />
                )}
                <span>{editingTask ? "Lưu thay đổi" : "Thêm đầu việc"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE CONFIRMATION */}
      {deletingTask && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[14px] border border-[#E5E7EB] shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden my-auto">
            <div className="p-6 space-y-3">
              <h3 className="font-heading text-[17px] font-bold text-[#111827]">
                Xác nhận xóa đầu việc
              </h3>
              <p className="text-[13px] text-[#4B5563] leading-relaxed">
                Bạn có chắc chắn muốn xóa đầu việc{" "}
                <strong className="text-[#111827]">
                  &ldquo;{deletingTask.taskName}&rdquo;
                </strong>{" "}
                của nhân sự{" "}
                <strong className="text-[#111827]">
                  {deletingTask.employeeName}
                </strong>{" "}
                không?
              </p>
            </div>

            <div className="px-6 py-4 border-t border-[#F3F4F6] bg-[#FAFAFA] flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setDeletingTask(null)}
                disabled={formSubmitting}
                className="h-9 px-4 rounded-lg border border-[#D1D5DB] bg-white hover:bg-[#F3F4F6] text-[#4B5563] text-[12px] font-medium cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={formSubmitting}
                className="h-9 px-4 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[12px] font-semibold cursor-pointer disabled:opacity-50"
              >
                {formSubmitting ? "Đang xóa..." : "Xóa đầu việc"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
