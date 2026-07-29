"use client";

import { useParams } from "next/navigation";
import ModernCreditNoteEditor from "../../../components/modern-credit-note-editor";
import { InvoiceEditorSkeleton } from "../../../components/invoice-editor-skeleton";
import { ProRouteGuard } from "@/src/components/pro-route-guard";

function CreditNoteContent() {
  const params = useParams();
  const invoiceId = params.id;
  const creditNoteId = params.creditNoteId;

  return (
    <ModernCreditNoteEditor
      mode="edit"
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
