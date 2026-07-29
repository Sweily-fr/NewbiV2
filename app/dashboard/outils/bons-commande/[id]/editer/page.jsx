"use client";

import { useParams } from "next/navigation";
import ModernPurchaseOrderEditor from "../../components/modern-purchase-order-editor";
import { PurchaseOrderEditorSkeleton } from "../../components/purchase-order-editor-skeleton";
import { ProRouteGuard } from "@/src/components/pro-route-guard";

function EditPurchaseOrderContent() {
  const params = useParams();
  const purchaseOrderId = params.id;

  return (
    <ModernPurchaseOrderEditor mode="edit" purchaseOrderId={purchaseOrderId} />
  );
}

export default function EditPurchaseOrderPage() {
  return (
    <ProRouteGuard
      pageName="Modifier bon de commande"
      fallback={<PurchaseOrderEditorSkeleton />}
    >
      <EditPurchaseOrderContent />
    </ProRouteGuard>
  );
}
