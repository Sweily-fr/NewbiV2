"use client";

import { Suspense } from "react";
import ModernPurchaseOrderEditor from "../components/modern-purchase-order-editor";
import { Skeleton } from "@/src/components/ui/skeleton";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { CompanyInfoGuard } from "@/src/components/company-info-guard";
import { RBACRouteGuard } from "@/src/components/rbac";

function NewPurchaseOrderContent() {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <ModernPurchaseOrderEditor mode="create" />
    </Suspense>
  );
}

export default function NewPurchaseOrderPage() {
  return (
    <ProRouteGuard pageName="Nouveau bon de commande">
      <CompanyInfoGuard>
        <RBACRouteGuard
          resource="purchaseOrders"
          action="create"
          fallbackUrl="/dashboard/outils/bons-commande"
          toastMessage="Vous n'avez pas la permission de créer des bons de commande"
        >
          <NewPurchaseOrderContent />
        </RBACRouteGuard>
      </CompanyInfoGuard>
    </ProRouteGuard>
  );
}

function EditorSkeleton() {
  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">
      <div className="space-y-6 p-6">
        <div className="rounded-lg border p-6">
          <Skeleton className="h-6 w-[200px] mb-4" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
        <div className="rounded-lg border p-6">
          <Skeleton className="h-6 w-[150px] mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-lg border p-6">
        <Skeleton className="h-6 w-[100px] mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  );
}
