"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { ExternalLink } from "lucide-react";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount || 0);

const MONTH_LABELS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

function parseDate(value) {
  if (!value) return null;
  const num = Number(value);
  if (!isNaN(num) && num > 0) {
    const d = new Date(num < 1e12 ? num * 1000 : num);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export function MonthlyRevenueCard({
  className,
  paidInvoices = [],
  isLoading,
}) {
  const router = useRouter();

  const { monthTotal, invoiceCount, monthLabel } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const label = `${MONTH_LABELS[currentMonth]} ${currentYear}`;

    let total = 0;
    let count = 0;
    for (const inv of paidInvoices || []) {
      const refDate = parseDate(inv.paymentDate) || parseDate(inv.issueDate);
      if (!refDate) continue;
      if (
        refDate.getMonth() === currentMonth &&
        refDate.getFullYear() === currentYear
      ) {
        total += inv.finalTotalTTC || 0;
        count += 1;
      }
    }

    return { monthTotal: total, invoiceCount: count, monthLabel: label };
  }, [paidInvoices]);

  if (isLoading) {
    return (
      <Card className={`${className || ""} flex flex-col py-5 gap-3`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-normal">CA mensuel</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 justify-center gap-1">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-24" />
        </CardContent>
        <CardFooter className="justify-end pt-0 pr-3">
          <Skeleton className="h-7 w-20" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className={`${className || ""} flex flex-col py-5 gap-3`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-normal">CA mensuel</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 justify-center gap-1">
        <span className="text-2xl font-medium text-foreground">
          {formatCurrency(monthTotal)}
        </span>
        <span className="text-sm text-muted-foreground">
          {invoiceCount} facture{invoiceCount > 1 ? "s" : ""}
        </span>
      </CardContent>
      <CardFooter className="justify-end pt-0 pr-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={() => router.push("/dashboard/analytics")}
        >
          Analytique
          <ExternalLink className="ml-1 h-3 w-3" />
        </Button>
      </CardFooter>
    </Card>
  );
}
