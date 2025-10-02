import { useState, useCallback } from "react";
import { useSession } from "@/src/lib/auth-client";
import { toast } from "@/src/components/ui/sonner";

/**
 * Hook pour gérer la facturation par siège
 * Permet de récupérer les informations de facturation et forcer une synchronisation
 */
export const useSeatBilling = () => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [billingInfo, setBillingInfo] = useState(null);

  /**
   * Récupère les informations de facturation actuelles
   */
  const fetchBillingInfo = useCallback(async (organizationId) => {
    if (!organizationId) {
      console.warn("⚠️ organizationId requis pour récupérer les infos de facturation");
      return null;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/billing/sync-seats?organizationId=${organizationId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur récupération facturation");
      }

      const data = await response.json();
      setBillingInfo(data);
      return data;
    } catch (error) {
      console.error("❌ Erreur récupération info facturation:", error);
      toast.error("Impossible de récupérer les informations de facturation");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Force une synchronisation manuelle des sièges
   * Utile pour corriger des désynchronisations
   */
  const syncSeats = useCallback(async (organizationId) => {
    if (!organizationId) {
      toast.error("Organization ID requis");
      return { success: false };
    }

    setLoading(true);
    try {
      console.log(`🔄 Synchronisation manuelle des sièges pour ${organizationId}`);

      const response = await fetch("/api/billing/sync-seats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur synchronisation");
      }

      const result = await response.json();
      
      console.log(`✅ Synchronisation réussie:`, result);
      toast.success(result.message || "Facturation synchronisée avec succès");
      
      // Rafraîchir les infos de facturation
      await fetchBillingInfo(organizationId);
      
      return { success: true, data: result };
    } catch (error) {
      console.error("❌ Erreur synchronisation sièges:", error);
      toast.error(error.message || "Erreur lors de la synchronisation");
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [fetchBillingInfo]);

  /**
   * Formate le coût pour l'affichage
   */
  const formatCost = useCallback((amount, currency = "EUR") => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency
    }).format(amount);
  }, []);

  return {
    // Données
    billingInfo,
    
    // Actions
    fetchBillingInfo,
    syncSeats,
    formatCost,
    
    // États
    loading,
  };
};
