"use client";

import dynamic from "next/dynamic";

// Animations gsap des cartes « l'essentiel », chargées dans leur propre chunk
// (hors chemin critique), comme sur /produits/transfers. page.jsx est un
// composant serveur : les dynamic() avec ssr:false vivent ici.
export const LawVisual = dynamic(() => import("./LawAnimation"), {
  ssr: false,
});
export const AutomationVisual = dynamic(() => import("./AutomationAnimation"), {
  ssr: false,
});
export const StartVisual = dynamic(() => import("./StartAnimation"), {
  ssr: false,
});
