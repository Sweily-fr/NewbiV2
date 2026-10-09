"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/src/components/ui/skeleton";
import { getNumberFormat } from "@/src/lib/intl-cache";

const formatCurrency = (amount) =>
  getNumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);

export function InvoicesToCollectCard({ className, invoices = [], isLoading }) {
  const router = useRouter();

  const { total, invoiceCount } = useMemo(() => {
    const pendingInvoices = invoices.filter((inv) => inv.status === "PENDING");
    const total = pendingInvoices.reduce(
      (sum, inv) => sum + (inv.finalTotalTTC || 0),
      0,
    );
    return { total, invoiceCount: pendingInvoices.length };
  }, [invoices]);

  if (isLoading) {
    return (
      <Card className={`${className || ""} flex flex-col py-5 gap-3`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-normal">
            Factures à encaisser
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
          Factures à encaisser
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 justify-center gap-1">
        <span className="text-2xl font-medium text-foreground">
          {formatCurrency(total)}
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
          onClick={() =>
            router.push("/dashboard/outils/factures?status=pending")
          }
        >
          Voir tout
          <ExternalLink className="ml-1 h-3 w-3" />
        </Button>
      </CardFooter>
    </Card>
  );
}
