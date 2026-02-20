"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/src/lib/utils";
import { ClipboardList, Plus } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import QuoteSidebar from "@/app/dashboard/outils/devis/components/quote-sidebar";
import {
  QUOTE_STATUS_LABELS,
  QUOTE_STATUS_COLORS,
} from "@/src/graphql/quoteQueries";
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

export default function ClientQuotesTab({ quotes = [], clientId }) {
  const router = useRouter();
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const clientQuotes = useMemo(
    () =>
      quotes
        .filter((q) => q.client?.id === clientId)
        .sort((a, b) => {
          const dateA = new Date(a.issueDate || a.createdAt || 0);
          const dateB = new Date(b.issueDate || b.createdAt || 0);
          if (isNaN(dateA.getTime())) return 1;
          if (isNaN(dateB.getTime())) return -1;
          return dateB - dateA;
        }),
    [quotes, clientId]
  );

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount || 0);

  const getStatusBadge = (status) => {
    const label = QUOTE_STATUS_LABELS[status] || status;
    const colors = QUOTE_STATUS_COLORS[status] || "";
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

  if (clientQuotes.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <Empty>
          <EmptyMedia variant="icon">
            <ClipboardList />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>Aucun devis</EmptyTitle>
            <EmptyDescription>
              Ce client n'a pas encore de devis.
            </EmptyDescription>
          </EmptyHeader>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push(`/dashboard/outils/devis/new?clientId=${clientId}`)}
          >
            <Plus className="h-3.5 w-3.5" />
            Nouveau devis
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3">
        <h3 className="text-base font-medium text-[#242529] dark:text-foreground">Devis</h3>
        <Button
          variant="outline"
          onClick={() => router.push(`/dashboard/outils/devis/new?clientId=${clientId}`)}
        >
          <Plus className="h-3.5 w-3.5" />
          Nouveau devis
        </Button>
      </div>

      <div className="overflow-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#FBFBFB] dark:bg-[#1a1a1a]">
              <th className="text-left text-xs font-medium text-[#505154] dark:text-muted-foreground py-2.5 px-4">
                N° Devis
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
            {clientQuotes.map((quote) => (
              <tr
                key={quote.id}
                className="border-b border-[#f0f0f0] dark:border-[#232323] hover:bg-[#FBFBFB] dark:bg-[#1a1a1a] cursor-pointer transition-colors"
                onClick={() => {
                  setSelectedQuote(quote);
                  setIsSidebarOpen(true);
                }}
              >
                <td className="py-3.5 px-4 text-sm font-medium text-[#242529] dark:text-foreground">
                  {quote.prefix}
                  {quote.number}
                </td>
                <td className="py-3.5 px-4 text-sm text-[#242529] dark:text-foreground">
                  {safeFormatDate(quote.issueDate)}
                </td>
                <td className="py-3.5 px-4">{getStatusBadge(quote.status)}</td>
                <td className="py-3.5 px-4 text-sm text-right font-medium text-[#242529] dark:text-foreground">
                  {formatCurrency(quote.finalTotalTTC || quote.totalTTC)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <QuoteSidebar
        quote={selectedQuote}
        isOpen={isSidebarOpen}
        onClose={() => {
          setIsSidebarOpen(false);
          setSelectedQuote(null);
        }}
      />
    </>
  );
}
