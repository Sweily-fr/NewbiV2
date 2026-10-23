import { useEffect, useRef } from "react";

/**
 * Remet en haut les zones de défilement qui contiennent `ref` (l'élément
 * lui-même et tous ses parents) quand une des valeurs de `deps` change.
 * Sert aux tableaux paginés : sans ça, la page suivante s'affiche dans une
 * zone restée en bas (visible surtout sur les petits écrans et sous Windows).
 *
 * @param {React.RefObject<HTMLElement>} ref - Élément situé dans la zone de défilement
 * @param {Array} deps - Valeurs qui déclenchent la remontée (page, taille, onglet...)
 */
export function useScrollTopOnChange(ref, deps) {
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    let el = ref.current;
    while (el && el !== document.body) {
      if (el.scrollTop > 0) el.scrollTop = 0;
      el = el.parentElement;
    }
    if (window.scrollY > 0) window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
