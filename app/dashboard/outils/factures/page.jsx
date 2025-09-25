"use client";

import { Suspense } from "react";
import { Button } from "@/src/components/ui/button";
import { Plus } from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";
import InvoiceTable from "./components/invoice-table";
import { useRouter } from "next/navigation";
import { ProRouteGuard } from "@/src/components/pro-route-guard";

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-medium mb-2">Factures</h1>
            <p className="text-muted-foreground text-sm">
              Gérez vos factures et suivez vos paiements
            </p>
          </div>
          <Button onClick={handleNewInvoice} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle facture
          </Button>
        </div>

        {/* Table */}
        <Suspense fallback={<InvoiceTableSkeleton />}>
          <InvoiceTable />
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

        {/* Bouton flottant mobile */}
        <Button
          onClick={handleNewInvoice}
          className="fixed bottom-6 bg-[#5a50ff] right-6 h-14 w-14 rounded-full shadow-lg z-50 md:hidden"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </>
  );
}

export default function InvoicesPage() {
  return (
    <ProRouteGuard pageName="Factures">
      <InvoicesContent />
    </ProRouteGuard>
  );
}

function InvoiceTableSkeleton() {
  return (
    <div className="space-y-4 p-6">
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
  );
}
