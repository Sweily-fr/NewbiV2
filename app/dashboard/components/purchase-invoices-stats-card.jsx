"use client";

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
import { usePurchaseInvoiceStats } from "@/src/hooks/usePurchaseInvoices";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount || 0);

export function PurchaseInvoicesStatsCard({ className }) {
  const router = useRouter();
  const { stats, loading } = usePurchaseInvoiceStats();

  if (loading) {
    return (
      <Card className={`${className || ""} flex flex-col py-5 gap-3`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-normal">
            Factures à payer
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

  const total = stats?.totalToPay || 0;
  const count = stats?.totalToPayCount || 0;

  return (
    <Card className={`${className || ""} flex flex-col py-5 gap-3`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-normal">
          Factures à payer
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 justify-center gap-1">
        <span className="text-2xl font-medium text-foreground">
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
            router.push("/dashboard/outils/factures-achat?status=TO_PAY")
          }
        >
          Voir tout
          <ExternalLink className="ml-1 h-3 w-3" />
        </Button>
      </CardFooter>
    </Card>
  );
}
