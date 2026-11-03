import { ApiResponse } from "@/types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:5050/api";

export const AUTH_STORAGE_KEY = "hrflow_auth_session";

export class ApiClientError extends Error {
  public readonly statusCode: number;
  public readonly errors?: string[] | null;

  constructor(message: string, statusCode: number, errors?: string[] | null) {
    super(message);
    this.name = "ApiClientError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { accessToken?: string };
    return parsed.accessToken || null;
  } catch {
    return null;
  }
}

/**
 * Builds a clean query string ignoring undefined, null, or empty string values.
 */
export function buildQueryString(params?: Record<string, unknown>): string {
  if (!params) return "";
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      searchParams.append(key, String(value).trim());
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

async function request<T>(
  method: string,
  endpoint: string,
  options?: {
    params?: Record<string, unknown>;
    body?: unknown;
    init?: RequestInit;
  }
): Promise<T> {
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${path}${buildQueryString(options?.params)}`;

  const token = getStoredAccessToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options?.body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.init?.headers as Record<string, string> | undefined),
  };

  const response = await fetch(url, {
    method,
    headers,
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
    ...options?.init,
  });

  // Handle 204 No Content (e.g., DELETE /api/departments/{id})
  if (response.status === 204) {
    return true as unknown as T;
  }

  let payload: (ApiResponse<T> & { title?: string; detail?: string }) | null =
    null;
  try {
    payload = await response.json();
  } catch {
    throw new ApiClientError(
      `Không thể đọc phản hồi từ máy chủ (HTTP ${response.status}).`,
      response.status
    );
  }

  if (!response.ok || !payload || payload.success === false || payload.data === null) {
    let extractedErrors: string[] = [];
    if (Array.isArray(payload?.errors)) {
      extractedErrors = payload.errors.filter(Boolean);
    } else if (
      payload?.errors &&
      typeof payload.errors === "object" &&
      !Array.isArray(payload.errors)
    ) {
      extractedErrors = Object.values(
        payload.errors as Record<string, string[] | string>
      ).flatMap((item) => (Array.isArray(item) ? item : [item]));
    }

    const detailedError =
      extractedErrors.length > 0
        ? extractedErrors.join(" ")
        : payload?.message ||
          payload?.detail ||
          payload?.title ||
          `Yêu cầu thất bại với mã trạng thái ${response.status}`;

    throw new ApiClientError(
      detailedError,
      response.status,
      extractedErrors.length > 0 ? extractedErrors : null
    );
  }

  return payload.data;
}

export async function apiGet<T>(
  endpoint: string,
  params?: Record<string, unknown>,
  init?: RequestInit
): Promise<T> {
  return request<T>("GET", endpoint, { params, init });
}

export async function apiPost<T>(
  endpoint: string,
  body?: unknown,
  init?: RequestInit
): Promise<T> {
  return request<T>("POST", endpoint, { body, init });
}

export async function apiPut<T>(
  endpoint: string,
  body?: unknown,
  init?: RequestInit
): Promise<T> {
  return request<T>("PUT", endpoint, { body, init });
}

export async function apiPatch<T>(
  endpoint: string,
  body?: unknown,
  init?: RequestInit
): Promise<T> {
  return request<T>("PATCH", endpoint, { body, init });
}

export async function apiDelete<T = boolean>(
  endpoint: string,
  body?: unknown,
  init?: RequestInit
): Promise<T> {
  return request<T>("DELETE", endpoint, { body, init });
}
