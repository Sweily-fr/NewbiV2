"use client";

import { Suspense } from "react";
import { use } from "react";
import { Skeleton } from "@/src/components/ui/skeleton";
import ModernInvoiceEditor from "../../components/modern-invoice-editor";

export default function EditInvoicePage({ params }) {
  const { id } = use(params);

  return (
    <div className="h-auto flex flex-col">
      <Suspense fallback={<InvoiceEditorSkeleton />}>
        <ModernInvoiceEditor mode="edit" invoiceId={id} />
      </Suspense>
    </div>
  );
}

function InvoiceEditorSkeleton() {
  return (
    <div className="h-auto overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
        {/* Left Panel - Form skeleton */}
        <div className="p-6 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden rounded-b-lg">
          <div className="max-w-2xl mx-auto flex flex-col w-full overflow-hidden">
            {/* Header skeleton */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8" />
                <div>
                  <Skeleton className="h-6 w-[200px] mb-2" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
              </div>
              <Skeleton className="h-6 w-[80px]" />
            </div>

            {/* Form skeleton */}
            <div className="flex-1 min-h-0 space-y-6">
              {/* Section 1 */}
              <div className="rounded-lg border p-6">
                <Skeleton className="h-6 w-[200px] mb-4" />
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>

              {/* Section 2 */}
              <div className="rounded-lg border p-6">
                <Skeleton className="h-6 w-[150px] mb-4" />
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              </div>

              {/* Section 3 */}
              <div className="rounded-lg border p-6">
                <Skeleton className="h-6 w-[180px] mb-4" />
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="h-10 flex-1" />
                      <Skeleton className="h-10 w-20" />
                      <Skeleton className="h-10 w-20" />
                      <Skeleton className="h-10 w-8" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4 */}
              <div className="rounded-lg border p-6">
                <Skeleton className="h-6 w-[160px] mb-4" />
                <div className="space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-16" />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="flex justify-between font-medium">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer skeleton */}
            <div className="border-t pt-4 mt-6">
              <div className="flex justify-between">
                <Skeleton className="h-10 w-20" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Preview skeleton */}
        <div className="border-l flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
          <div className="flex-shrink-0 p-4 border-b">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-[150px]" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
