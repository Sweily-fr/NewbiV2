"use client";

import { useParams } from "next/navigation";
import ModernQuoteEditor from "../../components/modern-quote-editor";
import { ProRouteGuard } from "@/src/components/pro-route-guard";

function EditQuoteContent() {
  const params = useParams();
  const quoteId = params.id;

  return (
    <ModernQuoteEditor 
      mode="edit" 
      quoteId={quoteId}
    />
  );
}

export default function EditQuotePage() {
  return (
    <ProRouteGuard pageName="Éditer devis">
      <EditQuoteContent />
    </ProRouteGuard>
  );
}
