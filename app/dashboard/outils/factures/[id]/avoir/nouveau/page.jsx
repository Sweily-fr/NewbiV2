"use client";

import { useParams } from "next/navigation";
import ModernCreditNoteEditor from "../../../components/modern-credit-note-editor";
import { ProRouteGuard } from "@/src/components/pro-route-guard";

function NewCreditNoteContent() {
  const params = useParams();
  const invoiceId = params.id;

  return (
    <ModernCreditNoteEditor
      mode="create"
      invoiceId={invoiceId}
    />
  );
}

export default function NewCreditNotePage() {
  return (
    <ProRouteGuard pageName="Nouvel avoir">
      <NewCreditNoteContent />
    </ProRouteGuard>
  );
}
