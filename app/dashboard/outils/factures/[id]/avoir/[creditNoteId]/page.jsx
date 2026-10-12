"use client";

import { useParams } from "next/navigation";
import ModernCreditNoteEditor from "../../../components/modern-credit-note-editor";
import { InvoiceEditorSkeleton } from "../../../components/invoice-editor-skeleton";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { useMyPermissions } from "@/src/hooks/useMyPermissions";

function CreditNoteContent() {
  const params = useParams();
  const invoiceId = params.id;
  const creditNoteId = params.creditNoteId;
  // Droits du rôle (tout autorisé tant que la grille n'est pas chargée) :
  // consultation seule sans écriture sur les avoirs
  const { canWrite, isReady } = useMyPermissions();
  const canEditCreditNotes = !isReady || canWrite("creditNotes");

  return (
    <ModernCreditNoteEditor
      mode={canEditCreditNotes ? "edit" : "view"}
      creditNoteId={creditNoteId}
      invoiceId={invoiceId}
    />
  );
}

export default function CreditNotePage() {
  return (
    <ProRouteGuard pageName="Avoir" fallback={<InvoiceEditorSkeleton />}>
      <CreditNoteContent />
    </ProRouteGuard>
  );
}
