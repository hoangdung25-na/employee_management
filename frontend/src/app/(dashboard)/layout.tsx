import React, { Suspense } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-[#FAFAFA] text-[#111827]">
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
          {children}
        </main>
      </div>
    </div>
  );
}
