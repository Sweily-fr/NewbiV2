"use client";

import { useEffect, useState, useCallback } from "react";
import { useReconciliation } from "@/src/hooks/useReconciliation";
import { useRouter } from "next/navigation";
import { useToastManager } from "@/src/components/ui/toast-manager";

// Clé pour stocker les suggestions ignorées dans localStorage
const IGNORED_SUGGESTIONS_KEY = "reconciliation_ignored_suggestions";

// Récupérer les suggestions ignorées depuis localStorage
const getIgnoredSuggestions = () => {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = localStorage.getItem(IGNORED_SUGGESTIONS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

// Sauvegarder une suggestion ignorée dans localStorage
const saveIgnoredSuggestion = (transactionId) => {
  if (typeof window === "undefined") return;
  try {
    const ignored = getIgnoredSuggestions();
    ignored.add(transactionId);
    localStorage.setItem(IGNORED_SUGGESTIONS_KEY, JSON.stringify([...ignored]));
  } catch {
    // Ignorer les erreurs de localStorage
  }
};

/**
 * Composant qui affiche des toasts de suggestion de rapprochement
 * quand une transaction bancaire correspond potentiellement à une facture
 */
export function ReconciliationToastProvider({ children }) {
  const router = useRouter();
  const {
    suggestions,
    linkTransaction,
    refetch: fetchSuggestions,
    loading,
    error,
  } = useReconciliation();
  const toastManager = useToastManager();
  const [shownSuggestions, setShownSuggestions] = useState(new Set());
  const [ignoredSuggestions, setIgnoredSuggestions] = useState(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  // Log pour debug
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("[RECONCILIATION-TOAST] État:", {
        suggestionsCount: suggestions?.length || 0,
        loading,
        error: error?.message,
        shownCount: shownSuggestions.size,
        ignoredCount: ignoredSuggestions.size,
      });
      if (suggestions?.length > 0) {
        console.log("[RECONCILIATION-TOAST] Suggestions:", suggestions);
      }
    }
  }, [suggestions, loading, error, shownSuggestions, ignoredSuggestions]);

  // Charger les suggestions ignorées au montage
  useEffect(() => {
    setIgnoredSuggestions(getIgnoredSuggestions());
  }, []);

  // Formater un montant en euros
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount || 0);
  };

  // Gérer le rattachement depuis le toast
  // Note: Les toasts de succès/erreur sont gérés par le hook useLinkTransactionToInvoice (via sonner)
  const handleLink = useCallback(
    async (transactionId, invoiceId, toastId) => {
      setIsProcessing(true);
      // Marquer la transaction comme traitée pour éviter qu'elle réapparaisse
      saveIgnoredSuggestion(transactionId);
      setIgnoredSuggestions((prev) => new Set([...prev, transactionId]));
      // Fermer tous les toasts de réconciliation pour éviter la confusion
      toastManager.closeAll();
      try {
        await linkTransaction(transactionId, invoiceId);
        // Le toast est géré par le hook useLinkTransactionToInvoice
      } catch (err) {
        // L'erreur est gérée par le hook
      } finally {
        setIsProcessing(false);
      }
    },
    [linkTransaction, toastManager]
  );

  // Voir les détails de la facture
  const handleViewInvoice = useCallback(
    (invoiceId, toastId) => {
      toastManager.close(toastId);
      router.push(`/dashboard/outils/factures?id=${invoiceId}`);
    },
    [router, toastManager]
  );

  // Ignorer une suggestion (ne plus l'afficher)
  const handleIgnore = useCallback(
    (transactionId, toastId) => {
      toastManager.close(toastId);
      // Sauvegarder dans localStorage pour persister
      saveIgnoredSuggestion(transactionId);
      // Mettre à jour le state local
      setIgnoredSuggestions((prev) => new Set([...prev, transactionId]));
    },
    [toastManager]
  );

  // Formater une date de manière courte
  const formatShortDate = (dateInput) => {
    if (!dateInput) return "";
    try {
      const date = new Date(dateInput);
      return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
    } catch {
      return "";
    }
  };

  // Afficher les toasts pour les nouvelles suggestions à haute confiance
  // Maintenant en pile (plusieurs toasts simultanés)
  useEffect(() => {
    if (isProcessing) return;

    const newSuggestions = suggestions.filter(
      (s) =>
        s.confidence === "high" &&
        !shownSuggestions.has(s.transaction.id) &&
        !ignoredSuggestions.has(s.transaction.id) &&
        s.matchingInvoices.length > 0
    );

    // Afficher jusqu'à 5 toasts empilés (du plus récent au plus ancien)
    const maxToasts = 5;
    const toastsToShow = newSuggestions.slice(0, maxToasts);

    if (toastsToShow.length > 0) {
      // Marquer toutes les suggestions comme affichées
      setShownSuggestions((prev) => {
        const newSet = new Set(prev);
        toastsToShow.forEach((s) => newSet.add(s.transaction.id));
        return newSet;
      });

      // Afficher chaque toast avec un léger délai pour l'effet d'empilement
      toastsToShow.forEach((suggestion, index) => {
        const transaction = suggestion.transaction;
        const invoice = suggestion.matchingInvoices[0];
        const txDate = formatShortDate(transaction.date);

        // Délai progressif pour l'animation d'empilement
        setTimeout(() => {
          const toastId = toastManager.add({
            title: `Paiement détecté : +${formatCurrency(transaction.amount)}${txDate ? ` (${txDate})` : ""}`,
            description: `${transaction.description} → Facture ${invoice.number} (${invoice.clientName})`,
            type: "reconciliation",
            timeout: 120000, // 2 minutes - les toasts de réconciliation restent longtemps
            dismissProps: {
              children: "Ignorer",
              onClick: () => handleIgnore(transaction.id, toastId),
            },
            secondaryActionProps: {
              children: "Voir",
              onClick: () => handleViewInvoice(invoice.id, toastId),
            },
            actionProps: {
              children: "Rattacher",
              onClick: () => handleLink(transaction.id, invoice.id, toastId),
            },
          });
        }, index * 150); // 150ms entre chaque toast pour l'effet d'empilement
      });

      // Si plus de suggestions que le max, afficher un toast informatif
      if (newSuggestions.length > maxToasts) {
        setTimeout(() => {
          toastManager.add({
            title: `+${newSuggestions.length - maxToasts} autres paiements détectés`,
            description: "Consultez la section Rapprochement pour voir toutes les suggestions",
            type: "info",
            timeout: 10000,
          });
        }, maxToasts * 150 + 100);
      }
    }
  }, [
    suggestions,
    shownSuggestions,
    ignoredSuggestions,
    isProcessing,
    handleLink,
    handleViewInvoice,
    handleIgnore,
    toastManager,
  ]);

  return <>{children}</>;
}
