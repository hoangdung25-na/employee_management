"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  AUTH_LOGOUT_EVENT,
  AUTH_UPDATED_EVENT,
  getStoredSession,
  setStoredSession,
  logoutApi,
} from "@/lib/api/client";
import { AuthSession, LoginPayload } from "@/features/auth/types/auth";
import { loginApi, getCurrentUserApi } from "@/features/auth/services/authService";

interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<AuthSession>;
  logout: () => Promise<void>;
  hasRole: (roleCode: string) => boolean;
  hasPermission: (permissionCode: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        // Clear any legacy localStorage items if present
        getStoredSession();

        // Hydrate user profile/roles/permissions into RAM directly from Backend
        // using the browser's HttpOnly Session Cookie (access_token / refresh_token)
        const currentProfile = await getCurrentUserApi();
        if (isMounted && currentProfile?.userId) {
          const ramSession: AuthSession = {
            userId: currentProfile.userId,
            employeeId: currentProfile.employeeId,
            username: currentProfile.username,
            email: currentProfile.email,
            fullName: currentProfile.fullName,
            avatarUrl: currentProfile.avatarUrl,
            mustChangePassword: currentProfile.mustChangePassword,
            roles: currentProfile.roles,
            permissions: currentProfile.permissions,
          };
          setStoredSession(ramSession);
          setSession(ramSession);
        } else if (isMounted) {
          setStoredSession(null);
          setSession(null);
        }
      } catch {
        // Cookie expired (>3 hours or browser closed) or not logged in -> clear RAM state
        if (isMounted) {
          setStoredSession(null);
          setSession(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initSession();

    const handleAuthUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<AuthSession>;
      if (customEvent.detail) {
        setSession(customEvent.detail);
      }
    };

    const handleAuthLogout = () => {
      setSession(null);
    };

    window.addEventListener(AUTH_UPDATED_EVENT, handleAuthUpdated);
    window.addEventListener(AUTH_LOGOUT_EVENT, handleAuthLogout);

    return () => {
      isMounted = false;
      window.removeEventListener(AUTH_UPDATED_EVENT, handleAuthUpdated);
      window.removeEventListener(AUTH_LOGOUT_EVENT, handleAuthLogout);
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const result = await loginApi(payload);
    setStoredSession(result);
    setSession(result);
    return result;
  }, []);

  const logout = useCallback(async () => {
    await logoutApi();
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
      if (!session) return false;
      if (
        session.permissions &&
        session.permissions.length > 0
      ) {
        return session.permissions.some(
          (p) => p.toLowerCase() === permissionCode.toLowerCase()
        );
      }
      return session.roles.some((r) => r.toUpperCase() === "SUPER_ADMIN");
    },
    [session]
  );

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated: Boolean(session?.userId),
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
