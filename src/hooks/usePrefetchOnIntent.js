"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";

// PrefetchKind.FULL : précharge la charge RSC complète de la page, donc aussi
// ses chunks JS, et pas seulement jusqu'au loading.jsx comme le préchargement
// automatique des routes dynamiques. Passé explicitement : le défaut de
// router.prefetch devient AUTO avec le segment cache (Next 16).
const PREFETCH_FULL = { kind: "full" };

// Délai d'intention : une souris qui ne fait que traverser une liste ou la
// sidebar ne déclenche aucun préchargement.
const HOVER_INTENT_MS = 80;

const isInternalHref = (href) =>
  typeof href === "string" && href.startsWith("/") && !href.startsWith("//");

/**
 * Précharge une page du dashboard dès l'intention de clic (survol de 80 ms,
 * focus clavier, appui). Sans ça, une navigation par router.push ou vers une
 * route dynamique attend le serveur puis le JavaScript de la page APRÈS le
 * clic (70 à 200 ms de page figée, plus à la première visite).
 *
 * - prefetch(href) : préchargement immédiat (ex. à l'ouverture d'un menu).
 * - intentProps(href) : gestionnaires à poser sur l'élément cliquable.
 *
 * Le href doit être exactement celui passé à router.push (la clé du cache du
 * routeur inclut la query). Les URL externes et les ancres sont ignorées.
 */
export function usePrefetchOnIntent() {
  const router = useRouter();
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return useMemo(() => {
    const prefetch = (href) => {
      if (!isInternalHref(href)) return;
      try {
        router.prefetch(href, PREFETCH_FULL);
      } catch {
        // Préchargement au mieux : la navigation fonctionne sans.
      }
    };

    const cancel = () => {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    };

    const intentProps = (href) => ({
      onMouseEnter: () => {
        cancel();
        timerRef.current = setTimeout(() => prefetch(href), HOVER_INTENT_MS);
      },
      onMouseLeave: cancel,
      onFocus: () => prefetch(href),
      onPointerDown: () => {
        cancel();
        prefetch(href);
      },
    });

    return { prefetch, intentProps };
  }, [router]);
}
