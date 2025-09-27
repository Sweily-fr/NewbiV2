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

    // 🚫 DÉSACTIVÉ TEMPORAIREMENT - Vérification du statut bancaire
    try {
      setIsLoading(true);
      setError(null);

      // Simulation d'un délai pour l'UX
      await new Promise(resolve => setTimeout(resolve, 300));

      // Pas de connexion bancaire pour l'instant
      setIsConnected(false);
      setAccountsCount(0);
      setBridgeUserExists(false);
      setHasAccounts(false);

      /* CODE ORIGINAL COMMENTÉ :
      const response = await fetch("/api/banking-connect/status", {
        headers: {
          "x-workspace-id": workspaceId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.isConnected);
        setAccountsCount(data.accountsCount || 0);
        setBridgeUserExists(data.bridgeUserExists || false);
        setHasAccounts(data.hasAccounts || false);
      } else {
        throw new Error("Erreur lors de la vérification du statut");
      }
      */
    } catch (err) {
      // En cas d'erreur, on ignore et on met des valeurs par défaut
      console.warn("⚠️ Erreur vérification statut bancaire (ignorée):", err.message);
      setIsConnected(false);
      setAccountsCount(0);
      setBridgeUserExists(false);
      setHasAccounts(false);
      setError(null); // On n'affiche plus l'erreur
    } finally {
      setIsLoading(false);
    }
  };

  const connectBank = async () => {
    if (!workspaceId) return;

    // 🚫 DÉSACTIVÉ TEMPORAIREMENT - Connexion bancaire
    setError("Intégration bancaire temporairement désactivée");
    return;

    /* CODE ORIGINAL COMMENTÉ :
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
    */
  };

  const disconnectBank = async () => {
    if (!workspaceId) return;

    // 🚫 DÉSACTIVÉ TEMPORAIREMENT - Déconnexion bancaire
    return false;

    /* CODE ORIGINAL COMMENTÉ :
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
    */
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
