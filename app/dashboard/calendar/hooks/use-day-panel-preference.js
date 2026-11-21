"use client";

import { useCallback, useEffect, useState } from "react";

// Choix gardé dans le navigateur, comme les autres réglages d'affichage
// (barre de gauche, filtres du calendrier, vue du kanban)
export const DAY_PANEL_KEY = "newbi:calendar:day-panel";

/**
 * Volet du jour de la vue mois : fermé par la personne ou non, retrouvé à
 * la visite suivante. Lu après le premier rendu (le rendu serveur ne
 * connaît pas le stockage) ; ouvert tant que rien n'est retenu.
 * Renvoie [hidden, setHidden].
 */
export function useDayPanelPreference() {
  const [hidden, setHiddenState] = useState(false);

  useEffect(() => {
    try {
      setHiddenState(localStorage.getItem(DAY_PANEL_KEY) === "hidden");
    } catch {
      // Stockage indisponible : volet ouvert
    }
  }, []);

  const setHidden = useCallback((next) => {
    setHiddenState(next);
    try {
      localStorage.setItem(DAY_PANEL_KEY, next ? "hidden" : "visible");
    } catch {
      // Stockage indisponible : choix non retenu
    }
  }, []);

  return [hidden, setHidden];
}
