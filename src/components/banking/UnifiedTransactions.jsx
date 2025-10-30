"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  ArrowUpRight,
  ArrowDownLeft,
  ExternalLink,
  Euro,
  CreditCard,
  FileMinus2,
} from "lucide-react";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { useState, useEffect, useMemo } from "react";

export default function UnifiedTransactions({
  limit = 5,
  className,
  expenses = [],
  invoices = [],
  isLoading = false,
}) {
  const { workspaceId } = useWorkspace();
  const [bankTransactions, setBankTransactions] = useState([]);
  const [bankLoading, setBankLoading] = useState(true);
  const [bankError, setBankError] = useState(null);

  const fetchBankTransactions = async () => {
    if (!workspaceId) return;

    try {
      setBankLoading(true);

      // Si les données du dashboard viennent du cache, pas besoin d'attendre l'API bancaire
      if (!isLoading) {
        setBankTransactions([]);
        setBankLoading(false);
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000"}/banking/transactions`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-workspace-id": workspaceId,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBankTransactions(data.transactions || []);
      } else {
        // Ne pas considérer comme une erreur si l'API bancaire n'est pas disponible
        setBankTransactions([]);
      }
    } catch (err) {
      // Ignorer les erreurs bancaires pour l'instant
      setBankTransactions([]);
    } finally {
      setBankLoading(false);
    }
  };

  useEffect(() => {
    fetchBankTransactions();
  }, [workspaceId, isLoading]);

  // Combiner toutes les transactions
  const allTransactions = useMemo(() => {
    const transactions = [];

    // Debug: Log des données reçues
    console.log("🔍 Données reçues dans UnifiedTransactions:");
    console.log("- Expenses:", expenses?.length || 0, expenses?.[0]);
    console.log("- Invoices:", invoices?.length || 0, invoices?.[0]);
    console.log(
      "- Bank transactions:",
      bankTransactions?.length || 0,
      bankTransactions?.[0]
    );

    // Ajouter les transactions bancaires
    bankTransactions.forEach((transaction) => {
      transactions.push({
        id: transaction._id,
        type: "bank",
        subtype: transaction.type, // credit ou debit
        description: transaction.description || "Transaction bancaire",
        amount: transaction.amount,
        date: transaction.date,
        source: "Banque",
      });
    });

    // Ajouter les dépenses (incluant OCR)
    expenses.forEach((expense) => {
      // Déterminer si c'est un revenu ou une dépense
      const isIncome = expense.notes && expense.notes.includes("[INCOME]");
      transactions.push({
        id: expense.id,
        type: isIncome ? "income" : "expense",
        subtype: isIncome ? "credit" : "debit",
        description: expense.description || expense.vendor || "Dépense",
        amount: expense.amount,
        date: expense.date,
        source:
          expense.notes && expense.notes.includes("[OCR]") ? "OCR" : "Manuel",
        category: expense.category,
        vendor: expense.vendor,
      });
    });

    // Ajouter les factures payées comme revenus (déjà filtrées dans les props)
    invoices.forEach((invoice) => {
      transactions.push({
        id: invoice.id,
        type: "invoice",
        subtype: "credit",
        description: `Facture ${invoice.invoiceNumber || ""}`,
        amount: invoice.finalTotalTTC || invoice.totalTTC,
        date: invoice.issueDate,
        source: "Facture",
        client: invoice.client?.name,
      });
    });

    // Debug: Log des transactions créées
    console.log("📊 Transactions créées:", transactions.length);
    if (transactions.length > 0) {
      console.log("Première transaction:", transactions[0]);
    }

    // Trier par date (plus récent en premier)
    return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [bankTransactions, expenses, invoices]);

  const finalLoading = isLoading || bankLoading;
  const error = bankError;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";

    // Log pour debug - voir le format exact des dates reçues
    console.log("📅 Date reçue:", dateString, "Type:", typeof dateString);

    let date;

    // Essayer différents formats de date
    if (typeof dateString === "string") {
      // Si c'est une chaîne, essayer de la parser
      date = new Date(dateString);
    } else if (typeof dateString === "number") {
      // Si c'est un timestamp
      date = new Date(dateString);
    } else if (dateString instanceof Date) {
      // Si c'est déjà un objet Date
      date = dateString;
    } else {
      console.warn("Format de date non reconnu:", dateString);
      return "";
    }

    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      console.warn("Date invalide après parsing:", dateString, "→", date);
      return "";
    }

    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const getTransactionIcon = (transaction) => {
    if (transaction.type === "bank") {
      return transaction.subtype === "credit" ? (
        <ArrowDownLeft className="h-4 w-4 text-green-500" />
      ) : (
        <ArrowUpRight className="h-4 w-4 text-red-500" />
      );
    } else if (transaction.type === "expense") {
      return <Euro className="h-3.5 w-3.5" />;
    } else if (transaction.type === "income") {
      return <ArrowDownLeft className="h-4 w-4" />;
    } else if (transaction.type === "invoice") {
      return <FileMinus2 className="h-3.5 w-3.5" />;
    }
    return <CreditCard className="h-4 w-4 text-gray-500" />;
  };

  const getTransactionColor = (transaction) => {
    if (transaction.type === "expense") {
      return "text-red-600";
    } else if (
      transaction.type === "income" ||
      transaction.type === "invoice"
    ) {
      return "text-green-600";
    } else if (transaction.type === "bank") {
      return transaction.subtype === "credit"
        ? "text-green-600"
        : "text-red-600";
    }
    return "text-gray-600";
  };

  if (finalLoading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-normal">
            Transactions récentes
          </CardTitle>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-normal">
            Transactions récentes
          </CardTitle>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-500">Erreur: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (allTransactions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-normal text-sm">
            Transactions récentes
          </CardTitle>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aucune transaction trouvée
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-normal">
          Transactions récentes
        </CardTitle>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {allTransactions.slice(0, limit).map((transaction) => (
            <div
              key={`${transaction.type}-${transaction.id}`}
              className="flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-[#5b4fff]/15 dark:bg-[#5b4fff]/25 rounded-full flex items-center justify-center">
                  {getTransactionIcon(transaction)}
                </div>
                <div>
                  <p className="text-sm font-normal truncate max-w-[170px]">
                    {transaction.description || "Transaction"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatDate(transaction.date)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`text-sm font-normal ${getTransactionColor(transaction)}`}
                >
                  {transaction.type === "income" ||
                  transaction.type === "invoice" ||
                  transaction.subtype === "credit"
                    ? "+"
                    : "-"}
                  {formatCurrency(Math.abs(transaction.amount))}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
