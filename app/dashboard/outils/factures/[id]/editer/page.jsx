"use client";

import { Suspense } from "react";
import { use } from "react";
import ModernInvoiceEditor from "../../components/modern-invoice-editor";
import { InvoiceEditorSkeleton } from "../../components/invoice-editor-skeleton";
import { ProRouteGuard } from "@/src/components/pro-route-guard";

function EditInvoiceContent({ params }) {
  const { id } = use(params);

  return (
    <div className="h-auto flex flex-col">
      <Suspense fallback={<InvoiceEditorSkeleton />}>
        <ModernInvoiceEditor mode="edit" invoiceId={id} />
      </Suspense>
    </div>
  );
}

export default function EditInvoicePage({ params }) {
  return (
    <ProRouteGuard
      pageName="Éditer facture"
      fallback={<InvoiceEditorSkeleton />}
    >
      <EditInvoiceContent params={params} />
    </ProRouteGuard>
  );
}
