"use client";

import dynamic from "next/dynamic";

// Animations gsap des cartes « l'essentiel » de la LP auto-entrepreneur,
// chargées dans leur propre chunk (hors chemin critique). page.jsx est un
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
