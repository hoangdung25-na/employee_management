"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Root page component.
 * Primary redirection is handled instantly at the server edge by middleware.ts.
 * This client fallback provides zero-error instant validation for Next.js Partial Prerendering.
 */
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/employees");
  }, [router]);

  return null;
}
