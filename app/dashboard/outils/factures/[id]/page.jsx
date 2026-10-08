"use client";

import { Suspense } from "react";
import { ArrowLeft, Send, MoreHorizontal } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  InvoiceEditorSkeleton,
  InvoiceDetailsSkeleton,
} from "../components/invoice-editor-skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import ModernInvoiceEditor from "../components/modern-invoice-editor";
import { useRouter, useParams } from "next/navigation";
import { useInvoice } from "@/src/graphql/invoiceQueries";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { CompanyInfoGuard } from "@/src/components/company-info-guard";
import { useOrganizationChange } from "@/src/hooks/useOrganizationChange";
import { ResourceNotFound } from "@/src/components/resource-not-found";
import { useMyPermissions } from "@/src/hooks/useMyPermissions";

function InvoiceDetailsContent() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id;

  const { invoice, loading, error } = useInvoice(invoiceId);
  // Droits du rôle (tout autorisé tant que la grille n'est pas chargée)
  const { canWrite, canDelete, isReady } = useMyPermissions();
  const canEditInvoices = !isReady || canWrite("invoices");
  const canDeleteInvoices = !isReady || canDelete("invoices");

  const handleBack = () => {
    router.push("/dashboard/outils/factures");
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {invoice.number || "Brouillon"}
            </h1>
            <p className="text-muted-foreground">
              {invoice.client?.name || "Client non défini"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isDraft && canEditInvoices && (
            <Button variant="outline" className="gap-2">
              <Send className="h-4 w-4" />
              Envoyer
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled={!canEditInvoices}>
                Dupliquer
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!canEditInvoices}>
                Convertir en devis
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isDraft && canDeleteInvoices && (
                <DropdownMenuItem className="text-destructive">
                  Supprimer
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Editor */}
      <Suspense fallback={<InvoiceEditorSkeleton />}>
        <ModernInvoiceEditor
          mode={canEdit ? "edit" : "view"}
          invoiceId={invoiceId}
          initialData={invoice}
        />
      </Suspense>
    </div>
  );
}

export default function InvoiceDetailsPage() {
  return (
    <ProRouteGuard
      pageName="Détails facture"
      fallback={<InvoiceDetailsSkeleton />}
    >
      <CompanyInfoGuard fallback={<InvoiceDetailsSkeleton />}>
        <InvoiceDetailsContent />
      </CompanyInfoGuard>
    </ProRouteGuard>
  );
}
