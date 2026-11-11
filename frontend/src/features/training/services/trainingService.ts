import { apiGet, apiPost, apiPut } from "@/lib/api/client";
import {
  CreateTrainingCourseRequest,
  EmployeeTraining,
  EnrollTrainingRequest,
  TrainingCourse,
  UpdateTrainingProgressRequest,
} from "../types/training";

export const trainingService = {
  getCourses: async (params?: { category?: string; search?: string }): Promise<TrainingCourse[]> => {
    return apiGet<TrainingCourse[]>("/trainings/courses", params);
  },

  createCourse: async (dto: CreateTrainingCourseRequest): Promise<TrainingCourse> => {
    return apiPost<TrainingCourse>("/trainings/courses", dto);
  },

  getMyTrainings: async (params?: { employeeId?: string; courseId?: string }): Promise<EmployeeTraining[]> => {
    return apiGet<EmployeeTraining[]>("/trainings/my-trainings", params);
  },

  enroll: async (dto: EnrollTrainingRequest): Promise<EmployeeTraining> => {
    return apiPost<EmployeeTraining>("/trainings/enroll", dto);
  },

  updateProgress: async (id: string, dto: UpdateTrainingProgressRequest): Promise<EmployeeTraining> => {
    return apiPut<EmployeeTraining>(`/trainings/${id}/progress`, dto);
  },
};

