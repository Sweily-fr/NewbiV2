"use client";

import ModernInvoiceEditor from "./modern-invoice-editor";

export default function InvoiceEditor({ 
  mode = "create", 
  invoiceId = null, 
  initialData = null 
}) {
  return (
    <ModernInvoiceEditor
      mode={mode}
      invoiceId={invoiceId}
      initialData={initialData}
    />
  );
}
