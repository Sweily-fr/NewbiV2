"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { useBridge } from "@/src/hooks/useBridge";
import { 
  CreditCard, 
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
  MoreHorizontal,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { toast } from "@/src/components/ui/sonner";

/**
 * Composant pour afficher les transactions Bridge
 */
const BridgeTransactions = ({ limit = 5, showSyncButton = true, className = "" }) => {
  const {
    transactions,
    transactionStats,
    loadingTransactions,
    isSyncing,
    isConnected,
    transactionsError,
    syncBridgeTransactions,
    refetchTransactions,
  } = useBridge();

  // Synchronisation automatique au montage du composant
  useEffect(() => {
    if (isConnected && transactions.length === 0 && !loadingTransactions) {
      console.log("🔄 Synchronisation automatique des transactions...");
      syncBridgeTransactions();
    }
  }, [isConnected]);

  /**
   * Obtient l'icône et les couleurs selon la catégorie de transaction
   */
  const getTransactionDisplay = (transaction) => {
    const categoryIcons = {
      alimentation: { icon: Utensils, color: "text-orange-600", bg: "bg-orange-50" },
      transport: { icon: Car, color: "text-blue-600", bg: "bg-blue-50" },
      logement: { icon: Home, color: "text-purple-600", bg: "bg-purple-50" },
      sante: { icon: Heart, color: "text-red-600", bg: "bg-red-50" },
      loisirs: { icon: Gamepad2, color: "text-green-600", bg: "bg-green-50" },
      shopping: { icon: ShoppingBag, color: "text-pink-600", bg: "bg-pink-50" },
      services: { icon: Wrench, color: "text-gray-600", bg: "bg-gray-50" },
      salaire: { icon: Banknote, color: "text-emerald-600", bg: "bg-emerald-50" },
      virement: { icon: ArrowLeftRight, color: "text-indigo-600", bg: "bg-indigo-50" },
      autre: { icon: MoreHorizontal, color: "text-slate-600", bg: "bg-slate-50" },
    };

    const config = categoryIcons[transaction.category] || categoryIcons.autre;
    
    // Override pour les types de transaction
    if (transaction.type === "credit") {
      return {
        ...config,
        icon: TrendingUp,
        color: "text-green-600",
        bg: "bg-green-50",
      };
    }

    return config;
  };

  /**
   * Formate la catégorie pour l'affichage
   */
  const formatCategory = (category) => {
    const categoryLabels = {
      alimentation: "Alimentation",
      transport: "Transport",
      logement: "Logement",
      sante: "Santé",
      loisirs: "Loisirs",
      shopping: "Shopping",
      services: "Services",
      salaire: "Salaire",
      virement: "Virement",
      autre: "Autre",
    };
    return categoryLabels[category] || "Autre";
  };

  /**
   * Gère la synchronisation manuelle
   */
  const handleSync = async () => {
    try {
      const result = await syncBridgeTransactions();
      if (result) {
        toast.success(`${result.created} nouvelles transactions, ${result.updated} mises à jour`);
      }
    } catch (error) {
      toast.error("Erreur lors de la synchronisation");
    }
  };

  // Si pas connecté à Bridge
  if (!isConnected) {
    return (
      <Card className={`shadow-xs ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">
            Dernières transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-muted-foreground py-8">
            <CreditCard className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm">Connectez votre compte bancaire</p>
            <p className="text-xs">pour voir vos transactions</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Limiter les transactions affichées
  const displayedTransactions = transactions.slice(0, limit);

  return (
    <Card className={`shadow-xs ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            Dernières transactions
            {transactionStats && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {transactionStats.transactionCount} ce mois
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {showSyncButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSync}
                disabled={isSyncing}
                className="h-8 px-2"
              >
                <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
              </Button>
            )}
            <button
              onClick={() => window.location.href = "/dashboard/outils/gestion-depenses"}
              className="text-sm cursor-pointer text-muted-foreground hover:text-foreground border-b border-transparent hover:border-current transition-colors"
            >
              Afficher tout
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Erreur */}
        {transactionsError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-sm text-red-700">
              Erreur lors du chargement des transactions
            </p>
          </div>
        )}

        {/* Chargement */}
        {loadingTransactions ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-1" />
                    <div className="h-3 bg-gray-200 rounded w-16" />
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-4 bg-gray-200 rounded w-16 mb-1" />
                  <div className="h-3 bg-gray-200 rounded w-12" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedTransactions.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <CreditCard className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm">Aucune transaction récente</p>
            <p className="text-xs">Vos transactions apparaîtront ici</p>
            {showSyncButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={isSyncing}
                className="mt-3"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
                Synchroniser
              </Button>
            )}
          </div>
        ) : (
          /* Liste des transactions */
          displayedTransactions.map((transaction) => {
            const displayConfig = getTransactionDisplay(transaction);
            const IconComponent = displayConfig.icon;
            
            return (
              <div
                key={transaction.id}
                className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${displayConfig.bg} rounded-full flex items-center justify-center`}>
                    <IconComponent className={`h-4 w-4 ${displayConfig.color}`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCategory(transaction.category)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium text-sm ${
                    transaction.type === "credit" ? "text-green-600" : "text-red-600"
                  }`}>
                    {transaction.formattedAmount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {transaction.formattedDate}
                  </p>
                </div>
              </div>
            );
          })
        )}

        {/* Statistiques rapides */}
        {transactionStats && displayedTransactions.length > 0 && (
          <div className="pt-3 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Revenus</p>
                <p className="text-sm font-medium text-green-600">
                  +{transactionStats.totalIncome.toFixed(2)} €
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dépenses</p>
                <p className="text-sm font-medium text-red-600">
                  -{transactionStats.totalExpenses.toFixed(2)} €
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BridgeTransactions;
