"use client";

import { useEffect } from "react";

/**
 * Lance `preload` (des import() de composants chargés à la demande) quand le
 * navigateur est inactif, après l'affichage de la page : l'ouverture reste
 * légère, et ces morceaux sont déjà dans le navigateur au moment de s'en
 * servir, même si une nouvelle version a été mise en ligne entre-temps (sans
 * Skew Protection, les fichiers de l'ancienne version disparaissent).
 */
export function usePreloadOnIdle(preload) {
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      Promise.resolve()
        .then(preload)
        .catch(() => {});
    };
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(run, { timeout: 5000 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }
    const id = setTimeout(run, 2000);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [preload]);
}
