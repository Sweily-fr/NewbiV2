import { useState, useEffect, useCallback } from "react";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { toast } from "@/src/components/ui/sonner";

// Fonction utilitaire pour récupérer le token JWT
const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("bearer_token");
};

/**
 * Hook pour récupérer les dépenses unifiées (transactions bancaires + dépenses manuelles)
 */
export const useUnifiedExpenses = (filters = {}) => {
  const { workspaceId } = useRequiredWorkspace();
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10000, // Charger toutes les transactions - la table gère sa propre pagination côté client
    totalCount: 0,
    hasNextPage: false,
  });

  const fetchExpenses = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", (filters.page || pagination.page).toString());
      params.set("limit", (filters.limit || pagination.limit).toString());
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);
      if (filters.category) params.set("category", filters.category);

      const token = getAuthToken();
      const response = await fetch(
        `/api/unified-expenses?${params.toString()}`,
        {
          headers: {
            "x-workspace-id": workspaceId,
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Erreur lors de la récupération des dépenses"
        );
      }

      setExpenses(data.expenses || []);
      setStats(data.stats || null);
      setPagination(
        data.pagination || {
          page: 1,
          limit: 50,
          totalCount: 0,
          hasNextPage: false,
        }
      );
    } catch (err) {
      console.error("Erreur useUnifiedExpenses:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [
    workspaceId,
    filters.page,
    filters.limit,
    filters.startDate,
    filters.endDate,
    filters.category,
    pagination.page,
    pagination.limit,
  ]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const refetch = useCallback(() => {
    return fetchExpenses();
  }, [fetchExpenses]);

  return {
    expenses,
    stats,
    loading,
    error,
    pagination,
    refetch,
  };
};

/**
 * Hook pour lier un justificatif à une transaction bancaire
 */
export const useLinkExpenseToTransaction = () => {
  const [loading, setLoading] = useState(false);

  const linkExpense = async (transactionId, expenseId) => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch("/api/unified-expenses/link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ transactionId, expenseId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors du rattachement");
      }

      toast.success("Justificatif rattaché avec succès");
      return { success: true, data };
    } catch (err) {
      console.error("Erreur linkExpense:", err);
      toast.error(err.message || "Erreur lors du rattachement");
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { linkExpense, loading };
};

/**
 * Hook pour délier un justificatif d'une transaction bancaire
 */
export const useUnlinkExpenseFromTransaction = () => {
  const [loading, setLoading] = useState(false);

  const unlinkExpense = async (transactionId) => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch("/api/unified-expenses/unlink", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ transactionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors du détachement");
      }

      toast.success("Justificatif détaché avec succès");
      return { success: true, data };
    } catch (err) {
      console.error("Erreur unlinkExpense:", err);
      toast.error(err.message || "Erreur lors du détachement");
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { unlinkExpense, loading };
};

/**
 * Hook pour mettre à jour la catégorie d'une transaction bancaire
 */
export const useUpdateTransactionCategory = () => {
  const [loading, setLoading] = useState(false);

  const updateCategory = async (transactionId, category) => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(
        `/api/unified-expenses/${transactionId}/category`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({ category }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }

      toast.success("Catégorie mise à jour");
      return { success: true, data };
    } catch (err) {
      console.error("Erreur updateCategory:", err);
      toast.error(err.message || "Erreur lors de la mise à jour");
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { updateCategory, loading };
};
