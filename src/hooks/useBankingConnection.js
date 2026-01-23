"use client";

import { useState, useEffect } from "react";

/**
 * Récupère le token JWT depuis localStorage
 */
const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("bearer_token");
};

/**
 * Hook pour gérer la connexion bancaire
 * Supporte GoCardless (par défaut) et Bridge (legacy)
 */
export function useBankingConnection(workspaceId) {
  const [isConnected, setIsConnected] = useState(false);
  const [accountsCount, setAccountsCount] = useState(0);
  const [hasAccounts, setHasAccounts] = useState(false);
  const [provider, setProvider] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingInstitutions, setIsLoadingInstitutions] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Vérifie le statut de connexion bancaire
   */
  const checkConnectionStatus = async () => {
    if (!workspaceId) return;

    try {
      setIsLoading(true);
      setError(null);

      const token = getAuthToken();
      const response = await fetch("/api/banking-connect/status", {
        headers: {
          "x-workspace-id": workspaceId,
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.isConnected);
        setAccountsCount(data.accountsCount || 0);
        setHasAccounts(data.hasAccounts || false);
        setProvider(data.provider);
      } else {
        throw new Error("Erreur lors de la vérification du statut");
      }
    } catch (err) {
      console.warn("⚠️ Erreur vérification statut bancaire:", err.message);
      setIsConnected(false);
      setAccountsCount(0);
      setHasAccounts(false);
      setProvider(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Récupère la liste des institutions bancaires disponibles
   * @param {string} country - Code pays ISO (FR, DE, ES, etc.)
   */
  const fetchInstitutions = async (country = "FR") => {
    try {
      setIsLoadingInstitutions(true);
      setError(null);

      const token = getAuthToken();
      const response = await fetch(
        `/api/banking-connect/gocardless/institutions?country=${country}`,
        {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setInstitutions(data.institutions || []);
        return data.institutions;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur récupération institutions");
      }
    } catch (err) {
      setError(err.message);
      console.error("Erreur récupération institutions:", err);
      return [];
    } finally {
      setIsLoadingInstitutions(false);
    }
  };

  /**
   * Connecte un compte bancaire via GoCardless
   * @param {string} institutionId - ID de l'institution bancaire
   */
  const connectBank = async (institutionId) => {
    if (!workspaceId) {
      setError("Workspace non défini");
      return;
    }

    if (!institutionId) {
      setError("Veuillez sélectionner une banque");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const token = getAuthToken();
      const response = await fetch(
        `/api/banking-connect/gocardless/connect?institutionId=${institutionId}`,
        {
          headers: {
            "x-workspace-id": workspaceId,
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Rediriger vers la page de connexion de la banque
        window.location.href = data.connectUrl;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur de connexion");
      }
    } catch (err) {
      setError(err.message);
      console.error("Erreur connexion bancaire:", err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Déconnecte le compte bancaire
   * @param {string} providerToDisconnect - Provider spécifique à déconnecter (optionnel)
   */
  const disconnectBank = async (providerToDisconnect = null) => {
    if (!workspaceId) return false;

    try {
      setIsLoading(true);
      setError(null);

      const token = getAuthToken();
      const response = await fetch("/api/banking-connect/disconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-workspace-id": workspaceId,
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ provider: providerToDisconnect }),
      });

      if (response.ok) {
        setIsConnected(false);
        setAccountsCount(0);
        setHasAccounts(false);
        setProvider(null);
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur de déconnexion");
      }
    } catch (err) {
      setError(err.message);
      console.error("Erreur déconnexion bancaire:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Vérifier le statut au chargement
  useEffect(() => {
    checkConnectionStatus();
  }, [workspaceId]);

  return {
    // État
    isConnected,
    accountsCount,
    hasAccounts,
    provider,
    institutions,
    isLoading,
    isLoadingInstitutions,
    error,
    // Actions
    connectBank,
    disconnectBank,
    fetchInstitutions,
    refreshStatus: checkConnectionStatus,
  };
}
