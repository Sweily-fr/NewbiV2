"use client";

import { Suspense } from "react";
import ModernInvoiceEditor from "../components/modern-invoice-editor";
import { Skeleton } from "@/src/components/ui/skeleton";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { CompanyInfoGuard } from "@/src/components/company-info-guard";

function NewInvoiceContent() {
  return (
    <Suspense fallback={<InvoiceEditorSkeleton />}>
      <ModernInvoiceEditor mode="create" />
    </Suspense>
  );
}

export default function NewInvoicePage() {
  return (
    <ProRouteGuard pageName="Nouvelle facture">
      <CompanyInfoGuard>
        <NewInvoiceContent />
      </CompanyInfoGuard>
    </ProRouteGuard>
  );
}

function InvoiceEditorSkeleton() {
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background">
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] h-full">
        {/* Left Panel - Form Skeleton */}
        <div className="pl-4 pt-18 pr-2 pb-4 md:pl-6 md:pt-6 md:pr-6 flex flex-col h-full overflow-hidden">
          <div className="max-w-2xl mx-auto flex flex-col w-full h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-4 md:mb-6 md:pb-6 border-b">
              <div className="flex items-center gap-2">
                <div className="space-y-2">
                  <Skeleton className="h-6 md:h-7 w-32 md:w-40" />
                  <Skeleton className="h-4 w-24 md:w-32" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-20 hidden md:block" />
              </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
              <div className="space-y-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-5 w-24" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-2 md:gap-4">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-16 md:w-20" />
                    <Skeleton className="h-10 w-16 md:w-20" />
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 mt-4 border-t">
              <div className="flex justify-between">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Panel - Preview Skeleton (hidden on mobile) */}
        <div className="hidden lg:flex bg-muted/30 border-l flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6 bg-[#F9F9F9] dark:bg-[#1a1a1a]">
            <div className="bg-white rounded-lg p-8 space-y-6">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
