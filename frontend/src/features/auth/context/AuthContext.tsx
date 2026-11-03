"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AUTH_STORAGE_KEY } from "@/lib/api/client";
import { AuthSession, LoginPayload } from "@/features/auth/types/auth";
import { loginApi } from "@/features/auth/services/authService";

interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<AuthSession>;
  logout: () => void;
  hasRole: (roleCode: string) => boolean;
  hasPermission: (permissionCode: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AuthSession;
        if (parsed && parsed.accessToken) {
          setSession(parsed);
        }
      }
    } catch {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const result = await loginApi(payload);
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(result));
    setSession(result);
    return result;
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    setSession(null);
  }, []);

  const hasRole = useCallback(
    (roleCode: string) => {
      if (!session) return false;
      return session.roles.some(
        (r) => r.toUpperCase() === roleCode.toUpperCase()
      );
    },
    [session]
  );

  const hasPermission = useCallback(
    (permissionCode: string) => {
      if (!session) return true; // Cho phép trải nghiệm ở chế độ Demo nếu chưa đăng nhập
      if (
        session.roles.some((r) => r.toUpperCase() === "SUPER_ADMIN") ||
        session.permissions.some(
          (p) => p.toLowerCase() === permissionCode.toLowerCase()
        )
      ) {
        return true;
      }
      return false;
    },
    [session]
  );

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated: Boolean(session?.accessToken),
        isLoading,
        login,
        logout,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return ctx;
}

