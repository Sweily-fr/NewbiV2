"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useWorkspace } from "./useWorkspace";

// Fonction utilitaire pour récupérer le token JWT
const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("bearer_token");
};

// Cache global pour éviter les appels répétés entre composants
const suggestionsCache = {
  data: null,
  workspaceId: null,
  timestamp: 0,
};

// TTL du cache en millisecondes (2 minutes)
const CACHE_TTL = 2 * 60 * 1000;

// Délai minimum entre deux appels API (5 secondes)
const MIN_FETCH_INTERVAL = 5 * 1000;

/**
 * Hook pour gérer le rapprochement factures/transactions bancaires
 */
export function useReconciliation() {
  const { workspaceId } = useWorkspace();
  const [suggestions, setSuggestions] = useState(suggestionsCache.data || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastFetchRef = useRef(0);
  const isFetchingRef = useRef(false);

  // Récupérer les suggestions de rapprochement avec cache
  const fetchSuggestions = useCallback(
    async (forceRefresh = false) => {
      if (!workspaceId) return;

      const now = Date.now();

      // Vérifier si on a des données en cache valides
      if (
        !forceRefresh &&
        suggestionsCache.data &&
        suggestionsCache.workspaceId === workspaceId &&
        now - suggestionsCache.timestamp < CACHE_TTL
      ) {
        // Utiliser le cache
        setSuggestions(suggestionsCache.data);
        return;
      }

      // Éviter les appels trop fréquents
      if (!forceRefresh && now - lastFetchRef.current < MIN_FETCH_INTERVAL) {
        return;
      }

      // Éviter les appels concurrents
      if (isFetchingRef.current) {
        return;
      }

      isFetchingRef.current = true;
      lastFetchRef.current = now;
      setLoading(true);
      setError(null);

      try {
        const token = getAuthToken();
        const response = await fetch("/api/reconciliation/suggestions", {
          headers: {
            "x-workspace-id": workspaceId,
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des suggestions");
        }

        const data = await response.json();
        const newSuggestions = data.suggestions || [];

        // Mettre à jour le cache
        suggestionsCache.data = newSuggestions;
        suggestionsCache.workspaceId = workspaceId;
        suggestionsCache.timestamp = Date.now();

        setSuggestions(newSuggestions);
      } catch (err) {
        console.error("Erreur fetchSuggestions:", err);
        setError(err.message);
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    },
    [workspaceId]
  );

  // Récupérer les transactions pour une facture spécifique
  const fetchTransactionsForInvoice = useCallback(
    async (invoiceId) => {
      if (!workspaceId || !invoiceId)
        return { transactions: [], invoiceAmount: 0 };

      try {
        const token = getAuthToken();
        const response = await fetch(
          `/api/reconciliation/transactions-for-invoice/${invoiceId}`,
          {
            headers: {
              "x-workspace-id": workspaceId,
              ...(token && { Authorization: `Bearer ${token}` }),
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
        const token = getAuthToken();
        const response = await fetch("/api/reconciliation/link", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-workspace-id": workspaceId,
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({ transactionId, invoiceId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erreur lors du rapprochement");
        }

        // Rafraîchir les suggestions (forcer le refresh après une action)
        await fetchSuggestions(true);

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
        const token = getAuthToken();
        const response = await fetch("/api/reconciliation/unlink", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-workspace-id": workspaceId,
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({ transactionId, invoiceId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erreur lors de la déliaison");
        }

        // Rafraîchir les suggestions (forcer le refresh après une action)
        await fetchSuggestions(true);

        return { success: true, data };
      } catch (err) {
        console.error("Erreur unlinkTransaction:", err);
        return { success: false, error: err.message };
      }
    },
    [workspaceId, fetchSuggestions]
  );

  // Charger les suggestions au montage (une seule fois grâce au cache)
  useEffect(() => {
    if (workspaceId) {
      fetchSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

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
