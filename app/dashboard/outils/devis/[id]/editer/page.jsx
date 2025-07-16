"use client";

import { useParams } from "next/navigation";
import { CompanyInfoGuard } from "@/src/components/guards/CompanyInfoGuard";
import ModernQuoteEditor from "../../components/modern-quote-editor";

export default function EditQuotePage() {
  const params = useParams();
  const quoteId = params.id;

  return (
    <CompanyInfoGuard>
      <ModernQuoteEditor 
        mode="edit" 
        quoteId={quoteId}
      />
    </CompanyInfoGuard>
  );
}
