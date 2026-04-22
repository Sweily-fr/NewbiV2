"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { ExternalLink, ArrowUpRight } from "lucide-react";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount || 0);

function getInitials(name) {
  if (!name) return "??";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function TopClientsCard({ className, paidInvoices = [], isLoading }) {
  const router = useRouter();

  const topClients = useMemo(() => {
    const map = new Map();
    for (const inv of paidInvoices || []) {
      const clientId = inv.client?.id || "unknown";
      const clientName =
        inv.client?.name || inv.client?.email || "Client inconnu";

      if (!map.has(clientId)) {
        map.set(clientId, {
          clientId,
          name: clientName,
          total: 0,
          invoiceCount: 0,
        });
      }
      const entry = map.get(clientId);
      entry.total += inv.finalTotalTTC || 0;
      entry.invoiceCount += 1;
    }

    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
  }, [paidInvoices]);

  if (isLoading) {
    return (
      <Card className={`${className || ""} flex flex-col min-h-[260px]`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-normal">Top 3 clients</CardTitle>
          <Skeleton className="h-7 w-20" />
        </CardHeader>
        <CardContent className="flex flex-col flex-1">
          <div className="space-y-3 flex-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className || ""} flex flex-col min-h-[260px]`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-normal">Top 3 clients</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={() => router.push("/dashboard/clients")}
        >
          Analytique client
          <ExternalLink className="ml-1 h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col flex-1">
        {topClients.length === 0 ? (
          <div className="flex items-center justify-center flex-1">
            <p className="text-sm text-muted-foreground">
              Aucun client facturé pour le moment
            </p>
          </div>
        ) : (
          <div className="space-y-3 flex-1">
            {topClients.map((client, idx) => {
              const isClickable = client.clientId !== "unknown";
              return (
                <button
                  type="button"
                  key={client.clientId}
                  disabled={!isClickable}
                  onClick={() =>
                    isClickable &&
                    router.push(`/dashboard/clients/${client.clientId}`)
                  }
                  className="group w-full flex items-center justify-between rounded-md p-1 -m-1 hover:bg-accent/40 transition-colors text-left disabled:cursor-default disabled:hover:bg-transparent"
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100 relative">
                      <span className="text-xs font-medium text-gray-500">
                        {getInitials(client.name)}
                      </span>
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-medium">
                        {idx + 1}
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-normal truncate">
                        {client.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {client.invoiceCount} facture
                        {client.invoiceCount > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-medium">
                      {formatCurrency(client.total)}
                    </span>
                    {isClickable && (
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
