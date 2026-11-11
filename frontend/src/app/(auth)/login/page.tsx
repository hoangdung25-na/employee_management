"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const { login } = useAuth();

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await login({ usernameOrEmail, password });
      if (
        result.roles.includes("EMPLOYEE") &&
        !result.roles.includes("SUPER_ADMIN") &&
        !result.roles.includes("HR_MANAGER") &&
        !result.roles.includes("HR_STAFF") &&
        !result.roles.includes("MANAGER") &&
        result.employeeId
      ) {
        router.push(`/employees/${result.employeeId}`);
      } else {
        router.push("/employees");
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-[12px] p-8 shadow-md">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-[8px] bg-[#7C3AED] flex items-center justify-center text-white font-heading font-bold text-lg shadow-xs">
          H
        </div>
        <div>
          <h1 className="font-heading text-[20px] leading-[28px] font-semibold text-[#111827]">
            Đăng nhập
          </h1>
        </div>
      </div>

      {reason === "idle_timeout" && (
        <div className="mb-5 p-3.5 rounded-[8px] bg-[#EFF6FF] border border-[#3B82F6] text-[#1D4ED8] text-[13px] leading-[20px] flex items-start gap-2">
          <span>ℹ️</span>
          <span>
            Đăng nhập lại để tiếp tục.
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-5 p-3.5 rounded-[8px] bg-[#FEF2F2] border border-[#EF4444] text-[#EF4444] text-[13px] leading-[20px]">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="usernameOrEmail"
            className="block text-[14px] font-medium text-[#111827] mb-1"
          >
            Tên đăng nhập hoặc Email công vụ
          </label>
          <input
            id="usernameOrEmail"
            type="text"
            required
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            placeholder="VD: username hoặc user@company.com"
            className="w-full h-10 px-3 py-2 rounded-[8px] border border-[#E5E7EB] bg-white text-[14px] text-[#111827] hover:border-[#A78BFA] focus:outline-none focus:border-[#7C3AED] focus:ring-3 focus:ring-[#7C3AED]/25 transition-all"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-[14px] font-medium text-[#111827] mb-1"
          >
            Mật khẩu
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu của bạn..."
            className="w-full h-10 px-3 py-2 rounded-[8px] border border-[#E5E7EB] bg-white text-[14px] text-[#111827] hover:border-[#A78BFA] focus:outline-none focus:border-[#7C3AED] focus:ring-3 focus:ring-[#7C3AED]/25 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-10 inline-flex items-center justify-center rounded-[8px] bg-[#7C3AED] text-white text-[14px] font-medium hover:bg-[#5B21B6] disabled:opacity-50 transition-colors cursor-pointer mt-2"
        >
          {isSubmitting ? "Đang xác thực..." : "Đăng nhập Hệ thống →"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-6">
      <Suspense fallback={<div className="w-full max-w-md bg-white rounded-[12px] p-8 h-64" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
