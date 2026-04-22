"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/src/lib/utils";
import { FileText, Plus, FileInput } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import InvoiceSidebar from "@/app/dashboard/outils/factures/components/invoice-sidebar";
import { ImportedInvoiceSidebar } from "@/app/dashboard/outils/factures/components/imported-invoice-sidebar";
import {
  INVOICE_STATUS,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
} from "@/src/graphql/invoiceQueries";
import {
  IMPORTED_INVOICE_STATUS_LABELS,
  IMPORTED_INVOICE_STATUS_COLORS,
} from "@/src/graphql/importedInvoiceQueries";
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/src/components/ui/empty";

function safeFormatDate(dateString) {
  if (!dateString) return "-";
  try {
    let parsedDate;
    if (typeof dateString === "string" && /^\d+$/.test(dateString)) {
      parsedDate = new Date(parseInt(dateString, 10));
    } else {
      parsedDate = new Date(dateString);
    }
    if (isNaN(parsedDate.getTime())) return "-";
    return parsedDate.toLocaleDateString("fr-FR");
  } catch {
    return "-";
  }
}

function getSortDate(invoice) {
  if (invoice._type === "imported") {
    return new Date(invoice.invoiceDate || invoice.createdAt || 0);
  }
  return new Date(invoice.issueDate || invoice.createdAt || 0);
}

export default function ClientInvoicesTab({
  invoices = [],
  importedInvoices = [],
  clientId,
}) {
  const router = useRouter();
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedImportedInvoice, setSelectedImportedInvoice] = useState(null);

  const clientInvoices = useMemo(() => {
    const normal = invoices
      .filter((inv) => inv.client?.id === clientId)
      .map((inv) => ({ ...inv, _type: "normal" }));
    const imported = (importedInvoices || []).map((inv) => ({
      ...inv,
      _type: "imported",
    }));
    return [...normal, ...imported].sort((a, b) => {
      const dateA = getSortDate(a);
      const dateB = getSortDate(b);
      if (isNaN(dateA.getTime())) return 1;
      if (isNaN(dateB.getTime())) return -1;
      return dateB - dateA;
    });
  }, [invoices, importedInvoices, clientId]);

  const { totalPaid, totalRemaining } = useMemo(() => {
    let paid = 0;
    let remaining = 0;
    for (const inv of clientInvoices) {
      if (inv._type === "imported") {
        const amount = inv.totalTTC ?? 0;
        if (inv.status === "COMPLETED") paid += amount;
        else if (inv.status === "VALIDATED" || inv.status === "PENDING_REVIEW")
          remaining += amount;
        continue;
      }
      const amount = inv.finalTotalTTC ?? inv.totalTTC ?? 0;
      if (inv.status === INVOICE_STATUS.COMPLETED) {
        paid += amount;
      } else if (inv.status === INVOICE_STATUS.PENDING) {
        remaining += amount;
      }
    }
    return { totalPaid: paid, totalRemaining: remaining };
  }, [clientInvoices]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount || 0);

  const getStatusBadge = (invoice) => {
    const isImported = invoice._type === "imported";
    const label = isImported
      ? IMPORTED_INVOICE_STATUS_LABELS[invoice.status] || invoice.status
      : INVOICE_STATUS_LABELS[invoice.status] || invoice.status;
    const colors = isImported
      ? IMPORTED_INVOICE_STATUS_COLORS[invoice.status] || ""
      : INVOICE_STATUS_COLORS[invoice.status] || "";
    return (
      <span
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
          colors,
        )}
      >
        {label}
      </span>
    );
  };

  const handleRowClick = (invoice) => {
    if (invoice._type === "imported") {
      setSelectedImportedInvoice(invoice);
    } else {
      setSelectedInvoice(invoice);
      setIsSidebarOpen(true);
    }
  };

  if (clientInvoices.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <Empty>
          <EmptyMedia variant="icon">
            <FileText />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>Aucune facture</EmptyTitle>
            <EmptyDescription>
              Ce client n'a pas encore de facture.
            </EmptyDescription>
          </EmptyHeader>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() =>
              router.push(`/dashboard/outils/factures/new?clientId=${clientId}`)
            }
          >
            <Plus className="h-3.5 w-3.5" />
            Nouvelle facture
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3">
        <h3 className="text-base font-medium text-[#242529] dark:text-foreground">
          Factures
        </h3>
        <Button
          variant="outline"
          onClick={() =>
            router.push(`/dashboard/outils/factures/new?clientId=${clientId}`)
          }
        >
          <Plus className="h-3.5 w-3.5" />
          Nouvelle facture
        </Button>
      </div>

      <div className="overflow-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#FBFBFB] dark:bg-[#1a1a1a]">
              <th className="text-left text-xs font-medium text-[#505154] dark:text-muted-foreground py-2.5 px-4">
                N° Facture
              </th>
              <th className="text-left text-xs font-medium text-[#505154] dark:text-muted-foreground py-2.5 px-4">
                Date d&apos;émission
              </th>
              <th className="text-left text-xs font-medium text-[#505154] dark:text-muted-foreground py-2.5 px-4">
                Date de paiement
              </th>
              <th className="text-left text-xs font-medium text-[#505154] dark:text-muted-foreground py-2.5 px-4">
                Statut
              </th>
              <th className="text-right text-xs font-medium text-[#505154] dark:text-muted-foreground py-2.5 px-4">
                Montant TTC
              </th>
            </tr>
          </thead>
          <tbody>
            {clientInvoices.map((invoice) => {
              const isImported = invoice._type === "imported";
              const number = isImported
                ? invoice.originalInvoiceNumber || "—"
                : `${invoice.prefix || ""}${invoice.number || ""}`;
              const issueDate = isImported
                ? invoice.invoiceDate
                : invoice.issueDate;
              const amount = isImported
                ? invoice.totalTTC
                : invoice.finalTotalTTC || invoice.totalTTC;
              return (
                <tr
                  key={`${invoice._type}-${invoice.id}`}
                  className="border-b border-[#f0f0f0] dark:border-[#232323] hover:bg-[#FBFBFB] dark:bg-[#1a1a1a] cursor-pointer transition-colors"
                  onClick={() => handleRowClick(invoice)}
                >
                  <td className="py-3.5 px-4 text-sm font-medium text-[#242529] dark:text-foreground">
                    <span className="inline-flex items-center gap-2">
                      {number}
                      {isImported && (
                        <span
                          title="Facture importée"
                          className="inline-flex items-center gap-1 text-[10px] font-normal text-[#505154] dark:text-muted-foreground border border-[#eeeff1] dark:border-[#232323] rounded px-1.5 py-0.5"
                        >
                          <FileInput className="h-3 w-3" />
                          Importée
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-sm text-[#242529] dark:text-foreground">
                    {safeFormatDate(issueDate)}
                  </td>
                  <td className="py-3.5 px-4 text-sm text-[#242529] dark:text-foreground">
                    {safeFormatDate(invoice.paymentDate)}
                  </td>
                  <td className="py-3.5 px-4">{getStatusBadge(invoice)}</td>
                  <td className="py-3.5 px-4 text-sm text-right font-medium text-[#242529] dark:text-foreground">
                    {formatCurrency(amount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4 px-4 sm:px-6 py-3 border-t border-[#f0f0f0] dark:border-[#232323]">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[#505154] dark:text-muted-foreground">
            Total payé
          </span>
          <span className="font-medium text-[#242529] dark:text-foreground">
            {formatCurrency(totalPaid)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[#505154] dark:text-muted-foreground">
            Total restant
          </span>
          <span className="font-medium text-[#242529] dark:text-foreground">
            {formatCurrency(totalRemaining)}
          </span>
        </div>
      </div>

      <InvoiceSidebar
        invoice={selectedInvoice}
        isOpen={isSidebarOpen}
        onClose={() => {
          setIsSidebarOpen(false);
          setSelectedInvoice(null);
        }}
      />

      <ImportedInvoiceSidebar
        invoice={selectedImportedInvoice}
        open={!!selectedImportedInvoice}
        onOpenChange={(open) => !open && setSelectedImportedInvoice(null)}
        onUpdate={() => setSelectedImportedInvoice(null)}
      />
    </>
  );
}
