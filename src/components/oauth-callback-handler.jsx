"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "@/src/components/ui/toast";

/**
 * Composant pour gérer les callbacks OAuth (SuperPDP, etc.)
 * Doit être enveloppé dans un Suspense boundary
 */
export function OAuthCallbackHandler({ onOpenSettings, onSetSettingsTab }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const openSettings = searchParams.get("openSettings");
    const settingsTab = searchParams.get("settingsTab");
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const message = searchParams.get("message");

    if (openSettings === "true") {
      // Ouvrir le modal de paramètres sur la bonne section
      if (settingsTab && onSetSettingsTab) {
        onSetSettingsTab(settingsTab);
      }
      if (onOpenSettings) {
        onOpenSettings(true);
      }

      // Afficher le message de succès ou d'erreur
      if (success === "true" && message) {
        toast.success(decodeURIComponent(message));
      } else if (error) {
        toast.error(decodeURIComponent(error));
      }

      // Nettoyer l'URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("openSettings");
      newUrl.searchParams.delete("settingsTab");
      newUrl.searchParams.delete("success");
      newUrl.searchParams.delete("error");
      newUrl.searchParams.delete("message");
      window.history.replaceState({}, "", newUrl.pathname);
    }
  }, [searchParams, onOpenSettings, onSetSettingsTab]);

  return null;
}
