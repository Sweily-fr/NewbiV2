"use client";

import { Suspense } from "react";
import ModernDeliveryNoteEditor from "../components/modern-delivery-note-editor";
import { DeliveryNoteEditorSkeleton } from "../components/delivery-note-editor-skeleton";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { CompanyInfoGuard } from "@/src/components/company-info-guard";
import { RBACRouteGuard } from "@/src/components/rbac";
import { DeliveryNotesAccessGuard } from "../components/delivery-notes-access-guard";

function NewDeliveryNoteContent() {
  return (
    <Suspense fallback={<DeliveryNoteEditorSkeleton />}>
      <ModernDeliveryNoteEditor mode="create" />
    </Suspense>
  );
}

export default function NewDeliveryNotePage() {
  return (
    <ProRouteGuard
      pageName="Nouveau bon de livraison"
      fallback={<DeliveryNoteEditorSkeleton />}
    >
      <DeliveryNotesAccessGuard fallback={<DeliveryNoteEditorSkeleton />}>
        <CompanyInfoGuard fallback={<DeliveryNoteEditorSkeleton />}>
          <RBACRouteGuard
            resource="deliveryNotes"
            action="create"
            fallbackUrl="/dashboard/outils/bons-de-livraison"
            toastMessage="Vous n'avez pas la permission de créer des bons de livraison"
            loadingComponent={<DeliveryNoteEditorSkeleton />}
          >
            <NewDeliveryNoteContent />
          </RBACRouteGuard>
        </CompanyInfoGuard>
      </DeliveryNotesAccessGuard>
    </ProRouteGuard>
  );
}
