"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/src/components/ui/table";
import { Skeleton } from "@/src/components/ui/skeleton";

const CATEGORY_LABELS = {
  OFFICE_SUPPLIES: "Fournitures",
  TRAVEL: "Déplacements",
  MEALS: "Repas",
  ACCOMMODATION: "Hébergement",
  SOFTWARE: "Logiciels",
  HARDWARE: "Matériel",
  SERVICES: "Services",
  MARKETING: "Marketing",
  TAXES: "Taxes",
  RENT: "Loyer",
  UTILITIES: "Charges",
  SALARIES: "Salaires",
  INSURANCE: "Assurance",
  MAINTENANCE: "Maintenance",
  TRAINING: "Formation",
  SUBSCRIPTIONS: "Abonnements",
  OTHER: "Autre",
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);

export function AnalyticsExpenseDetailTable({ expenseByCategory, totalExpensesHT, totalExpensesTTC, totalExpensesVAT, loading }) {
  if (loading) {
    return (
      <div className="px-4 sm:px-6">
        <h3 className="text-base font-medium mb-4">Détail des dépenses par catégorie</h3>
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (!expenseByCategory?.length) {
    return (
      <div className="px-4 sm:px-6">
        <h3 className="text-base font-medium mb-4">Détail des dépenses par catégorie</h3>
        <div className="flex items-center justify-center h-[120px] text-muted-foreground border rounded-lg">
          Aucune dépense pour cette période
        </div>
      </div>
    );
  }

  // The backend gives us TTC amounts per category. We don't have per-category HT/VAT split
  // from the current aggregation, so we display TTC and the global HT/VAT totals as summary
  const totalAmount = expenseByCategory.reduce((s, e) => s + e.amount, 0);
  const totalCount = expenseByCategory.reduce((s, e) => s + e.count, 0);

  return (
    <div className="px-4 sm:px-6">
      <h3 className="text-base font-medium mb-4">Détail des dépenses par catégorie</h3>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Catégorie</TableHead>
              <TableHead className="text-right">Nombre</TableHead>
              <TableHead className="text-right">Montant TTC</TableHead>
              <TableHead className="text-right">% du total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenseByCategory.map((e) => (
              <TableRow key={e.category}>
                <TableCell className="font-medium">
                  {CATEGORY_LABELS[e.category] || e.category}
                </TableCell>
                <TableCell className="text-right">{e.count}</TableCell>
                <TableCell className="text-right">{formatCurrency(e.amount)}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {totalAmount > 0
                    ? `${((e.amount / totalAmount) * 100).toFixed(1)}%`
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-medium">Total</TableCell>
              <TableCell className="text-right font-medium">{totalCount}</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(totalAmount)}</TableCell>
              <TableCell className="text-right font-medium">100%</TableCell>
            </TableRow>
            {totalExpensesHT != null && (
              <>
                <TableRow>
                  <TableCell colSpan={2} className="text-muted-foreground">Total HT</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(totalExpensesHT)}</TableCell>
                  <TableCell />
                </TableRow>
                <TableRow>
                  <TableCell colSpan={2} className="text-muted-foreground">TVA récupérable</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(totalExpensesTTC - totalExpensesHT)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </>
            )}
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
