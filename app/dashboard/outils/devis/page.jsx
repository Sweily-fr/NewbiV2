"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { Button } from "@/src/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/src/components/ui/button-group";
import { PermissionButton } from "@/src/components/rbac";
import { Plus, Settings, Bell } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { Skeleton } from "@/src/components/ui/skeleton";
import QuoteTable from "./components/quote-table";
import { QuoteSettingsModal } from "./components/quote-settings-modal";
import { useRouter, useSearchParams } from "next/navigation";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { CompanyInfoGuard } from "@/src/components/company-info-guard";
import { useQuotes, QUOTE_STATUS } from "@/src/graphql/quoteQueries";
import { useToastManager } from "@/src/components/ui/toast-manager";
import { SendDocumentModal } from "@/app/dashboard/outils/factures/components/send-document-modal";

function QuotesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [quoteIdToOpen, setQuoteIdToOpen] = useState(null);

  // Toast manager et modal d'envoi pour les nouveaux devis
  const toastManager = useToastManager();
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [newQuoteData, setNewQuoteData] = useState(null);

  // Vérifier si un nouveau devis vient d'être créé
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedData = sessionStorage.getItem("newQuoteData");
      if (storedData) {
        try {
          const quoteData = JSON.parse(storedData);
          setNewQuoteData(quoteData);
          
          // Afficher le toast avec bouton "Envoyer au client"
          toastManager.add({
            type: "document",
            title: "Devis créé avec succès",
            description: `Devis ${quoteData.number} créé`,
            timeout: 10000,
            actionProps: quoteData.clientEmail ? {
              children: "Envoyer au client",
              onClick: () => {
                setShowSendEmailModal(true);
              },
            } : undefined,
          });
          
          // Supprimer les données du sessionStorage
          sessionStorage.removeItem("newQuoteData");
        } catch (e) {
          sessionStorage.removeItem("newQuoteData");
        }
      }
    }
  }, [toastManager]);

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setQuoteIdToOpen(id);
      // Nettoyer l'URL après avoir récupéré l'ID
      router.replace("/dashboard/outils/devis", { scroll: false });
    }
  }, [searchParams, router]);

  const handleNewQuote = () => {
    router.push("/dashboard/outils/devis/new");
  };

  // Récupérer les devis pour les stats
  const { quotes, loading: quotesLoading } = useQuotes();

  // Calculer les statistiques
  const quoteStats = useMemo(() => {
    if (!quotes || quotes.length === 0) {
      return {
        totalQuoted: 0,
        totalAccepted: 0,
        pendingAmount: 0,
        pendingCount: 0,
      };
    }

    let totalQuoted = 0;
    let totalAccepted = 0;
    let pendingAmount = 0;
    let pendingCount = 0;

    quotes.forEach((quote) => {
      // Exclure les brouillons du total devisé
      if (quote.status !== QUOTE_STATUS.DRAFT) {
        totalQuoted += quote.totalHT || 0;
      }

      // Total accepté = devis acceptés
      if (quote.status === QUOTE_STATUS.ACCEPTED) {
        totalAccepted += quote.totalHT || 0;
      }

      // Devis en attente
      if (quote.status === QUOTE_STATUS.SENT) {
        pendingAmount += quote.totalHT || 0;
        pendingCount++;
      }
    });

    return {
      totalQuoted,
      totalAccepted,
      pendingAmount,
      pendingCount,
    };
  }, [quotes]);

  // Formater les montants
  const formatAmount = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <>
      {/* Desktop Layout - Full height avec scroll uniquement sur le tableau */}
      <div className="hidden md:flex md:flex-col md:h-[calc(100vh-64px)] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-4 sm:px-6 pt-4 sm:pt-6">
          <div>
            <h1 className="text-2xl font-medium mb-2">Devis clients</h1>
          </div>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => setIsSettingsOpen(true)}
                  >
                    <Settings className="h-4 w-4" strokeWidth={1.5} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-[#202020] text-white border-0"
                >
                  <p>Paramètres</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <ButtonGroup>
              <Button
                onClick={handleNewQuote}
                className="cursor-pointer font-normal bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                Nouveau devis
              </Button>
              <ButtonGroupSeparator />
              <Button
                onClick={handleNewQuote}
                size="icon"
                className="cursor-pointer bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                <Plus size={16} aria-hidden="true" />
              </Button>
            </ButtonGroup>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="flex gap-3 px-4 sm:px-6 py-3">
          {/* Total devisé + Total accepté */}
          <div className="bg-background border rounded-lg px-4 py-3 flex items-center gap-0">
            {/* Total devisé */}
            <div className="pr-4">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs text-muted-foreground">
                  Total devisé
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-medium tracking-tight">
                  {quotesLoading
                    ? "..."
                    : `${formatAmount(quoteStats.totalQuoted)} €`}
                </span>
                <span className="text-xs text-muted-foreground">HT</span>
              </div>
            </div>

            {/* Separator */}
            <div className="w-px h-10 bg-border mx-4" />

            {/* Total accepté */}
            <div className="pl-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs text-muted-foreground">
                  Total accepté
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-medium tracking-tight">
                  {quotesLoading
                    ? "..."
                    : `${formatAmount(quoteStats.totalAccepted)} €`}
                </span>
                <span className="text-xs text-muted-foreground">HT</span>
              </div>
            </div>
          </div>

          {/* Devis en attente */}
          <div className="bg-background border rounded-lg px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs text-muted-foreground">
                Devis en attente
              </span>
              {quoteStats.pendingCount > 0 && (
                <span className="h-4 w-4 flex items-center justify-center rounded-full bg-orange-100 text-orange-500 text-[10px] font-medium">
                  {quoteStats.pendingCount}
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-medium tracking-tight">
                {quotesLoading
                  ? "..."
                  : `${formatAmount(quoteStats.pendingAmount)} €`}
              </span>
              <span className="text-xs text-muted-foreground">HT</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <Suspense fallback={<QuoteTableSkeleton />}>
          <QuoteTable
            handleNewQuote={handleNewQuote}
            quoteIdToOpen={quoteIdToOpen}
          />
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
                Gérez vos devis et suivez vos propositions
              </p>
            </div>
            <div className="flex gap-2">
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
        </div>

        {/* Table */}
        <Suspense fallback={<QuoteTableSkeleton />}>
          <QuoteTable quoteIdToOpen={quoteIdToOpen} />
        </Suspense>

        {/* Bouton flottant mobile avec protection RBAC */}
        <PermissionButton
          resource="quotes"
          action="create"
          onClick={handleNewQuote}
          className="fixed bottom-6 bg-[#5a50ff] right-6 h-14 w-14 rounded-full shadow-lg z-50 md:hidden"
          size="icon"
          hideIfNoAccess={true}
          tooltipNoAccess="Vous n'avez pas la permission de créer des devis"
        >
          <Plus className="h-6 w-6" />
        </PermissionButton>
      </div>

      {/* Modal des paramètres */}
      <QuoteSettingsModal
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />

      {/* Modal d'envoi par email pour les nouveaux devis */}
      {newQuoteData && (
        <SendDocumentModal
          open={showSendEmailModal}
          onOpenChange={setShowSendEmailModal}
          documentId={newQuoteData.id}
          documentType="quote"
          documentNumber={newQuoteData.number}
          clientName={newQuoteData.clientName}
          clientEmail={newQuoteData.clientEmail}
          totalAmount={newQuoteData.totalAmount}
          companyName={newQuoteData.companyName}
          issueDate={newQuoteData.issueDate}
          onSent={() => setShowSendEmailModal(false)}
          onClose={() => setShowSendEmailModal(false)}
        />
      )}
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
