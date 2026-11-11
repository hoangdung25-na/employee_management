"use client";

import React, { Suspense, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useIdleTimer } from "@/features/auth/hooks/useIdleTimer";
import LoginPage from "@/app/(auth)/login/page";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, logout } = useAuth();

  const handleIdleTimeout = useCallback(async () => {
    await logout();
    router.replace("/login?reason=idle_timeout");
  }, [logout, router]);

  useIdleTimer({
    timeoutMs: 3 * 60 * 60 * 1000, // 3 hours per security requirement
    onIdle: handleIdleTimeout,
    enabled: isAuthenticated && !isLoading,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (!isLoading && !isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FAFAFA]" />
      )}
      <div
        className={
          isLoading
            ? "invisible pointer-events-none h-0 overflow-hidden"
            : "min-h-screen flex bg-[#FAFAFA] text-[#111827]"
        }
      >
        <Suspense
          fallback={
            <aside className="w-64 shrink-0 bg-white border-r border-[#E5E7EB] hidden lg:block min-h-screen" />
          }
        >
          <Sidebar />
        </Suspense>
        <div className="flex-1 flex flex-col min-w-0">
          <Suspense
            fallback={
              <header className="h-16 border-b border-[#E5E7EB] bg-white" />
            }
          >
            <Header />
          </Suspense>
          <main className="flex-1 p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
            <Suspense fallback={null}>{children}</Suspense>
          </main>
        </div>
      </div>
    </>
  );
}
