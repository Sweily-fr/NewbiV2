"use client";

import { Suspense } from "react";
import ModernInvoiceEditor from "../components/modern-invoice-editor";
import { CompanyInfoGuard } from "@/src/components/guards/CompanyInfoGuard";

export default function NewInvoicePage() {
  return (
    <CompanyInfoGuard>
      <Suspense fallback={<InvoiceEditorSkeleton />}>
        <ModernInvoiceEditor mode="create" />
      </Suspense>
    </CompanyInfoGuard>
  );
}

function InvoiceEditorSkeleton() {
  return (
    <div className="h- grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Editor skeleton */}
      <div className="space-y-6">
        <div className="rounded-lg border p-6">
          <Skeleton className="h-6 w-[200px] mb-4" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
        <div className="rounded-lg border p-6">
          <Skeleton className="h-6 w-[150px] mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Preview skeleton */}
      <div className="rounded-lg border p-6">
        <Skeleton className="h-6 w-[100px] mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  );
}
