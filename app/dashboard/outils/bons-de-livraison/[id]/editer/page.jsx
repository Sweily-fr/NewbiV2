"use client";

import { useParams } from "next/navigation";
import ModernDeliveryNoteEditor from "../../components/modern-delivery-note-editor";
import { DeliveryNoteEditorSkeleton } from "../../components/delivery-note-editor-skeleton";
import { ProRouteGuard } from "@/src/components/pro-route-guard";

function EditDeliveryNoteContent() {
  const params = useParams();
  return <ModernDeliveryNoteEditor mode="edit" deliveryNoteId={params.id} />;
}

export default function EditDeliveryNotePage() {
  return (
    <ProRouteGuard
      pageName="Modifier bon de livraison"
      fallback={<DeliveryNoteEditorSkeleton />}
    >
      <EditDeliveryNoteContent />
    </ProRouteGuard>
  );
}
