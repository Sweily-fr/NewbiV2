"use client";

import { useState, useEffect, useCallback } from "react";
import { useWorkspace } from "./useWorkspace";

/**
 * Hook pour gérer le rapprochement factures/transactions bancaires
 */
export function useReconciliation() {
  const { workspaceId } = useWorkspace();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Récupérer les suggestions de rapprochement
  const fetchSuggestions = useCallback(async () => {
    if (!workspaceId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/reconciliation/suggestions", {
        headers: {
          "x-workspace-id": workspaceId,
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des suggestions");
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error("Erreur fetchSuggestions:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  // Récupérer les transactions pour une facture spécifique
  const fetchTransactionsForInvoice = useCallback(
    async (invoiceId) => {
      if (!workspaceId || !invoiceId)
        return { transactions: [], invoiceAmount: 0 };

      try {
        const response = await fetch(
          `/api/reconciliation/transactions-for-invoice/${invoiceId}`,
          {
            headers: {
              "x-workspace-id": workspaceId,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des transactions");
        }

        const data = await response.json();
        return {
          transactions: data.transactions || [],
          invoiceAmount: data.invoiceAmount || 0,
        };
      } catch (err) {
        console.error("Erreur fetchTransactionsForInvoice:", err);
        return { transactions: [], invoiceAmount: 0 };
      }
    },
    [workspaceId]
  );

  // Lier une transaction à une facture
  const linkTransaction = useCallback(
    async (transactionId, invoiceId) => {
      if (!workspaceId) return { success: false };

      try {
        const response = await fetch("/api/reconciliation/link", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-workspace-id": workspaceId,
          },
          body: JSON.stringify({ transactionId, invoiceId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erreur lors du rapprochement");
        }

        // Rafraîchir les suggestions
        await fetchSuggestions();

        return { success: true, data };
      } catch (err) {
        console.error("Erreur linkTransaction:", err);
        return { success: false, error: err.message };
      }
    },
    [workspaceId, fetchSuggestions]
  );

  // Délier une transaction d'une facture
  const unlinkTransaction = useCallback(
    async (transactionId, invoiceId) => {
      if (!workspaceId) return { success: false };

      try {
        const response = await fetch("/api/reconciliation/unlink", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-workspace-id": workspaceId,
          },
          body: JSON.stringify({ transactionId, invoiceId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erreur lors de la déliaison");
        }

        // Rafraîchir les suggestions
        await fetchSuggestions();

        return { success: true, data };
      } catch (err) {
        console.error("Erreur unlinkTransaction:", err);
        return { success: false, error: err.message };
      }
    },
    [workspaceId, fetchSuggestions]
  );

  // Charger les suggestions au montage
  useEffect(() => {
    if (workspaceId) {
      fetchSuggestions();
    }
  }, [workspaceId, fetchSuggestions]);

  return {
    suggestions,
    loading,
    error,
    fetchSuggestions,
    fetchTransactionsForInvoice,
    linkTransaction,
    unlinkTransaction,
    hasSuggestions: suggestions.length > 0,
  };
}

/**
 * Hook pour afficher les toasts de suggestion de rapprochement
 */
export function useReconciliationToast() {
  const { suggestions, linkTransaction } = useReconciliation();
  const [shownSuggestions, setShownSuggestions] = useState(new Set());

  // Retourner les nouvelles suggestions non encore affichées
  const getNewSuggestions = useCallback(() => {
    return suggestions.filter(
      (s) => !shownSuggestions.has(s.transaction._id) && s.confidence === "high"
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
