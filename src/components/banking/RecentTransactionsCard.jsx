"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { ArrowUpRight, ArrowDownLeft, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { findMerchant } from "@/lib/merchants-config";
import { MerchantLogo } from "@/app/dashboard/outils/transactions/components/merchant-logo";

/**
 * Card affichant les transactions récentes
 * Style cohérent avec BankBalanceCard
 */
export default function RecentTransactionsCard({
  className,
  transactions = [],
  limit = 5,
  isLoading = false,
}) {
  const router = useRouter();

  // Formater le montant en devise
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount || 0);
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    });
  };

  // Trier et limiter les transactions
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort(
        (a, b) =>
          new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
      )
      .slice(0, limit);
  }, [transactions, limit]);

  // Skeleton de chargement
  if (isLoading) {
    return (
      <Card className={`${className} flex flex-col`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-normal">
            Transactions récentes
          </CardTitle>
          <div className="h-4 w-14 bg-accent rounded animate-pulse" />
        </CardHeader>
        <CardContent className="flex flex-col flex-1 animate-pulse">
          <div className="space-y-4 flex-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-accent rounded-full flex-shrink-0" />
                  <div className="flex flex-col gap-1">
                    <div className="h-4 w-28 bg-accent rounded" />
                    <div className="h-3 w-14 bg-accent rounded" />
                  </div>
                </div>
                <div className="h-4 w-16 bg-accent rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} flex flex-col`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-normal">
          Transactions récentes
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={() => router.push("/dashboard/outils/transactions")}
        >
          Voir tout
          <ExternalLink className="ml-1 h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col flex-1">
        {recentTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Aucune transaction récente
            </p>
          </div>
        ) : (
          <div className="space-y-4 flex-1">
            {recentTransactions.map((transaction, index) => {
              const isIncome = transaction.amount > 0;
              const merchant = findMerchant(transaction.description);

              return (
                <div
                  key={transaction.id || `tx-${index}`}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    {/* Icône ou logo du marchand */}
                    <div className="flex-shrink-0">
                      {merchant ? (
                        <MerchantLogo
                          merchant={merchant}
                          size="sm"
                          className="h-8 w-8"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-500">
                          {isIncome ? (
                            <ArrowDownLeft className="h-4 w-4" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Description et date */}
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-normal truncate max-w-[180px]">
                        {merchant?.name ||
                          transaction.description ||
                          "Transaction"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(transaction.date || transaction.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Montant */}
                  <span
                    className="text-sm font-medium"
                    style={{ color: isIncome ? "#0e7a3e" : "inherit" }}
                  >
                    {isIncome ? "+" : ""}
                    {formatCurrency(transaction.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
