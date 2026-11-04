export interface WorkShift {
  id: string;
  shiftCode: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  gracePeriodMinutes: number;
  standardHours: number;
  isNightShift: boolean;
  isActive: boolean;
}

export interface AttendanceLog {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  workShiftId: string;
  shiftName: string;
  shiftCode: string;
  attendanceDate: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  checkInMethod: string;
  checkInIpAddress?: string | null;
  workingHours: number;
  overtimeHours: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  status: "Present" | "Late" | "EarlyLeave" | "HalfDay" | "Absent" | "OnLeave";
  notes?: string | null;
}

export interface TodayAttendanceStatus {
  employeeId: string;
  employeeName: string;
  todayDate: string;
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  workingHours: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  status: string;
  assignedShift?: WorkShift | null;
  canCheckIn: boolean;
  canCheckOut: boolean;
}

export interface AttendanceHistoryResponse {
  month: number;
  year: number;
  totalPresent: number;
  totalLate: number;
  totalEarlyLeave: number;
  totalOnLeave: number;
  totalWorkingHours: number;
  totalOvertimeHours: number;
  items: AttendanceLog[];
}
