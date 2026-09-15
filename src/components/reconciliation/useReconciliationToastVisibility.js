"use client";

import { useEffect, useState } from "react";

// Marqueur posé sur le conteneur des toasts (repère DOM des bandeaux de
// rapprochement ; les interactions à l'intérieur n'ont aucun effet sur la
// visibilité, qui ne dépend que des panneaux ouverts).
export const RECONCILIATION_TOAST_ATTR = "data-reconciliation-toast";

// Sélecteur des panneaux qui recouvrent la page : dialogs/drawers Radix et
// vaul (role="dialog" + data-state), et les panneaux maison marqués
// data-app-overlay (sidebar facture). Le drawer transaction verrouille le
// scroll du body, détecté à part.
const OVERLAY_SELECTOR = [
  '[role="dialog"][data-state="open"]',
  "[data-app-overlay]",
].join(",");

const hasOpenOverlay = () => {
  if (typeof document === "undefined") return false;
  if (document.querySelector(OVERLAY_SELECTOR)) return true;
  if (document.body.style.overflow === "hidden") return true;
  if (document.body.hasAttribute("data-scroll-locked")) return true;
  return false;
};

/**
 * Visibilité des toasts de rapprochement.
 *
 * Masqués uniquement tant qu'un panneau (drawer, sidebar, dialog) est
 * ouvert : on ne superpose pas une suggestion à un écran de travail. Une
 * frappe clavier ou un clic ailleurs sur la page ne les masque plus (décision
 * du 15/09/2026) : chaque carte a son bouton « Masquer », c'est le seul geste
 * qui écarte une suggestion.
 *
 * @returns {boolean} true si les toasts peuvent s'afficher
 */
export function useReconciliationToastVisibility() {
  const [overlayOpen, setOverlayOpen] = useState(false);

  // Panneau ouvert → masquage, réévalué à chaque mutation du DOM (les
  // portails Radix/vaul se montent sous body ; le verrou de scroll est un
  // attribut style du body).
  useEffect(() => {
    if (
      typeof document === "undefined" ||
      typeof MutationObserver === "undefined"
    ) {
      return undefined;
    }
    let frame = null;
    const evaluate = () => {
      frame = null;
      setOverlayOpen(hasOpenOverlay());
    };
    const schedule = () => {
      if (frame === null) frame = requestAnimationFrame(evaluate);
    };
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        "data-state",
        "style",
        "data-scroll-locked",
        "data-app-overlay",
      ],
    });
    evaluate();
    return () => {
      observer.disconnect();
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  return !overlayOpen;
}
