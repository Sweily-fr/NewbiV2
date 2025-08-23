"use client";

import { useState, useEffect } from "react";

export function useBankingConnection(workspaceId) {
  const [isConnected, setIsConnected] = useState(false);
  const [accountsCount, setAccountsCount] = useState(0);
  const [bridgeUserExists, setBridgeUserExists] = useState(false);
  const [hasAccounts, setHasAccounts] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkConnectionStatus = async () => {
    if (!workspaceId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/banking-connect/status", {
        headers: {
          "x-workspace-id": workspaceId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.isConnected);
        setAccountsCount(data.accountsCount || 0);
        // Stocker les nouvelles propriétés
        setBridgeUserExists(data.bridgeUserExists || false);
        setHasAccounts(data.hasAccounts || false);
      } else {
        throw new Error("Erreur lors de la vérification du statut");
      }
    } catch (err) {
      setError(err.message);
      console.error("Erreur vérification statut bancaire:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const connectBank = async () => {
    if (!workspaceId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/banking-connect/bridge/connect", {
        headers: {
          "x-workspace-id": workspaceId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Rediriger vers l'URL de connexion Bridge
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

  const disconnectBank = async () => {
    if (!workspaceId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/banking-connect/disconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-workspace-id": workspaceId,
        },
      });

      if (response.ok) {
        setIsConnected(false);
        setAccountsCount(0);
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
    isConnected,
    accountsCount,
    bridgeUserExists,
    hasAccounts,
    isLoading,
    error,
    connectBank,
    disconnectBank,
    refreshStatus: checkConnectionStatus,
  };
}
