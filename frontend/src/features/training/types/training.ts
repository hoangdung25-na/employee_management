export interface TrainingCourse {
  id: string;
  courseCode: string;
  courseName: string;
  category: string;
  instructorName?: string | null;
  durationHours: number;
  startDate: string;
  endDate: string;
  isMandatory: boolean;
  maxParticipants?: number | null;
  status: string;
  description?: string | null;
  enrolledCount: number;
  completedCount: number;

  isEnrolled: boolean;
  myEnrollmentStatus?: string | null;
  myProgressPercent?: number | null;
  myExamScore?: number | null;
}

export interface EmployeeTraining {
  id: string;
  trainingCourseId: string;
  courseCode: string;
  courseName: string;
  category: string;
  durationHours: number;

  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentName: string;

  assignedByEmployeeId?: string | null;
  assignedByName?: string | null;

  enrollmentStatus: string;
  progressPercent: number;
  examScore?: number | null;
  completedAt?: string | null;
  certificateUrl?: string | null;
  feedback?: string | null;
}

export interface CreateTrainingCourseRequest {
  courseCode: string;
  courseName: string;
  category: string;
  instructorName?: string;
  durationHours: number;
  startDate: string;
  endDate: string;
  isMandatory: boolean;
  maxParticipants?: number;
  description?: string;
}

export interface EnrollTrainingRequest {
  courseId: string;
  targetEmployeeId?: string;
}

export interface UpdateTrainingProgressRequest {
  progressPercent: number;
  examScore?: number;
  feedback?: string;
  enrollmentStatus?: string;
}

