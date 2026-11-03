import React, { Suspense, use } from "react";
import { EmployeeDetailView } from "./EmployeeDetailView";

interface EmployeeDetailPageProps {
  params: Promise<{ id: string }>;
}

function DetailContainer({ params }: EmployeeDetailPageProps) {
  const { id } = use(params);
  return <EmployeeDetailView id={id} />;
}

export default function EmployeeDetailPage({
  params,
}: EmployeeDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-8 w-64 bg-[#E5E7EB] rounded animate-pulse" />
          <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#EDE9FE] animate-pulse" />
              <div className="space-y-2">
                <div className="h-5 w-48 bg-[#E5E7EB] rounded animate-pulse" />
                <div className="h-4 w-32 bg-[#F3F4F6] rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      }
    >
      <DetailContainer params={params} />
    </Suspense>
  );
}
