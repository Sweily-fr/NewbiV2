"use client";

import { Suspense, useState } from "react";
import { Send, MoreHorizontal } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  InvoiceEditorSkeleton,
  InvoiceDetailsSkeleton,
} from "../components/invoice-editor-skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import ModernInvoiceEditor from "../components/modern-invoice-editor";
import { SendDocumentModal } from "../components/send-document-modal";
import { useRouter, useParams } from "next/navigation";
import { useInvoice } from "@/src/graphql/invoiceQueries";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { CompanyInfoGuard } from "@/src/components/company-info-guard";
import { useOrganizationChange } from "@/src/hooks/useOrganizationChange";
import { ResourceNotFound } from "@/src/components/resource-not-found";
import { useMyPermissions } from "@/src/hooks/useMyPermissions";
import { getNumberFormat } from "@/src/lib/intl-cache";
import { duplicateInvoiceData } from "../utils/duplicate-invoice";

/** Date d'une facture (timestamp en chaîne ou date ISO) au format français. */
const formatInvoiceDate = (value) => {
  if (!value) return null;
  const date =
    typeof value === "string" && /^\d+$/.test(value)
      ? new Date(parseInt(value, 10))
      : new Date(value);
  return isNaN(date.getTime()) ? null : date.toLocaleDateString("fr-FR");
};

function InvoiceDetailsContent() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id;
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);

  const { invoice, loading, error } = useInvoice(invoiceId);
  // Droits du rôle (tout autorisé tant que la grille n'est pas chargée)
  const { canDo, isReady } = useMyPermissions();
  const canEditInvoices = !isReady || canDo("invoices", "edit");
  const canSendInvoices = !isReady || canDo("invoices", "send");
  const canCreateInvoices = !isReady || canDo("invoices", "create");

  const handleBack = () => {
    router.push("/dashboard/outils/factures");
  };

  // « Dupliquer » : nouvelle facture pré-remplie avec le client, les
  // articles et les conditions de celle-ci (l'élément de menu n'avait
  // aucune action)
  const handleDuplicate = () => {
    sessionStorage.setItem(
      "duplicateInvoiceData",
      JSON.stringify(duplicateInvoiceData(invoice)),
    );
    router.push("/dashboard/outils/factures/new");
  };

  // Détecter les changements d'organisation et rediriger si nécessaire
  useOrganizationChange({
    resourceId: invoiceId,
    resourceExists: !!invoice && !error,
    listUrl: "/dashboard/outils/factures",
    enabled: !loading,
  });

  if (loading) {
    return <InvoiceDetailsSkeleton />;
  }

  if (error || !invoice) {
    return (
      <ResourceNotFound
        resourceType="facture"
        resourceName="Cette facture"
        listUrl="/dashboard/outils/factures"
        homeUrl="/dashboard"
      />
    );
  }

  const isDraft = invoice.status === "DRAFT";
  const canEdit = isDraft && canEditInvoices;

  // En-tête de la page (retour, « Envoyer », menu) : affiché par l'éditeur,
  // qui occupe tout l'écran
  const headerActions = (
    <>
      {!isDraft && canSendInvoices && (
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setShowSendEmailModal(true)}
        >
          <Send className="h-4 w-4" />
          Envoyer
        </Button>
      )}

      {/* Menu d'actions : masqué en lecture seule (aucune action possible) */}
      {canCreateInvoices && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleDuplicate}>
              Dupliquer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );

  return (
    <div className="space-y-6">
      {/* Editor : consulter ne demande rien, modifier un brouillon demande
          des informations d'entreprise complètes (il sera généré) */}
      {canEdit ? (
        <CompanyInfoGuard fallback={<InvoiceEditorSkeleton />}>
          <Suspense fallback={<InvoiceEditorSkeleton />}>
            <ModernInvoiceEditor
              mode="edit"
              invoiceId={invoiceId}
              initialData={invoice}
              onBack={handleBack}
              headerActions={headerActions}
            />
          </Suspense>
        </CompanyInfoGuard>
      ) : (
        <Suspense fallback={<InvoiceEditorSkeleton />}>
          <ModernInvoiceEditor
            mode="view"
            invoiceId={invoiceId}
            initialData={invoice}
            onBack={handleBack}
            headerActions={headerActions}
          />
        </Suspense>
      )}

      {/* Envoi par e-mail depuis l'en-tête (le bouton n'avait aucune action) */}
      {showSendEmailModal && (
        <SendDocumentModal
          open={showSendEmailModal}
          onOpenChange={setShowSendEmailModal}
          documentId={invoice.id}
          documentType="invoice"
          documentNumber={`${invoice.prefix || "F"}-${invoice.number}`}
          clientName={invoice.client?.name}
          clientEmail={invoice.client?.email}
          totalAmount={getNumberFormat("fr-FR", {
            style: "currency",
            currency: "EUR",
          }).format(invoice.finalTotalTTC || invoice.totalTTC || 0)}
          companyName={invoice.companyInfo?.name}
          issueDate={formatInvoiceDate(invoice.issueDate)}
          dueDate={formatInvoiceDate(invoice.dueDate)}
          onSent={() => setShowSendEmailModal(false)}
          onClose={() => setShowSendEmailModal(false)}
        />
      )}
    </div>
  );
}

export default function InvoiceDetailsPage() {
  return (
    <ProRouteGuard
      pageName="Détails facture"
      fallback={<InvoiceDetailsSkeleton />}
    >
      <InvoiceDetailsContent />
    </ProRouteGuard>
  );
}
