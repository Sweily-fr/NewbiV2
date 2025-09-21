"use client";

import { useState, useCallback } from "react";

/**
 * Hook pour gérer l'ouverture du modal de paramètres
 * avec un onglet initial spécifique
 */
export function useSettingsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [initialTab, setInitialTab] = useState("preferences");

  const openSettings = useCallback((tab = "preferences") => {
    setInitialTab(tab);
    setIsOpen(true);
  }, []);

  const closeSettings = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openCompanySettings = useCallback(() => {
    openSettings("generale");
  }, [openSettings]);

  const openLegalSettings = useCallback(() => {
    openSettings("informations-legales");
  }, [openSettings]);

  return {
    isOpen,
    initialTab,
    openSettings,
    closeSettings,
    openCompanySettings,
    openLegalSettings,
  };
}
