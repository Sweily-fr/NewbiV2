"use client";

import { useEffect, useRef, useState } from "react";

// Marqueur posé sur le conteneur des toasts : une interaction à l'intérieur
// (rattacher, ignorer, ouvrir) ne doit pas les masquer.
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
 * - Masqués tant qu'un panneau (drawer, sidebar, dialog) est ouvert : on ne
 *   superpose pas une suggestion à un écran de travail.
 * - Masqués dès que l'utilisateur agit ailleurs sur la page (clic, touche),
 *   et jusqu'à ce qu'une suggestion encore jamais vue arrive. Une suggestion
 *   déjà écartée par une interaction ne revient donc pas toute seule.
 *
 * @param {string[]} suggestionIds ids (transaction) des suggestions actives
 * @returns {boolean} true si les toasts peuvent s'afficher
 */
export function useReconciliationToastVisibility(suggestionIds) {
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const seenIdsRef = useRef(new Set());

  // Nouvelle suggestion jamais vue → réaffichage (annule un masquage
  // par interaction). Les ids déjà vus restent mémorisés.
  const idsKey = [...suggestionIds].sort().join("|");
  useEffect(() => {
    let hasNew = false;
    for (const id of suggestionIds) {
      if (!seenIdsRef.current.has(id)) {
        seenIdsRef.current.add(id);
        hasNew = true;
      }
    }
    if (hasNew) setDismissed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  // Interaction hors du toast → masquage.
  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const onInteract = (event) => {
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest(`[${RECONCILIATION_TOAST_ATTR}]`)
      ) {
        return;
      }
      setDismissed(true);
    };
    document.addEventListener("pointerdown", onInteract, true);
    document.addEventListener("keydown", onInteract, true);
    return () => {
      document.removeEventListener("pointerdown", onInteract, true);
      document.removeEventListener("keydown", onInteract, true);
    };
  }, []);

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

  return !overlayOpen && !dismissed;
}
