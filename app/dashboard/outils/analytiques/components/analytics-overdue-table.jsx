"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { cn } from "@/src/lib/utils";

const formatCurrency = (value) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function getSeverity(daysOverdue) {
  if (daysOverdue > 90) return { label: "Critique", class: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" };
  if (daysOverdue > 60) return { label: "Grave", class: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" };
  if (daysOverdue > 30) return { label: "Modéré", class: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" };
  return { label: "Récent", class: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" };
}

export function AnalyticsOverdueTable({ overdueInvoices, loading }) {
  if (loading) {
    return (
      <div className="px-4 sm:px-6">
        <Card className="shadow-xs flex flex-col min-h-0 py-4">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Factures en retard</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 overflow-visible flex-1">
            <Skeleton className="min-h-[120px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!overdueInvoices?.length) {
    return (
      <div className="px-4 sm:px-6">
        <Card className="shadow-xs flex flex-col min-h-0 py-4">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Factures en retard</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 flex items-center justify-center flex-1 min-h-[120px] text-muted-foreground">
            Aucune facture en retard
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.totalTTC, 0);

  return (
    <div className="px-4 sm:px-6">
      <Card className="shadow-xs flex flex-col min-h-0 py-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Factures en retard</CardTitle>
          <span className="text-xs text-muted-foreground">
            {overdueInvoices.length} facture{overdueInvoices.length > 1 ? "s" : ""} — {formatCurrency(totalOverdue)}
          </span>
        </CardHeader>
        <CardContent className="px-0 pt-4 pb-0">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Facture</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Montant TTC</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead className="text-right">Retard</TableHead>
                <TableHead className="pr-6">Sévérité</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overdueInvoices.map((inv) => {
                const severity = getSeverity(inv.daysOverdue);
                return (
                  <TableRow key={inv.invoiceId}>
                    <TableCell className="font-medium pl-6">{inv.invoiceNumber}</TableCell>
                    <TableCell>{inv.clientName}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(inv.totalTTC)}</TableCell>
                    <TableCell>{formatDate(inv.dueDate)}</TableCell>
                    <TableCell className="text-right">{inv.daysOverdue}j</TableCell>
                    <TableCell className="pr-6">
                      <Badge variant="secondary" className={cn("text-xs", severity.class)}>
                        {severity.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
