/**
 * Hook pour gérer les icônes sociales personnalisées
 */

import { useState, useCallback, useEffect } from "react";
import { SocialIconService } from "@/src/lib/graphql/socialIcon";
import { useSignatureData } from "@/src/hooks/use-signature-data";
import { toast } from "sonner";

export function useSocialIcons() {
  const { signatureData } = useSignatureData();
  const [socialIcons, setSocialIcons] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  /**
   * Génère les icônes sociales personnalisées
   */
  const generateSocialIcons = useCallback(async (signatureId, logoUrl) => {
    if (!signatureId || !logoUrl) {
      console.warn("⚠️ signatureId et logoUrl requis pour générer les icônes");
      return { success: false, message: "Paramètres manquants" };
    }

    setIsGenerating(true);
    try {
      const result = await SocialIconService.generateCustomIcons(
        signatureId,
        logoUrl
      );

      if (result.success) {
        setSocialIcons(result.icons);
        toast.success("Icônes sociales générées avec succès !");
      } else {
        toast.error(`Erreur génération icônes: ${result.message}`);
      }

      return result;
    } catch (error) {
      toast.error("Erreur lors de la génération des icônes sociales");
      return { success: false, message: error.message };
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /**
   * Met à jour les icônes sociales quand le logo change
   */
  const updateSocialIcons = useCallback(async (signatureId, newLogoUrl) => {
    if (!signatureId || !newLogoUrl) {
      console.warn(
        "⚠️ signatureId et newLogoUrl requis pour mettre à jour les icônes"
      );
      return { success: false, message: "Paramètres manquants" };
    }

    setIsUpdating(true);
    try {
      const result = await SocialIconService.updateCustomIcons(
        signatureId,
        newLogoUrl
      );

      if (result.success) {
        setSocialIcons(result.icons);
        toast.success("Icônes sociales mises à jour !");
      } else {
        toast.error(`Erreur mise à jour icônes: ${result.message}`);
      }

      return result;
    } catch (error) {
      toast.error("Erreur lors de la mise à jour des icônes sociales");
      return { success: false, message: error.message };
    } finally {
      setIsUpdating(false);
    }
  }, []);

  /**
   * Supprime les icônes sociales personnalisées
   */
  const deleteSocialIcons = useCallback(async (signatureId) => {
    if (!signatureId) {
      return { success: false, message: "signatureId manquant" };
    }

    try {
      const result = await SocialIconService.deleteCustomIcons(signatureId);

      if (result.success) {
        setSocialIcons({});
        toast.success("Icônes sociales supprimées");
      } else {
        toast.error(`Erreur suppression icônes: ${result.message}`);
      }

      return result;
    } catch (error) {
      toast.error("Erreur lors de la suppression des icônes sociales");
      return { success: false, message: error.message };
    }
  }, []);

  /**
   * Génère automatiquement les icônes quand le logo change
   */
  useEffect(() => {
    const handleLogoChange = async () => {
      // Vérifier si on a un logo
      if (!signatureData.logo) {
        return;
      }

      // Générer un signatureId temporaire si il n'existe pas
      const currentSignatureId =
        signatureData.signatureId || `temp-${Date.now()}`;

      // Vérifier si les icônes existent déjà
      if (Object.keys(socialIcons).length > 0) {
        await updateSocialIcons(currentSignatureId, signatureData.logo);
      } else {
        await generateSocialIcons(currentSignatureId, signatureData.logo);
      }
    };

    // Déclencher la génération avec un délai pour éviter les appels multiples
    const timeoutId = setTimeout(handleLogoChange, 2000);

    return () => clearTimeout(timeoutId);
  }, [
    signatureData.logo,
    signatureData.signatureId,
    generateSocialIcons,
    updateSocialIcons,
    socialIcons,
  ]);

  /**
   * Obtient l'URL d'une icône sociale spécifique
   */
  const getSocialIconUrl = useCallback(
    (platform) => {
      return socialIcons[platform]?.url || null;
    },
    [socialIcons]
  );

  /**
   * Vérifie si les icônes sociales sont disponibles
   */
  const hasSocialIcons = useCallback(() => {
    return Object.keys(socialIcons).length > 0;
  }, [socialIcons]);

  return {
    socialIcons,
    isGenerating,
    isUpdating,
    generateSocialIcons,
    updateSocialIcons,
    deleteSocialIcons,
    getSocialIconUrl,
    hasSocialIcons,
  };
}
