"use client";

import { Suspense, useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "@/src/components/ui/button-group";
import { Plus, Settings } from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";
import QuoteTable from "./components/quote-table";
import { QuoteSettingsModal } from "./components/quote-settings-modal";
import { useRouter, useSearchParams } from "next/navigation";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { CompanyInfoGuard } from "@/src/components/company-info-guard";

function QuotesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [quoteIdToOpen, setQuoteIdToOpen] = useState(null);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setQuoteIdToOpen(id);
      // Nettoyer l'URL après avoir récupéré l'ID
      router.replace('/dashboard/outils/devis', { scroll: false });
    }
  }, [searchParams, router]);

  const handleNewQuote = () => {
    router.push("/dashboard/outils/devis/new");
  };

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:block space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-medium mb-2">Devis</h1>
            <p className="text-muted-foreground text-sm">
              Créez et gérez vos devis clients
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Paramètres
          </Button>
        </div>

        {/* Table */}
        <Suspense fallback={<QuoteTableSkeleton />}>
          <QuoteTable handleNewQuote={handleNewQuote} quoteIdToOpen={quoteIdToOpen} />
        </Suspense>
      </div>

      {/* Mobile Layout - Style Notion */}
      <div className="md:hidden">
        {/* Header - Style Notion sur mobile */}
        <div className="px-4 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-medium mb-2">Devis</h1>
              <p className="text-muted-foreground text-sm">
                Créez et gérez vos devis clients
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSettingsOpen(true)}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Table */}
        <Suspense fallback={<QuoteTableSkeleton />}>
          <QuoteTable quoteIdToOpen={quoteIdToOpen} />
        </Suspense>

        {/* Bouton flottant mobile */}
        <Button
          onClick={handleNewQuote}
          className="fixed bottom-6 bg-[#5a50ff] right-6 h-14 w-14 rounded-full shadow-lg z-50 md:hidden"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Modal des paramètres */}
      <QuoteSettingsModal
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </>
  );
}

export default function QuotesPage() {
  // Page liste des devis - accessible en Pro avec informations d'entreprise complètes
  return (
    <ProRouteGuard pageName="Devis">
      <CompanyInfoGuard>
        <QuotesContent />
      </CompanyInfoGuard>
    </ProRouteGuard>
  );
}

function QuoteTableSkeleton() {
  return (
    <>
      {/* Desktop Skeleton */}
      <div className="hidden md:block space-y-4">
      {/* Filters skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-60" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-16" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="bg-background overflow-hidden rounded-md border">
        <div className="table-fixed w-full">
          <div className="border-b">
            <div className="flex hover:bg-transparent">
              <div className="h-11 w-7 p-4 flex items-center">
                <Skeleton className="h-4 w-4 rounded" />
              </div>
              <div className="h-11 w-[150px] p-4 flex items-center">
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="h-11 w-[200px] p-4 flex items-center">
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="h-11 w-[100px] p-4 flex items-center">
                <Skeleton className="h-4 w-12" />
              </div>
              <div className="h-11 w-[80px] p-4 flex items-center">
                <Skeleton className="h-4 w-14" />
              </div>
              <div className="h-11 w-[120px] p-4 flex items-center">
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="h-11 w-[60px]"></div>
            </div>
          </div>
          <div>
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="flex border-b">
                <div className="p-4 w-7">
                  <Skeleton className="h-4 w-4 rounded" />
                </div>
                <div className="p-4 w-[150px]">
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="p-4 w-[200px]">
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="p-4 w-[100px]">
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <div className="p-4 w-[80px]">
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="p-4 w-[120px]">
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="p-4 w-[60px]">
                  <div className="flex justify-end">
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between gap-8">
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-16" />
        </div>
        <div className="text-muted-foreground flex grow justify-end text-sm whitespace-nowrap">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>
      </div>

      {/* Mobile Skeleton */}
      <div className="md:hidden">
        {/* Header */}
        <div className="px-4 py-6 space-y-2">
          <Skeleton className="h-7 w-24" />
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
