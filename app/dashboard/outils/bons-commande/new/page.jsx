"use client";

import { Suspense } from "react";
import ModernPurchaseOrderEditor from "../components/modern-purchase-order-editor";
import { PurchaseOrderEditorSkeleton } from "../components/purchase-order-editor-skeleton";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { CompanyInfoGuard } from "@/src/components/company-info-guard";
import { RBACRouteGuard } from "@/src/components/rbac";

function NewPurchaseOrderContent() {
  return (
    <Suspense fallback={<PurchaseOrderEditorSkeleton />}>
      <ModernPurchaseOrderEditor mode="create" />
    </Suspense>
  );
}

export default function NewPurchaseOrderPage() {
  return (
    <ProRouteGuard
      pageName="Nouveau bon de commande"
      fallback={<PurchaseOrderEditorSkeleton />}
    >
      <CompanyInfoGuard fallback={<PurchaseOrderEditorSkeleton />}>
        <RBACRouteGuard
          resource="purchaseOrders"
          action="create"
          fallbackUrl="/dashboard/outils/bons-commande"
          toastMessage="Vous n'avez pas la permission de créer des bons de commande"
          loadingComponent={<PurchaseOrderEditorSkeleton />}
        >
          <NewPurchaseOrderContent />
        </RBACRouteGuard>
      </CompanyInfoGuard>
    </ProRouteGuard>
  );
}
