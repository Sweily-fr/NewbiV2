"use client";

import { useEffect } from "react";

const STORAGE_KEY = "newbi_force_desktop";
const DESKTOP_WIDTH = 1440;

/**
 * Force l'affichage de la mise en page desktop même sur un écran mobile,
 * via l'URL `?desktop=1` (persisté pour la session de navigation).
 *
 * Nécessaire car notre meta viewport est en `width=device-width`, ce qui
 * prime sur le mode "Demander la version ordinateur" des navigateurs mobiles :
 * en changeant dynamiquement la largeur du viewport déclarée, on force le
 * navigateur à ré-évaluer les media queries comme sur un écran large.
 */
export function ForceDesktopViewport() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has("desktop")) {
        sessionStorage.setItem(
          STORAGE_KEY,
          params.get("desktop") === "1" ? "1" : "0",
        );
      }

      if (sessionStorage.getItem(STORAGE_KEY) !== "1") return;

      const metas = document.querySelectorAll('meta[name="viewport"]');
      let meta = metas[0];
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "viewport";
        document.head.appendChild(meta);
      }
      for (let i = 1; i < metas.length; i++) metas[i].remove();

      const scale = window.innerWidth / DESKTOP_WIDTH;
      meta.setAttribute(
        "content",
        `width=${DESKTOP_WIDTH}, initial-scale=${scale}, viewport-fit=cover`,
      );
    } catch {
      // Best-effort : jamais bloquant pour l'affichage normal
    }
  }, []);

  return null;
}
