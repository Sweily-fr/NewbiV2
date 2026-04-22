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

export function OverdueInvoicesCard({ className, invoices = [], isLoading }) {
  const router = useRouter();

  const { total, count } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let count = 0;
    let total = 0;
    for (const inv of invoices || []) {
      if (inv.status !== "PENDING") continue;
      const due = parseDate(inv.dueDate);
      if (!due || due >= now) continue;
      count += 1;
      total += inv.finalTotalTTC || 0;
    }

    return { total, count };
  }, [invoices]);

  if (isLoading) {
    return (
      <Card className={`${className || ""} flex flex-col py-5 gap-3`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-normal">
            Factures clients en retard
          </CardTitle>
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
        <CardTitle className="text-base font-normal">
          Factures clients en retard
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 justify-center gap-1">
        <span
          className={`text-2xl font-medium ${count > 0 ? "text-red-500" : "text-foreground"}`}
        >
          {formatCurrency(total)}
        </span>
        <span className="text-sm text-muted-foreground">
          {count} facture{count > 1 ? "s" : ""}
        </span>
      </CardContent>
      <CardFooter className="justify-end pt-0 pr-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={() =>
            router.push("/dashboard/outils/factures?status=overdue")
          }
        >
          Voir tout
          <ExternalLink className="ml-1 h-3 w-3" />
        </Button>
      </CardFooter>
    </Card>
  );
}
