"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/src/lib/utils";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import InvoiceSidebar from "@/app/dashboard/outils/factures/components/invoice-sidebar";
import {
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
} from "@/src/graphql/invoiceQueries";
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

export default function ClientInvoicesTab({ invoices = [], clientId }) {
  const router = useRouter();
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const clientInvoices = useMemo(
    () =>
      invoices
        .filter((inv) => inv.client?.id === clientId)
        .sort((a, b) => {
          const dateA = new Date(a.issueDate || a.createdAt || 0);
          const dateB = new Date(b.issueDate || b.createdAt || 0);
          if (isNaN(dateA.getTime())) return 1;
          if (isNaN(dateB.getTime())) return -1;
          return dateB - dateA;
        }),
    [invoices, clientId]
  );

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount || 0);

  const getStatusBadge = (status) => {
    const label = INVOICE_STATUS_LABELS[status] || status;
    const colors = INVOICE_STATUS_COLORS[status] || "";
    return (
      <span
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
          colors
        )}
      >
        {label}
      </span>
    );
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
            size="sm"
            className="gap-2 cursor-pointer font-normal mt-4"
            onClick={() => router.push(`/dashboard/outils/factures/new?clientId=${clientId}`)}
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
        <h3 className="text-base font-medium text-[#242529] dark:text-foreground">Factures</h3>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 cursor-pointer font-normal"
          onClick={() => router.push(`/dashboard/outils/factures/new?clientId=${clientId}`)}
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
                Statut
              </th>
              <th className="text-right text-xs font-medium text-[#505154] dark:text-muted-foreground py-2.5 px-4">
                Montant TTC
              </th>
            </tr>
          </thead>
          <tbody>
            {clientInvoices.map((invoice) => (
              <tr
                key={invoice.id}
                className="border-b border-[#f0f0f0] dark:border-[#232323] hover:bg-[#FBFBFB] dark:bg-[#1a1a1a] cursor-pointer transition-colors"
                onClick={() => {
                  setSelectedInvoice(invoice);
                  setIsSidebarOpen(true);
                }}
              >
                <td className="py-3.5 px-4 text-sm font-medium text-[#242529] dark:text-foreground">
                  {invoice.prefix}
                  {invoice.number}
                </td>
                <td className="py-3.5 px-4 text-sm text-[#242529] dark:text-foreground">
                  {safeFormatDate(invoice.issueDate)}
                </td>
                <td className="py-3.5 px-4">{getStatusBadge(invoice.status)}</td>
                <td className="py-3.5 px-4 text-sm text-right font-medium text-[#242529] dark:text-foreground">
                  {formatCurrency(invoice.finalTotalTTC || invoice.totalTTC)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InvoiceSidebar
        invoice={selectedInvoice}
        isOpen={isSidebarOpen}
        onClose={() => {
          setIsSidebarOpen(false);
          setSelectedInvoice(null);
        }}
      />
    </>
  );
}
