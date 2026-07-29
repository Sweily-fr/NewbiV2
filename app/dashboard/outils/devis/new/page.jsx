"use client";

import { Suspense } from "react";
import ModernQuoteEditor from "../components/modern-quote-editor";
import { QuoteEditorSkeleton } from "../components/quote-editor-skeleton";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { CompanyInfoGuard } from "@/src/components/company-info-guard";
import { RBACRouteGuard } from "@/src/components/rbac";

function NewQuoteContent() {
  return (
    <Suspense fallback={<QuoteEditorSkeleton />}>
      <ModernQuoteEditor mode="create" />
    </Suspense>
  );
}

export default function NewQuotePage() {
  return (
    <ProRouteGuard pageName="Nouveau devis" fallback={<QuoteEditorSkeleton />}>
      <CompanyInfoGuard fallback={<QuoteEditorSkeleton />}>
        {/* Protection RBAC : Seuls ceux qui peuvent créer des devis peuvent accéder */}
        <RBACRouteGuard
          resource="quotes"
          action="create"
          fallbackUrl="/dashboard/outils/devis"
          toastMessage="Vous n'avez pas la permission de créer des devis"
          loadingComponent={<QuoteEditorSkeleton />}
        >
          <NewQuoteContent />
        </RBACRouteGuard>
      </CompanyInfoGuard>
    </ProRouteGuard>
  );
}
