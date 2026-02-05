"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { Button } from "@/src/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/src/components/ui/button-group";
import { PermissionButton } from "@/src/components/rbac";
import {
  Plus,
  Settings,
  MailCheck,
  Bell,
  ArrowRightFromLine,
  Download,
  Info,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { Skeleton } from "@/src/components/ui/skeleton";
import InvoiceTable from "./components/invoice-table";
import { InvoiceSettingsModal } from "./components/invoice-settings-modal";
import { AutoReminderModal } from "./components/auto-reminder-modal";
import InvoiceExportButton from "./components/invoice-export-button";
import { useRouter, useSearchParams } from "next/navigation";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { CompanyInfoGuard } from "@/src/components/company-info-guard";
import { useInvoices, INVOICE_STATUS } from "@/src/graphql/invoiceQueries";
import { useToastManager } from "@/src/components/ui/toast-manager";
import { SendDocumentModal } from "./components/send-document-modal";

function InvoicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAutoReminderOpen, setIsAutoReminderOpen] = useState(false);
  const [invoiceIdToOpen, setInvoiceIdToOpen] = useState(null);

  // Refs pour déclencher les actions depuis le header
  const [triggerImport, setTriggerImport] = useState(false);

  // Toast manager et modal d'envoi pour les nouvelles factures/avoirs
  const toastManager = useToastManager();
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [newDocumentData, setNewDocumentData] = useState(null);
  const [documentType, setDocumentType] = useState("invoice");

  // Vérifier si une nouvelle facture ou un nouvel avoir vient d'être créé
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Vérifier les factures
      const invoiceData = sessionStorage.getItem("newInvoiceData");
      if (invoiceData) {
        try {
          const data = JSON.parse(invoiceData);
          setNewDocumentData(data);
          setDocumentType("invoice");
          
          toastManager.add({
            type: "document",
            title: "Facture créée avec succès",
            description: `Facture ${data.number} créée`,
            timeout: 10000,
            actionProps: data.clientEmail ? {
              children: "Envoyer au client",
              onClick: () => setShowSendEmailModal(true),
            } : undefined,
          });
          
          sessionStorage.removeItem("newInvoiceData");
        } catch (e) {
          sessionStorage.removeItem("newInvoiceData");
        }
        return;
      }

      // Vérifier les avoirs
      const creditNoteData = sessionStorage.getItem("newCreditNoteData");
      if (creditNoteData) {
        try {
          const data = JSON.parse(creditNoteData);
          setNewDocumentData(data);
          setDocumentType("creditNote");
          
          toastManager.add({
            type: "document",
            title: "Avoir créé avec succès",
            description: `Avoir ${data.number} créé`,
            timeout: 10000,
            actionProps: data.clientEmail ? {
              children: "Envoyer au client",
              onClick: () => setShowSendEmailModal(true),
            } : undefined,
          });
          
          sessionStorage.removeItem("newCreditNoteData");
        } catch (e) {
          sessionStorage.removeItem("newCreditNoteData");
        }
      }
    }
  }, [toastManager]);

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setInvoiceIdToOpen(id);
      // Nettoyer l'URL après avoir récupéré l'ID
      router.replace("/dashboard/outils/factures", { scroll: false });
    }
  }, [searchParams, router]);

  const handleNewInvoice = () => {
    router.push("/dashboard/outils/factures/new");
  };

  // Récupérer les factures pour les stats
  const { invoices, loading: invoicesLoading } = useInvoices();

  // Calculer les statistiques
  const invoiceStats = useMemo(() => {
    if (!invoices || invoices.length === 0) {
      return {
        totalBilled: 0,
        totalPaid: 0,
        overdueAmount: 0,
        overdueCount: 0,
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalBilled = 0;
    let totalPaid = 0;
    let overdueAmount = 0;
    let overdueCount = 0;

    invoices.forEach((invoice) => {
      // Utiliser finalTotalHT (après remises) ou totalHT si non disponible
      const invoiceAmount = invoice.finalTotalHT ?? invoice.totalHT ?? 0;
      
      // Exclure les brouillons du CA facturé
      if (invoice.status !== INVOICE_STATUS.DRAFT) {
        totalBilled += invoiceAmount;
      }

      // CA payé = factures terminées
      if (invoice.status === INVOICE_STATUS.COMPLETED) {
        totalPaid += invoiceAmount;
      }

      // Factures en retard = en attente + date d'échéance dépassée
      if (invoice.status === INVOICE_STATUS.PENDING && invoice.dueDate) {
        // dueDate peut être un timestamp en string ou un format ISO
        const dueDateValue = typeof invoice.dueDate === 'string' && /^\d+$/.test(invoice.dueDate)
          ? parseInt(invoice.dueDate, 10)
          : invoice.dueDate;
        const dueDate = new Date(dueDateValue);
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate < today) {
          overdueAmount += invoiceAmount;
          overdueCount++;
        }
      }
    });

    return {
      totalBilled,
      totalPaid,
      overdueAmount,
      overdueCount,
    };
  }, [invoices]);

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
            <h1 className="text-2xl font-medium mb-2">Factures clients</h1>
            {/* <p className="text-muted-foreground text-sm">
              Gérez vos factures et suivez vos paiements
            </p> */}
          </div>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => setTriggerImport(true)}
                  >
                    <Download className="h-4 w-4" strokeWidth={1.5} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-[#202020] text-white border-0"
                >
                  <p>Importer des factures</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <InvoiceExportButton invoices={invoices} iconOnly />
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-[#202020] text-white border-0"
                >
                  <p>Exporter des factures</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => setIsAutoReminderOpen(true)}
                  >
                    <MailCheck className="h-4 w-4" strokeWidth={1.5} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-[#202020] text-white border-0"
                >
                  <p>Relance automatique</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
                onClick={handleNewInvoice}
                className="cursor-pointer font-normal bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                Nouvelle facture
              </Button>
              <ButtonGroupSeparator />
              <Button
                onClick={handleNewInvoice}
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
          {/* CA facturé + CA payé */}
          <div className="bg-background border rounded-lg px-4 py-3 flex items-center gap-0">
            {/* CA facturé */}
            <div className="pr-4">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs text-muted-foreground">
                  CA facturé
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className="bg-[#202020] text-white border-0"
                    >
                      <p>Total des factures émises (hors brouillons)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-medium tracking-tight">
                  {invoicesLoading
                    ? "..."
                    : `${formatAmount(invoiceStats.totalBilled)} €`}
                </span>
                <span className="text-xs text-muted-foreground">HT</span>
              </div>
            </div>

            {/* Separator */}
            <div className="w-px h-10 bg-border mx-4" />

            {/* CA payé */}
            <div className="pl-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs text-muted-foreground">CA payé</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className="bg-[#202020] text-white border-0"
                    >
                      <p>Total des factures payées</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-medium tracking-tight">
                  {invoicesLoading
                    ? "..."
                    : `${formatAmount(invoiceStats.totalPaid)} €`}
                </span>
                <span className="text-xs text-muted-foreground">HT</span>
              </div>
            </div>
          </div>

          {/* Factures en retard */}
          <div className="bg-background border rounded-lg px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs text-muted-foreground">
                Factures en retard
              </span>
              {invoiceStats.overdueCount > 0 && (
                <span className="h-4 w-4 flex items-center justify-center rounded-full bg-red-100 text-red-500 text-[10px] font-medium">
                  {invoiceStats.overdueCount}
                </span>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="bg-[#202020] text-white border-0"
                  >
                    <p>Factures dont la date d'échéance est dépassée</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-medium tracking-tight">
                {invoicesLoading
                  ? "..."
                  : `${formatAmount(invoiceStats.overdueAmount)} €`}
              </span>
              <span className="text-xs text-muted-foreground">HT</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <Suspense fallback={<InvoiceTableSkeleton />}>
          <InvoiceTable
            handleNewInvoice={handleNewInvoice}
            invoiceIdToOpen={invoiceIdToOpen}
            onOpenReminderSettings={() => setIsAutoReminderOpen(true)}
            triggerImport={triggerImport}
            onImportTriggered={() => setTriggerImport(false)}
          />
        </Suspense>
      </div>

      {/* Mobile Layout - Style Notion */}
      <div className="md:hidden">
        {/* Header - Style Notion sur mobile */}
        <div className="px-4 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-medium mb-2">Factures</h1>
              <p className="text-muted-foreground text-sm">
                Gérez vos factures et suivez vos paiements
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAutoReminderOpen(true)}
                className="gap-2"
              >
                <Bell className="h-4 w-4" />
              </Button>
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
        <Suspense fallback={<InvoiceTableSkeleton />}>
          <InvoiceTable
            invoiceIdToOpen={invoiceIdToOpen}
            onOpenReminderSettings={() => setIsAutoReminderOpen(true)}
          />
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

      {/* Modal des paramètres */}
      <InvoiceSettingsModal
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />

      {/* Modal des relances automatiques */}
      <AutoReminderModal
        open={isAutoReminderOpen}
        onOpenChange={setIsAutoReminderOpen}
      />

      {/* Modal d'envoi par email pour les nouvelles factures/avoirs */}
      {newDocumentData && (
        <SendDocumentModal
          open={showSendEmailModal}
          onOpenChange={setShowSendEmailModal}
          documentId={newDocumentData.id}
          documentType={documentType}
          documentNumber={newDocumentData.number}
          clientName={newDocumentData.clientName}
          clientEmail={newDocumentData.clientEmail}
          totalAmount={newDocumentData.totalAmount}
          companyName={newDocumentData.companyName}
          issueDate={newDocumentData.issueDate}
          dueDate={newDocumentData.dueDate}
          invoiceNumber={newDocumentData.invoiceNumber}
          onSent={() => setShowSendEmailModal(false)}
          onClose={() => setShowSendEmailModal(false)}
        />
      )}
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
