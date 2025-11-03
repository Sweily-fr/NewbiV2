"use client";

import { Suspense } from "react";
import { Button } from "@/src/components/ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "@/src/components/ui/button-group";
import { PermissionButton } from "@/src/components/rbac";
import { Plus } from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";
import InvoiceTable from "./components/invoice-table";
import { useRouter } from "next/navigation";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { CompanyInfoGuard } from "@/src/components/company-info-guard";

function InvoicesContent() {
  const router = useRouter();

  const handleNewInvoice = () => {
    router.push("/dashboard/outils/factures/new");
  };

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:block space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-medium mb-2">Factures</h1>
          <p className="text-muted-foreground text-sm">
            Gérez vos factures et suivez vos paiements
          </p>
        </div>

        {/* Table */}
        <Suspense fallback={<InvoiceTableSkeleton />}>
          <InvoiceTable handleNewInvoice={handleNewInvoice} />
        </Suspense>
      </div>

      {/* Mobile Layout - Style Notion */}
      <div className="md:hidden">
        {/* Header - Style Notion sur mobile */}
        <div className="px-4 py-6">
          <div>
            <h1 className="text-2xl font-medium mb-2">Factures</h1>
            <p className="text-muted-foreground text-sm">
              Gérez vos factures et suivez vos paiements
            </p>
          </div>
        </div>

        {/* Table */}
        <Suspense fallback={<InvoiceTableSkeleton />}>
          <InvoiceTable />
        </Suspense>

        {/* Bouton flottant mobile avec protection RBAC */}
        <PermissionButton
          resource="invoices"
          action="create"
          onClick={handleNewInvoice}
          className="fixed bottom-6 bg-[#5a50ff] right-6 h-14 w-14 rounded-full shadow-lg z-50 md:hidden"
          size="icon"
          hideIfNoAccess={true}
          tooltipNoAccess="Vous n'avez pas la permission de créer des factures"
        >
          <Plus className="h-6 w-6" />
        </PermissionButton>
      </div>
    </>
  );
}

export default function InvoicesPage() {
  // Page liste des factures - accessible en Pro avec informations d'entreprise complètes
  return (
    <ProRouteGuard pageName="Factures">
      <CompanyInfoGuard>
        <InvoicesContent />
      </CompanyInfoGuard>
    </ProRouteGuard>
  );
}

function InvoiceTableSkeleton() {
  return (
    <>
      {/* Desktop Skeleton */}
      <div className="hidden md:block space-y-4 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-[300px]" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-[100px]" />
            <Skeleton className="h-10 w-[100px]" />
          </div>
        </div>
        <div className="rounded-md border">
          <div className="p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 py-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-4 w-[120px]" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Skeleton */}
      <div className="md:hidden">
        {/* Header */}
        <div className="px-4 py-6 space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>

        {/* Toolbar */}
        <div className="px-4 py-3">
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Table rows */}
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border-b border-gray-50 px-4 py-3">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-4" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
