"use client";
import ModernQuoteEditor from "../components/modern-quote-editor";
import { CompanyInfoGuard } from "@/src/components/guards/CompanyInfoGuard";

export default function NewFacture() {
  return (
    <CompanyInfoGuard>
      <ModernQuoteEditor mode="create" />
    </CompanyInfoGuard>
  );
}
