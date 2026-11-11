"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { trainingService } from "@/features/training/services/trainingService";
import { TrainingCourse, EmployeeTraining } from "@/features/training/types/training";
import { useAuth } from "@/features/auth/context/AuthContext";
import { formatDateVN } from "@/lib/utils/format";

const CATEGORY_LABELS: Record<string, string> = {
  Technical: "Chuyên môn kỹ thuật",
  "Soft Skills": "Kỹ năng mềm",
  Leadership: "Quản lý & Lãnh đạo",
  Compliance: "Quy định & Tuân thủ",
};

export default function TrainingDashboardPage() {
  const { session, hasRole } = useAuth();
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [myTrainings, setMyTrainings] = useState<EmployeeTraining[]>([]);
  const [category, setCategory] = useState<string>("All");
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCourseForProgress, setSelectedCourseForProgress] = useState<TrainingCourse | null>(null);
  const [progressVal, setProgressVal] = useState<number>(0);
  const [examScoreVal, setExamScoreVal] = useState<number | "">("");
  const [feedbackVal, setFeedbackVal] = useState<string>("");

  // Create form state
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Technical");
  const [newInstructor, setNewInstructor] = useState("");
  const [newHours, setNewHours] = useState(12);
  const [newStartDate, setNewStartDate] = useState("2026-11-15");
  const [newEndDate, setNewEndDate] = useState("2026-11-30");
  const [newMandatory, setNewMandatory] = useState(false);
  const [newMax, setNewMax] = useState(30);
  const [newDesc, setNewDesc] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const isHrOrAdmin = hasRole("SUPER_ADMIN") || hasRole("HR_MANAGER");

  const loadData = async () => {
    setLoading(true);
    try {
      const [coursesData, myTrainingsData] = await Promise.all([
        trainingService
          .getCourses({
            category: category === "All" ? undefined : category,
            search: search.trim() || undefined,
          })
          .catch(() => []),
        trainingService
          .getMyTrainings(
            session?.employeeId ? { employeeId: session.employeeId } : undefined
          )
          .catch(() => []),
      ]);
      setCourses(coursesData);
      setMyTrainings(myTrainingsData);
    } catch (err) {
      console.error("Failed to load training data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [category]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleEnroll = async (courseId: string) => {
    try {
      await trainingService.enroll({ courseId });
      await loadData();
    } catch (err: any) {
      alert(err?.message || "Đăng ký khóa học thất bại.");
    }
  };

  const handleOpenProgressModal = (course: TrainingCourse) => {
    setSelectedCourseForProgress(course);
    setProgressVal(course.myProgressPercent ?? 0);
    setExamScoreVal(course.myExamScore ?? "");
    setFeedbackVal("");
  };

  const handleSaveProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForProgress) return;

    const myTraining = myTrainings.find((t) => t.trainingCourseId === selectedCourseForProgress.id);
    if (!myTraining) return;

    setModalLoading(true);
    try {
      await trainingService.updateProgress(myTraining.id, {
        progressPercent: Number(progressVal),
        examScore: examScoreVal === "" ? undefined : Number(examScoreVal),
        feedback: feedbackVal || undefined,
      });
      setSelectedCourseForProgress(null);
      await loadData();
    } catch (err: any) {
      alert(err?.message || "Cập nhật tiến độ thất bại.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalLoading(true);

    try {
      await trainingService.createCourse({
        courseCode: newCode.trim(),
        courseName: newName.trim(),
        category: newCategory,
        instructorName: newInstructor.trim() || undefined,
        durationHours: Number(newHours),
        startDate: newStartDate,
        endDate: newEndDate,
        isMandatory: newMandatory,
        maxParticipants: Number(newMax),
        description: newDesc.trim() || undefined,
      });

      setIsCreateModalOpen(false);
      setNewCode("");
      setNewName("");
      setNewDesc("");
      await loadData();
    } catch (err: any) {
      setModalError(err?.message || "Tạo khóa học thất bại.");
    } finally {
      setModalLoading(false);
    }
  };

  const totalCourses = courses.length;
  const totalEnrolled = courses.reduce((acc, c) => acc + c.enrolledCount, 0);
  const totalCompleted = courses.reduce((acc, c) => acc + c.completedCount, 0);
  const myCompletedCount = myTrainings.filter((t) => t.enrollmentStatus === "Completed").length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-xs">
        <div>
          <h1 className="font-heading text-[24px] lg:text-[28px] font-bold text-[#111827] tracking-tight">
            Đào tạo & Phát triển Năng lực
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-1">
            Quản lý các khóa đào tạo nội bộ, bồi dưỡng chuyên môn và theo dõi tiến độ học tập của nhân sự.
          </p>
        </div>

        {isHrOrAdmin && (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="h-10 px-4 bg-[#7C3AED] hover:bg-[#5B21B6] text-white rounded-lg text-[13px] font-semibold flex items-center gap-2 shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Icon name="add" size={16} />
            <span>Tạo khóa đào tạo mới</span>
          </button>
        )}
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider block">
              Tổng số khóa học
            </span>
            <span className="text-[26px] font-heading font-bold text-[#111827] block mt-1">
              {totalCourses}
            </span>
            <span className="text-[12px] text-[#0D9488] font-medium mt-0.5 block">
              Toàn công ty
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center shrink-0">
            <Icon name="school" size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider block">
              Lượt đăng ký học
            </span>
            <span className="text-[26px] font-heading font-bold text-[#111827] block mt-1">
              {totalEnrolled}
            </span>
            <span className="text-[12px] text-[#6B7280] mt-0.5 block">
              Học viên tham gia
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] text-[#0D9488] flex items-center justify-center shrink-0">
            <Icon name="groups" size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider block">
              Hoàn thành khóa học
            </span>
            <span className="text-[26px] font-heading font-bold text-[#111827] block mt-1">
              {totalCompleted}
            </span>
            <span className="text-[12px] text-[#0D9488] font-medium mt-0.5 block">
              Đạt yêu cầu đầu ra
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0">
            <Icon name="verified" size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider block">
              Khóa học của tôi
            </span>
            <span className="text-[26px] font-heading font-bold text-[#111827] block mt-1">
              {myTrainings.length}
            </span>
            <span className="text-[12px] text-[#7C3AED] font-medium mt-0.5 block">
              Đã hoàn tất {myCompletedCount} khóa
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center shrink-0">
            <Icon name="badge" size={20} />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E5E7EB] shadow-xs">
        <div className="flex items-center gap-1.5 flex-wrap text-[13px]">
          {[
            { label: "Tất cả", value: "All" },
            { label: "Chuyên môn kỹ thuật", value: "Technical" },
            { label: "Kỹ năng mềm", value: "Soft Skills" },
            { label: "Quản lý & Lãnh đạo", value: "Leadership" },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setCategory(tab.value)}
              className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${category === tab.value
                ? "bg-[#EDE9FE] text-[#7C3AED] font-semibold"
                : "text-[#4B5563] hover:bg-[#F9FAFB] hover:text-[#111827]"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="relative min-w-[240px]">
          <span className="absolute left-3 top-2.5 text-[#9CA3AF]">
            <Icon name="search" size={16} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên khóa, giảng viên..."
            className="w-full h-9 pl-9 pr-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[13px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]"
          />
        </form>
      </div>

      {/* Courses Catalog Grid */}
      {loading ? (
        <div className="p-16 text-center text-[#9CA3AF] bg-white rounded-xl border border-[#E5E7EB]">
          <Icon name="sync" size={24} className="animate-spin inline-block mr-2" />
          Đang tải danh mục khóa đào tạo...
        </div>
      ) : courses.length === 0 ? (
        <div className="p-16 text-center text-[#9CA3AF] bg-white rounded-xl border border-[#E5E7EB]">
          Không có khóa học nào phù hợp với bộ lọc.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => {
            const isCompleted = course.myEnrollmentStatus === "Completed";
            const progress = course.myProgressPercent ?? 0;

            return (
              <div
                key={course.id}
                className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs hover:shadow-sm transition-shadow p-5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Category & Status badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EDE9FE] text-[#7C3AED]">
                      {CATEGORY_LABELS[course.category] || course.category}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {course.isMandatory && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FEF2F2] text-[#EF4444]">
                          Bắt buộc
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${course.status === "Active"
                          ? "bg-[#ECFDF5] text-[#059669]"
                          : course.status === "Upcoming"
                            ? "bg-[#FFFBEB] text-[#D97706]"
                            : "bg-[#F3F4F6] text-[#6B7280]"
                          }`}
                      >
                        {course.status === "Active"
                          ? "Đang mở lớp"
                          : course.status === "Upcoming"
                            ? "Sắp diễn ra"
                            : "Đã kết thúc"}
                      </span>
                    </div>
                  </div>

                  {/* Title & Code */}
                  <div>
                    <h3 className="font-heading text-[16px] font-semibold text-[#111827] line-clamp-2">
                      {course.courseName}
                    </h3>
                    <span className="font-mono text-[11px] text-[#9CA3AF] mt-0.5 block">
                      Mã khóa: {course.courseCode}
                    </span>
                  </div>

                  {/* Description */}
                  {course.description && (
                    <p className="text-[12px] text-[#6B7280] line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="pt-2 border-t border-[#F3F4F6] space-y-1.5 text-[12px] text-[#4B5563]">
                    {course.instructorName && (
                      <div className="flex items-center gap-2">
                        <Icon name="badge" size={14} className="text-[#9CA3AF]" />
                        <span>Giảng viên: <strong>{course.instructorName}</strong></span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Icon name="more_time" size={14} className="text-[#9CA3AF]" />
                      <span>Thời lượng: <strong>{course.durationHours} giờ</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon name="calendar" size={14} className="text-[#9CA3AF]" />
                      <span>
                        {formatDateVN(course.startDate)} – {formatDateVN(course.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon name="groups" size={14} className="text-[#9CA3AF]" />
                      <span>
                        Học viên: <strong>{course.enrolledCount}</strong>
                        {course.maxParticipants ? ` / ${course.maxParticipants}` : ""}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="mt-4 pt-3 border-t border-[#F3F4F6]">
                  {course.isEnrolled ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-medium text-[#111827]">
                          Tiến độ: <strong>{progress}%</strong>
                          {course.myExamScore !== null && course.myExamScore !== undefined && (
                            <span className="ml-1 text-[#059669]">({course.myExamScore} điểm)</span>
                          )}
                        </span>
                        <span
                          className={`font-semibold ${isCompleted ? "text-[#059669]" : "text-[#7C3AED]"
                            }`}
                        >
                          {isCompleted ? "Đã hoàn thành" : "Đang học"}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isCompleted ? "bg-[#059669]" : "bg-[#7C3AED]"
                            }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenProgressModal(course)}
                        className="w-full h-8 mt-1 rounded-lg border border-[#DDD6FE] bg-[#F5F3FF] hover:bg-[#EDE9FE] text-[#7C3AED] text-[12px] font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Icon name="edit_square" size={14} />
                        <span>Cập nhật tiến độ học</span>
                      </button>
                    </div>
                  ) : course.status === "Completed" ? (
                    <button
                      type="button"
                      disabled
                      className="w-full h-9 rounded-lg bg-[#F3F4F6] text-[#9CA3AF] text-[12px] font-medium border border-[#E5E7EB] flex items-center justify-center gap-1.5 cursor-not-allowed select-none"
                    >
                      <Icon name="lock" size={14} />
                      <span>Khóa học đã kết thúc</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleEnroll(course.id)}
                      className="w-full h-9 rounded-lg bg-[#7C3AED] hover:bg-[#5B21B6] text-white text-[12px] font-semibold shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Icon name="add" size={14} />
                      <span>Đăng ký tham gia khóa học</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Progress Update Modal */}
      {selectedCourseForProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-[#E5E7EB] w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden my-auto">
            <div className="px-5 py-4 border-b border-[#F3F4F6] flex items-center justify-between bg-[#FAFAFA] shrink-0">
              <h3 className="font-heading text-[16px] font-semibold text-[#111827]">
                Cập nhật tiến độ: {selectedCourseForProgress.courseName}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedCourseForProgress(null)}
                className="text-[#9CA3AF] hover:text-[#111827] cursor-pointer"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <form
              id="updateTrainingProgressForm"
              onSubmit={handleSaveProgress}
              className="p-5 space-y-4 flex-1 overflow-y-auto"
            >
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[#111827] block">
                  Tiến độ hoàn thành (%): {progressVal}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={progressVal}
                  onChange={(e) => setProgressVal(Number(e.target.value))}
                  className="w-full accent-[#7C3AED]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[#111827] block">
                  Điểm bài kiểm tra cuối khóa (nếu có)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={examScoreVal}
                  onChange={(e) => setExamScoreVal(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="VD: 95"
                  className="w-full h-9 px-3 rounded-lg border border-[#D1D5DB] text-[13px] text-[#111827] focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[#111827] block">
                  Nhận xét & Phản hồi về khóa học
                </label>
                <textarea
                  rows={2}
                  value={feedbackVal}
                  onChange={(e) => setFeedbackVal(e.target.value)}
                  placeholder="Ý kiến đóng góp về bài giảng, tài liệu học tập..."
                  className="w-full p-2.5 rounded-lg border border-[#D1D5DB] text-[12px] text-[#111827] focus:outline-none focus:border-[#7C3AED]"
                />
              </div>
            </form>

            <div className="px-5 py-3.5 border-t border-[#F3F4F6] bg-[#FAFAFA] flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedCourseForProgress(null)}
                className="h-9 px-4 rounded-lg border border-[#D1D5DB] bg-white text-[#4B5563] text-[12px] font-medium cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                form="updateTrainingProgressForm"
                disabled={modalLoading}
                className="h-9 px-4 rounded-lg bg-[#7C3AED] hover:bg-[#5B21B6] text-white text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                {modalLoading && <Icon name="sync" size={14} className="animate-spin" />}
                <span>Lưu tiến độ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Course Modal (Admin/HR) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-[#E5E7EB] w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
            <div className="px-6 py-4 border-b border-[#F3F4F6] flex items-center justify-between bg-[#FAFAFA] shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center">
                  <Icon name="school" size={18} />
                </div>
                <h3 className="font-heading text-[16px] font-semibold text-[#111827]">
                  Tạo khóa đào tạo nội bộ mới
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827] cursor-pointer"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <form
              id="createTrainingCourseForm"
              onSubmit={handleCreateCourse}
              className="p-6 space-y-4 overflow-y-auto flex-1"
            >
              {modalError && (
                <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[12px] text-[#EF4444]">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-[#111827]">Mã khóa học *</label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="TRN-2026-05"
                    className="w-full h-9 px-3 rounded-lg border border-[#D1D5DB] text-[13px] text-[#111827] focus:outline-none focus:border-[#7C3AED]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-[#111827]">Phân loại *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-[#D1D5DB] text-[13px] text-[#111827] focus:outline-none focus:border-[#7C3AED]"
                  >
                    <option value="Technical">Chuyên môn kỹ thuật</option>
                    <option value="Soft Skills">Kỹ năng mềm</option>
                    <option value="Leadership">Quản lý & Lãnh đạo</option>
                    <option value="Compliance">Quy định & Tuân thủ</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-semibold text-[#111827]">Tên khóa đào tạo *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="VD: Kỹ năng quản lý dự án chuyên nghiệp"
                  className="w-full h-9 px-3 rounded-lg border border-[#D1D5DB] text-[13px] text-[#111827] focus:outline-none focus:border-[#7C3AED]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-[#111827]">Giảng viên</label>
                  <input
                    type="text"
                    value={newInstructor}
                    onChange={(e) => setNewInstructor(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full h-9 px-3 rounded-lg border border-[#D1D5DB] text-[13px] text-[#111827] focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-[#111827]">Thời lượng (giờ)</label>
                  <input
                    type="number"
                    min={1}
                    value={newHours}
                    onChange={(e) => setNewHours(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-lg border border-[#D1D5DB] text-[13px] text-[#111827] focus:outline-none focus:border-[#7C3AED]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-[#111827]">Học viên tối đa</label>
                  <input
                    type="number"
                    min={1}
                    value={newMax}
                    onChange={(e) => setNewMax(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-lg border border-[#D1D5DB] text-[13px] text-[#111827] focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-[#111827]">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-[#D1D5DB] text-[13px] text-[#111827] focus:outline-none focus:border-[#7C3AED]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-[#111827]">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-[#D1D5DB] text-[13px] text-[#111827] focus:outline-none focus:border-[#7C3AED]"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="mandatoryCheck"
                  checked={newMandatory}
                  onChange={(e) => setNewMandatory(e.target.checked)}
                  className="rounded text-[#7C3AED] focus:ring-[#7C3AED] w-4 h-4"
                />
                <label htmlFor="mandatoryCheck" className="text-[13px] text-[#111827] cursor-pointer">
                  Khóa học bắt buộc cho toàn bộ nhân sự liên quan
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-semibold text-[#111827]">Mô tả khóa học</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Mục tiêu kiến thức, kỹ năng đạt được sau khóa học..."
                  className="w-full p-2.5 rounded-lg border border-[#D1D5DB] text-[12px] text-[#111827] focus:outline-none focus:border-[#7C3AED]"
                />
              </div>
            </form>

            <div className="px-6 py-4 border-t border-[#F3F4F6] bg-[#FAFAFA] flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="h-9 px-4 rounded-lg border border-[#D1D5DB] bg-white text-[#4B5563] text-[12px] font-medium cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                form="createTrainingCourseForm"
                disabled={modalLoading}
                className="h-9 px-4 rounded-lg bg-[#7C3AED] hover:bg-[#5B21B6] text-white text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                {modalLoading && <Icon name="sync" size={14} className="animate-spin" />}
                <span>Tạo khóa học</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
