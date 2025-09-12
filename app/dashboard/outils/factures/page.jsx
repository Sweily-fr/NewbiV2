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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Factures</h1>
          <p className="text-muted-foreground">
            Gérez vos factures et suivez vos paiements
          </p>
        </div>
        <Button onClick={handleNewInvoice}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle facture
        </Button>
      </div>

      {/* Table */}
      <Suspense fallback={<InvoiceTableSkeleton />}>
        <InvoiceTable />
      </Suspense>
    </div>
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
