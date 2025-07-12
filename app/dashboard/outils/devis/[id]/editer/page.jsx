"use client";

import { useParams } from "next/navigation";
import ModernQuoteEditor from "../../components/modern-quote-editor";

export default function EditQuotePage() {
  const params = useParams();
  const quoteId = params.id;

  return (
    <ModernQuoteEditor 
      mode="edit" 
      quoteId={quoteId}
    />
  );
}
