"use client";

import { useState, useCallback } from "react";
import { useActiveOrganization } from "@/src/lib/organization-client";
import { toast } from "@/src/components/ui/sonner";

/**
 * Hook pour gérer la connexion OAuth2 SuperPDP
 */
export function useSuperPdp() {
  const { organization: activeOrg } = useActiveOrganization();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  /**
   * Vérifier le statut de connexion SuperPDP
   */
  const checkStatus = useCallback(async () => {
    if (!activeOrg?.id) return null;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/superpdp/status?organizationId=${activeOrg.id}`
      );
      const data = await response.json();

      if (data.success) {
        setStatus(data);
        return data;
      } else {
        setStatus({ connected: false });
        return { connected: false };
      }
    } catch (error) {
      console.error("Erreur vérification statut SuperPDP:", error);
      setStatus({ connected: false, error: error.message });
      return { connected: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [activeOrg?.id]);

  /**
   * Initier la connexion OAuth2 SuperPDP
   * Redirige l'utilisateur vers SuperPDP pour autorisation
   */
  const connect = useCallback(async () => {
    if (!activeOrg?.id) {
      toast.error("Aucune organisation active");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `/api/superpdp/authorize?organizationId=${activeOrg.id}`
      );
      const data = await response.json();

      if (data.success && data.authorizationUrl) {
        // Rediriger vers SuperPDP pour l'autorisation
        window.location.href = data.authorizationUrl;
      } else {
        toast.error(data.error || "Erreur lors de la connexion à SuperPDP");
      }
    } catch (error) {
      console.error("Erreur connexion SuperPDP:", error);
      toast.error("Erreur lors de la connexion à SuperPDP");
    } finally {
      setLoading(false);
    }
  }, [activeOrg?.id]);

  /**
   * Déconnecter le compte SuperPDP
   */
  const disconnect = useCallback(async () => {
    if (!activeOrg?.id) {
      toast.error("Aucune organisation active");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/superpdp/disconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ organizationId: activeOrg.id }),
      });
      const data = await response.json();

      if (data.success) {
        setStatus({ connected: false });
        toast.success("Compte SuperPDP déconnecté");
      } else {
        toast.error(data.error || "Erreur lors de la déconnexion");
      }
    } catch (error) {
      console.error("Erreur déconnexion SuperPDP:", error);
      toast.error("Erreur lors de la déconnexion");
    } finally {
      setLoading(false);
    }
  }, [activeOrg?.id]);

  return {
    loading,
    status,
    connected: status?.connected || false,
    hasTokens: status?.hasTokens || false,
    environment: status?.environment || "sandbox",
    activatedAt: status?.activatedAt,
    checkStatus,
    connect,
    disconnect,
  };
}

export default useSuperPdp;
