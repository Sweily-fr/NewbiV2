import { useEffect, useRef, useState } from "react";

/**
 * Windowing "de contenu" basé sur IntersectionObserver.
 *
 * Le but : ne monter le contenu lourd d'une ligne/carte (popovers, avatars,
 * tags, tooltips…) QUE lorsqu'elle entre dans la zone visible (+ une marge),
 * puis le reste au scroll. Le conteneur de la ligne reste, lui, toujours monté
 * (taille réservée via min-height) — indispensable pour ne pas casser le
 * drag & drop maison qui repose sur la position DOM (data-dnd-*, index, zones).
 *
 * Montage unique (once) : une fois affichée, la ligne le reste — on évite ainsi
 * de démonter un popover ouvert ou de recréer le DOM en boucle pendant le scroll.
 *
 * @param {object}   [opts]
 * @param {React.RefObject<HTMLElement>} [opts.rootRef] Conteneur scrollable de
 *        référence. Si absent, on détecte automatiquement le premier ancêtre
 *        scrollable (fallback un peu plus coûteux).
 * @param {string}   [opts.rootMargin] Marge de pré-chargement autour du root.
 * @returns {[React.RefObject<HTMLElement>, boolean]} [ref, isVisible]
 */
export function useLazyVisible({ rootRef, rootMargin = "800px 0px" } = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return; // montage unique : plus rien à observer
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true); // environnement sans IO → rendu immédiat
      return;
    }

    const root = rootRef?.current ?? findScrollParent(el);
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { root, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible, rootRef, rootMargin]);

  return [ref, visible];
}

function findScrollParent(el) {
  let node = el?.parentElement;
  while (node) {
    const oy = getComputedStyle(node).overflowY;
    if (
      (oy === "auto" || oy === "scroll") &&
      node.scrollHeight > node.clientHeight
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return null; // viewport
}
