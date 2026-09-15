"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * Géométrie d'une pile de cartes (bandeaux de rapprochement) : mesure la
 * hauteur réelle de chaque carte pour que le mode déplié les place bout à
 * bout sans chevauchement. Avant, une hauteur estimée fixe faisait se
 * recouvrir les cartes dès qu'un libellé passait sur deux lignes.
 *
 * @param {string[]} ids identifiants des cartes visibles, dans l'ordre
 * @param {{ gap?: number, fallbackHeight?: number }} options
 * @returns {{ setRef: (id: string) => (el: HTMLElement|null) => void,
 *   heightOf: (id: string) => number, offsets: number[], expandedTotal: number }}
 */
export function useDeckLayout(ids, { gap = 12, fallbackHeight = 130 } = {}) {
  const refs = useRef(new Map());
  const [heights, setHeights] = useState({});

  // Mesure après chaque rendu ; setState uniquement si une hauteur a changé,
  // sinon la boucle rendu → mesure → setState ne s'arrêterait pas.
  useLayoutEffect(() => {
    const next = {};
    let changed = Object.keys(heights).length !== ids.length;
    for (const id of ids) {
      const el = refs.current.get(id);
      const h = el ? el.offsetHeight : 0;
      next[id] = h;
      if (heights[id] !== h) changed = true;
    }
    if (changed) setHeights(next);
  });

  const setRef = (id) => (el) => {
    if (el) refs.current.set(id, el);
    else refs.current.delete(id);
  };
  const heightOf = (id) => heights[id] || fallbackHeight;

  const offsets = [];
  let acc = 0;
  for (const id of ids) {
    offsets.push(acc);
    acc += heightOf(id) + gap;
  }
  const expandedTotal = acc > 0 ? acc - gap : 0;

  return { setRef, heightOf, offsets, expandedTotal };
}
