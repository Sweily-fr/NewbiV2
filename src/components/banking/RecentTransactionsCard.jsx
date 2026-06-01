"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { ArrowUpRight, ArrowDownLeft, ExternalLink } from "lucide-react";
import { ReceiptItemIcon } from "@/src/components/icons";
import { useRouter } from "next/navigation";
import { useQuery } from "@apollo/client";
import { GET_TRANSACTIONS } from "@/src/graphql/queries/banking";
import { findMerchant } from "@/lib/merchants-config";
import { MerchantLogo } from "@/app/dashboard/outils/transactions/components/merchant-logo";

/**
 * Card affichant les transactions récentes
 * Fetche ses propres 5 transactions depuis le backend
 */
export default function RecentTransactionsCard({
  className,
  workspaceId,
  accountId,
  limit = 5,
  isLoading = false,
}) {
  const router = useRouter();

  // Charger uniquement les N transactions les plus récentes
  const { data, loading: queryLoading } = useQuery(GET_TRANSACTIONS, {
    variables: {
      workspaceId,
      filters: accountId && accountId !== "all" ? { accountId } : undefined,
      limit,
    },
    fetchPolicy: "cache-and-network",
    skip: !workspaceId,
  });

  const recentTransactions = data?.transactions || [];
  const loading = isLoading || queryLoading;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    });
  };

  // Skeleton de chargement
  if (loading) {
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
              <div key={i} className="flex items-center justify-between">
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
          className="text-xs text-[#5b50FF] hover:text-[#5b50FF]"
          onClick={() => router.push("/dashboard/outils/transactions")}
        >
          Voir tout
          <ExternalLink className="ml-1 h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col flex-1">
        {recentTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-8 text-center">
            <ReceiptItemIcon className="w-8 h-8 text-muted-foreground/40 mb-2" />
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
                    style={{
                      color: isIncome
                        ? "var(--color-income)"
                        : "var(--color-expense)",
                    }}
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
