"use client";

import { Suspense } from "react";
import ModernInvoiceEditor from "../components/modern-invoice-editor";
import { InvoiceEditorSkeleton } from "../components/invoice-editor-skeleton";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { CompanyInfoGuard } from "@/src/components/company-info-guard";
import { RBACRouteGuard } from "@/src/components/rbac";

function NewInvoiceContent() {
  return (
    <Suspense fallback={<InvoiceEditorSkeleton />}>
      <ModernInvoiceEditor mode="create" />
    </Suspense>
  );
}

export default function NewInvoicePage() {
  return (
    <ProRouteGuard
      pageName="Nouvelle facture"
      fallback={<InvoiceEditorSkeleton />}
    >
      <CompanyInfoGuard fallback={<InvoiceEditorSkeleton />}>
        {/* Protection RBAC : Seuls ceux qui peuvent créer des factures peuvent accéder */}
        <RBACRouteGuard
          resource="invoices"
          action="create"
          fallbackUrl="/dashboard/outils/factures"
          toastMessage="Vous n'avez pas la permission de créer des factures"
          loadingComponent={<InvoiceEditorSkeleton />}
        >
          <NewInvoiceContent />
        </RBACRouteGuard>
      </CompanyInfoGuard>
    </ProRouteGuard>
  );
}
