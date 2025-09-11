"use client";

import { useParams } from "next/navigation";
import ModernCreditNoteEditor from "../../../components/modern-credit-note-editor";

export default function CreditNotePage() {
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
