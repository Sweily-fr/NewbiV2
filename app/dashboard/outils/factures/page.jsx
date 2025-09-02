"use client";

import { Suspense } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import InvoiceTable from "./components/invoice-table";
import { useRouter } from "next/navigation";
import { CompanyInfoGuard } from "@/src/components/guards/CompanyInfoGuard";
import { ProRouteGuard } from "@/src/components/pro-route-guard";

function InvoicesContent() {
  const router = useRouter();

  const handleCreateInvoice = () => {
    router.push("/dashboard/outils/factures/new");
  };

  return (
    <CompanyInfoGuard>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium mb-2">Factures clients</h1>
            <p className="text-muted-foreground text-sm">
              Gérez vos factures, devis et documents commerciaux
            </p>
          </div>
          <Button onClick={handleCreateInvoice} className="gap-2 font-normal">
            {/* <Plus className="h-4 w-4" /> */}
            Créer une facture
          </Button>
        </div>

        {/* Table */}
        <Suspense fallback={<InvoiceTableSkeleton />}>
          <InvoiceTable />
        </Suspense>
      </div>
    </CompanyInfoGuard>
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
