"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Diamond } from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);

function getInitials(name) {
  if (!name) return "??";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function parseDate(value) {
  if (!value) return null;
  // Handle numeric timestamps (epoch ms as string or number)
  const num = Number(value);
  if (!isNaN(num) && num > 0) {
    // If it looks like seconds (< year 2100 in ms), convert to ms
    const d = new Date(num < 1e12 ? num * 1000 : num);
    return isNaN(d.getTime()) ? null : d;
  }
  // Handle ISO strings or other date strings
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function getDueLabel(dueDate) {
  if (!dueDate) return { label: "Aucune échéance", overdue: false };

  const due = parseDate(dueDate);
  if (!due) return { label: "Aucune échéance", overdue: false };

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    if (absDays === 1) {
      return { label: "Échéance dépassée depuis hier", overdue: true, overduePart: "hier" };
    }
    return {
      label: `Échéance dépassée il y a ${absDays} jours`,
      overdue: true,
      overduePart: `il y a ${absDays} jours`,
    };
  }

  if (diffDays === 0) {
    return { label: "Échéance aujourd'hui", overdue: false };
  }
  if (diffDays === 1) {
    return { label: "Échéance demain", overdue: false };
  }
  return { label: `Échéance dans ${diffDays} jours`, overdue: false };
}

export function InvoicesToCollectCard({ className, invoices = [], isLoading }) {
  const clientGroups = useMemo(() => {
    // Filter invoices that are pending (PENDING status only, not DRAFT/COMPLETED/CANCELED)
    const pendingInvoices = invoices.filter(
      (inv) => inv.status === "PENDING"
    );

    // Group by client
    const groupMap = new Map();
    for (const inv of pendingInvoices) {
      const clientId = inv.client?.id || "unknown";
      if (!groupMap.has(clientId)) {
        groupMap.set(clientId, {
          clientId,
          clientName: inv.client?.name || inv.client?.email || "Client inconnu",
          invoices: [],
          totalAmount: 0,
          earliestDueDate: null,
        });
      }
      const group = groupMap.get(clientId);
      group.invoices.push(inv);
      group.totalAmount += inv.finalTotalTTC || 0;

      // Track earliest due date
      if (inv.dueDate) {
        const d = parseDate(inv.dueDate);
        if (d && (!group.earliestDueDate || d < group.earliestDueDate)) {
          group.earliestDueDate = d;
        }
      }
    }

    // Convert to array and compute display data
    const groups = Array.from(groupMap.values()).map((group) => {
      const dueInfo = getDueLabel(group.earliestDueDate);
      return {
        clientId: group.clientId,
        name: group.clientName,
        initials: getInitials(group.clientName),
        amount: group.totalAmount,
        invoiceCount: group.invoices.length,
        overdue: dueInfo.overdue,
        dueLabel: dueInfo.label,
        overduePart: dueInfo.overduePart,
        earliestDueDate: group.earliestDueDate,
      };
    });

    // Sort: overdue first, then by closest due date
    groups.sort((a, b) => {
      if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
      const dateA = a.earliestDueDate?.getTime() || Infinity;
      const dateB = b.earliestDueDate?.getTime() || Infinity;
      return dateA - dateB;
    });

    return groups;
  }, [invoices]);

  const total = clientGroups.reduce((sum, c) => sum + c.amount, 0);
  const clientCount = clientGroups.length;

  if (isLoading) {
    return (
      <Card className={`${className || ""} flex flex-col min-h-[360px]`}>
        <CardHeader>
          <CardTitle className="text-base font-normal">
            Factures à encaisser
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-8 w-32" />
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col flex-1">
          <div className="space-y-4 flex-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className || ""} flex flex-col min-h-[360px]`}>
      <CardHeader>
        <CardTitle className="text-base font-normal">
          Factures à encaisser
        </CardTitle>
        <CardDescription>
          <span className="text-2xl font-medium text-foreground">
            {formatCurrency(total)}
          </span>
          {clientCount > 0 && (
            <span className="text-sm text-muted-foreground ml-2">
              {clientCount} client{clientCount > 1 ? "s" : ""}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-1">
        {clientGroups.length === 0 ? (
          <div className="flex items-center justify-center flex-1">
            <p className="text-sm text-muted-foreground">
              Aucune facture en attente
            </p>
          </div>
        ) : (
          <div className="space-y-4 flex-1">
            {clientGroups.map((client) => (
              <div
                key={client.clientId}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100">
                    <span className="text-xs font-medium text-gray-500">
                      {client.initials}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-normal truncate max-w-[180px]">
                      {client.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {client.overdue ? (
                        <>
                          {"Échéance dépassée "}
                          <span className="text-red-500">
                            {client.overduePart}
                          </span>
                          {" "}
                          <Diamond className="inline h-2 w-2 text-red-500 fill-red-500" />
                        </>
                      ) : (
                        client.dueLabel
                      )}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-sm font-medium">
                    {formatCurrency(client.amount)}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {client.invoiceCount} facture{client.invoiceCount > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
