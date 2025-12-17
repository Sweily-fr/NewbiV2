"use client";

/**
 * Hooks pour le rapprochement factures/transactions utilisant GraphQL
 * Remplace l'ancienne version REST par Apollo Client
 */

import { useState, useCallback } from "react";

// Ré-exporter les hooks GraphQL avec les mêmes noms pour compatibilité
export {
  useReconciliationSuggestions,
  useTransactionsForInvoice,
  useLinkTransactionToInvoice,
  useUnlinkTransactionFromInvoice,
  useIgnoreTransaction,
  useReconciliationGraphQL as useReconciliation,
  useReconciliationForSidebar,
} from "./useReconciliationGraphQL";

/**
 * Hook pour afficher les toasts de suggestion de rapprochement
 */
export function useReconciliationToast() {
  const { useReconciliationGraphQL } = require("./useReconciliationGraphQL");
  const { suggestions, linkTransaction } = useReconciliationGraphQL();
  const [shownSuggestions, setShownSuggestions] = useState(new Set());

  // Retourner les nouvelles suggestions non encore affichées
  const getNewSuggestions = useCallback(() => {
    return suggestions.filter(
      (s) => !shownSuggestions.has(s.transaction.id) && s.confidence === "high"
    );
  }, [suggestions, shownSuggestions]);

  // Marquer une suggestion comme affichée
  const markAsShown = useCallback((transactionId) => {
    setShownSuggestions((prev) => new Set([...prev, transactionId]));
  }, []);

  return {
    getNewSuggestions,
    markAsShown,
    linkTransaction,
  };
}
