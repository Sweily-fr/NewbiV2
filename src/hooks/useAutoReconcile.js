"use client";

import { useState, useCallback } from "react";
import { useRequiredWorkspace } from "./useWorkspace";
import { toast } from "@/src/components/ui/sonner";

/**
 * Hook pour le rapprochement automatique OCR ↔ Transaction bancaire
 */
export const useAutoReconcile = () => {
  const { workspaceId } = useRequiredWorkspace();
  const [isSearching, setIsSearching] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [reconcileResult, setReconcileResult] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Chercher une transaction bancaire correspondante
   * @param {Object} params - { amount, date, vendor }
   * @returns {Promise<Object>} - Résultat de la recherche
   */
  const findMatchingTransaction = useCallback(
    async ({ amount, date, vendor }) => {
      if (!workspaceId) {
        setError("Workspace non défini");
        return null;
      }

      setIsSearching(true);
      setError(null);

      try {
        const response = await fetch("/api/unified-expenses/match", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount,
            date,
            vendor,
            workspaceId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erreur lors de la recherche");
        }

        setMatchResult(data);
        return data;
      } catch (err) {
        console.error("❌ Erreur recherche correspondance:", err);
        setError(err.message);
        return null;
      } finally {
        setIsSearching(false);
      }
    },
    [workspaceId]
  );

  /**
   * Rapprocher automatiquement un fichier avec une transaction
   * @param {File} file - Fichier à uploader
   * @param {Object} ocrData - Données OCR extraites
   * @param {string|null} transactionId - ID de la transaction à lier (optionnel)
   * @returns {Promise<Object>} - Résultat du rapprochement
   */
  const autoReconcile = useCallback(
    async (file, ocrData = null, transactionId = null) => {
      if (!workspaceId) {
        setError("Workspace non défini");
        return null;
      }

      setIsReconciling(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("workspaceId", workspaceId);

        if (transactionId) {
          formData.append("transactionId", transactionId);
        }

        if (ocrData) {
          formData.append("ocrData", JSON.stringify(ocrData));
        }

        const response = await fetch("/api/unified-expenses/auto-reconcile", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erreur lors du rapprochement");
        }

        setReconcileResult(data);

        // Afficher un toast selon le résultat
        if (data.action === "auto-matched") {
          toast.success(
            "Justificatif automatiquement lié à une transaction bancaire !",
            {
              description: `Transaction: ${data.matchedTransaction?.description || ""}`,
            }
          );
        } else if (data.action === "linked") {
          toast.success("Justificatif lié à la transaction");
        } else if (data.action === "created") {
          toast.info("Aucune transaction correspondante. Dépense créée.", {
            description: "Vous pouvez la lier manuellement si nécessaire.",
          });
        }

        return data;
      } catch (err) {
        console.error("❌ Erreur rapprochement:", err);
        setError(err.message);
        toast.error("Erreur lors du rapprochement", {
          description: err.message,
        });
        return null;
      } finally {
        setIsReconciling(false);
      }
    },
    [workspaceId]
  );

  /**
   * Réinitialiser l'état
   */
  const reset = useCallback(() => {
    setMatchResult(null);
    setReconcileResult(null);
    setError(null);
  }, []);

  return {
    // États
    isSearching,
    isReconciling,
    isLoading: isSearching || isReconciling,
    matchResult,
    reconcileResult,
    error,

    // Actions
    findMatchingTransaction,
    autoReconcile,
    reset,
  };
};

export default useAutoReconcile;
