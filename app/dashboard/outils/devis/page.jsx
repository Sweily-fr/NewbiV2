"use client";

import { Suspense } from "react";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import QuoteTable from "./components/quote-table";
import { useRouter } from "next/navigation";
import { CompanyInfoGuard } from "@/src/components/guards/CompanyInfoGuard";

export default function QuotesPage() {
  const router = useRouter();

  const handleCreateQuote = () => {
    router.push("/dashboard/outils/devis/new");
  };

  return (
    <CompanyInfoGuard>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium mb-2">Devis clients</h1>
            <p className="text-muted-foreground text-sm">
              Gérez vos devis et propositions commerciales
            </p>
          </div>
          <Button onClick={handleCreateQuote} className="gap-2 font-normal">
            Créer un devis
          </Button>
        </div>

        {/* Table */}
        <Suspense fallback={<QuoteTableSkeleton />}>
          <QuoteTable />
        </Suspense>
      </div>
    </CompanyInfoGuard>
  );
}

function QuoteTableSkeleton() {
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
