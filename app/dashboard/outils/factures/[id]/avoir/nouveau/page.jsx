"use client";

import { useParams } from "next/navigation";
import ModernCreditNoteEditor from "../../../components/modern-credit-note-editor";

export default function NewCreditNotePage() {
  const params = useParams();
  const invoiceId = params.id;

  return (
    <ModernCreditNoteEditor
      mode="create"
      invoiceId={invoiceId}
    />
  );
}
