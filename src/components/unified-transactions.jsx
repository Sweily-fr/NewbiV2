"use client";

import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Utensils,
  Car,
  Home,
  Heart,
  Gamepad2,
  ShoppingBag,
  Wrench,
  Banknote,
  ArrowLeftRight,
  RefreshCw,
  AlertCircle,
  FileText,
  ArrowRight,
} from "lucide-react";
import { toast } from "@/src/components/ui/sonner";
import { useBridge } from "@/src/hooks/useBridge";
import { useExpenses } from "@/src/hooks/useExpenses";
import { useRouter } from "next/navigation";

/**
 * Composant unifié pour afficher toutes les transactions
 * (Bridge API + dépenses locales)
 */
const UnifiedTransactions = ({
  limit = 5, // Par défaut, afficher 5 transactions récentes
  showSyncButton = true,
  className = "",
}) => {
  const router = useRouter();
  
  // Données Bridge
  const {
    transactions: bridgeTransactions = [],
    transactionStats,
    loadingTransactions: loadingBridge,
    isSyncing,
    isConnected,
    transactionsError: bridgeError,
    syncBridgeTransactions,
  } = useBridge();

  // Données dépenses locales
  const {
    expenses = [],
    loading: loadingExpenses,
    error: expensesError,
    refetch: refetchExpenses,
  } = useExpenses({ status: "PAID" });

  // États combinés
  const loading = loadingBridge || loadingExpenses;
  const error = bridgeError || expensesError;

  /**
   * Configuration des icônes par catégorie
   */
  const categoryIcons = {
    // Catégories Bridge
    alimentation: {
      icon: Utensils,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    transport: { icon: Car, color: "text-blue-600", bg: "bg-blue-50" },
    logement: { icon: Home, color: "text-purple-600", bg: "bg-purple-50" },
    sante: { icon: Heart, color: "text-red-600", bg: "bg-red-50" },
    loisirs: { icon: Gamepad2, color: "text-green-600", bg: "bg-green-50" },
    shopping: { icon: ShoppingBag, color: "text-pink-600", bg: "bg-pink-50" },
    services: { icon: Wrench, color: "text-gray-600", bg: "bg-gray-50" },
    salaire: { icon: Banknote, color: "text-emerald-600", bg: "bg-emerald-50" },
    virement: {
      icon: ArrowLeftRight,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },

    // Catégories dépenses locales
    TRAVEL: { icon: Car, color: "text-blue-600", bg: "bg-blue-50" },
    MEALS: { icon: Utensils, color: "text-orange-600", bg: "bg-orange-50" },
    OFFICE_SUPPLIES: {
      icon: FileText,
      color: "text-gray-600",
      bg: "bg-gray-50",
    },
    SERVICES: { icon: Wrench, color: "text-purple-600", bg: "bg-purple-50" },
    OTHER: { icon: ShoppingBag, color: "text-gray-600", bg: "bg-gray-50" },

    // Défaut
    autre: { icon: ArrowLeftRight, color: "text-gray-600", bg: "bg-gray-50" },
  };

  /**
   * Transforme les dépenses locales au format unifié
   */
  const transformLocalExpenses = (expenses) => {
    return expenses.map((expense) => ({
      id: `expense-${expense.id}`,
      date: expense.date,
      amount: -Math.abs(expense.amount), // Négatif pour les dépenses
      currency: expense.currency || "EUR",
      description: expense.description || "Dépense",
      category: expense.category || "OTHER",
      vendor: expense.vendor || "Inconnu",
      type: "expense",
      source: "local",
      originalData: expense,
    }));
  };

  /**
   * Transforme les transactions Bridge au format unifié
   */
  const transformBridgeTransactions = (transactions) => {
    return transactions.map((transaction) => ({
      id: `bridge-${transaction.id}`,
      date: transaction.date,
      amount: transaction.amount,
      currency: transaction.currency || "EUR",
      description: transaction.description || "Transaction Bridge",
      category: transaction.category || "autre",
      vendor: transaction.vendor || "Inconnu",
      type: transaction.type === 'credit' ? "income" : "expense", // Utilise le type Bridge (credit/debit)
      bridgeType: transaction.type, // Conserve le type original Bridge
      source: "bridge",
      originalData: transaction,
    }));
  };

  /**
   * Combine et trie toutes les transactions
   */
  const allTransactions = useMemo(() => {
    const localTransactions = transformLocalExpenses(expenses);
    const bridgeTransactionsFormatted =
      transformBridgeTransactions(bridgeTransactions);

    const combined = [...localTransactions, ...bridgeTransactionsFormatted];

    // Trier par date (plus récent en premier)
    return combined
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
  }, [expenses, bridgeTransactions, limit]);

  /**
   * Obtient l'icône et les couleurs pour une transaction
   */
  const getTransactionIcon = (category) => {
    const config = categoryIcons[category] || categoryIcons.autre;
    const IconComponent = config.icon;
    return {
      icon: <IconComponent size={16} />,
      color: config.color,
      bg: config.bg,
    };
  };

  /**
   * Formate le montant
   */
  const formatAmount = (amount, currency = "EUR") => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  /**
   * Formate la date
   */
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    });
  };

  /**
   * Formate la catégorie pour l'affichage
   */
  const formatCategory = (category) => {
    const categoryLabels = {
      // Bridge
      alimentation: "Alimentation",
      transport: "Transport",
      logement: "Logement",
      sante: "Santé",
      loisirs: "Loisirs",
      shopping: "Shopping",
      services: "Services",
      salaire: "Salaire",
      virement: "Virement",

      // Local
      TRAVEL: "Transport",
      MEALS: "Repas",
      OFFICE_SUPPLIES: "Bureau",
      SERVICES: "Services",
      OTHER: "Autre",

      autre: "Autre",
    };
    return categoryLabels[category] || "Autre";
  };

  /**
   * Redirige vers la page des dépenses
   */
  const handleRedirectToExpenses = () => {
    router.push('/dashboard/outils/gestion-depenses');
  };

  // Calcul des statistiques
  const stats = useMemo(() => {
    const totalIncome = allTransactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = Math.abs(
      allTransactions
        .filter((t) => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0)
    );

    return {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      transactionCount: allTransactions.length,
    };
  }, [allTransactions]);

  // Si les données sont en cours de chargement, laisser le loading global s'occuper de l'affichage
  if (loading) {
    return null;
  }

  if (error) {
    return (
      <Card className={`shadow-xs ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-normal">
            Transactions récentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-red-500">
            <AlertCircle className="h-6 w-6" />
            <span className="ml-2 text-sm">Erreur de chargement</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`shadow-xs ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-normal">
            Transactions récentes
          </CardTitle>
          {showSyncButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRedirectToExpenses}
              className="h-8 w-8 p-0"
              title="Voir toutes les dépenses"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {allTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">Aucune transaction récente</p>
            <p className="text-xs mt-1">
              {!isConnected
                ? "Connectez votre compte bancaire pour voir vos transactions"
                : ""}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {allTransactions.map((transaction) => {
              const iconConfig = getTransactionIcon(transaction.category);
              // Pour les transactions Bridge, utilise le type (credit = vert, debit = rouge)
              // Pour les dépenses locales, utilise le montant (toujours négatif = rouge)
              const isCredit = transaction.source === 'bridge' 
                ? transaction.bridgeType === 'credit'
                : transaction.amount > 0;

              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${iconConfig.bg}`}>
                      <div className={iconConfig.color}>{iconConfig.icon}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-normal">
                        {transaction.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500">
                          {formatCategory(transaction.category)}
                          {/* •{" "} */}
                          {/* {formatDate(transaction.date)} */}
                        </p>
                        {/* <Badge variant="outline" className="text-xs font-light">
                          {transaction.source === "bridge" ? "Bridge" : "Local"}
                        </Badge> */}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-normal ${
                        isCredit ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatAmount(transaction.amount, transaction.currency)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {transaction.vendor}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UnifiedTransactions;
