import { apiGet, apiPost } from "@/lib/api/client";
import {
  AuthSession,
  ChangePasswordPayload,
  CurrentUserProfile,
  LoginPayload,
} from "@/features/auth/types/auth";

export async function loginApi(payload: LoginPayload): Promise<AuthSession> {
  return apiPost<AuthSession>("/auth/login", payload);
}

export async function refreshTokenApi(
  accessToken: string,
  refreshToken: string
): Promise<AuthSession> {
  return apiPost<AuthSession>("/auth/refresh-token", {
    accessToken,
    refreshToken,
  });
}

export async function changePasswordApi(
  payload: ChangePasswordPayload
): Promise<boolean> {
  return apiPost<boolean>("/auth/change-password", payload);
}

export async function getCurrentUserApi(): Promise<CurrentUserProfile> {
  return apiGet<CurrentUserProfile>("/auth/me");
}

