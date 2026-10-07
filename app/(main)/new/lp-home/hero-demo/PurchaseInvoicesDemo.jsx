"use client";

import React from "react";
import s from "./hero-demo.module.css";
import PurchaseInvoicesView from "./PurchaseInvoicesView";

/* Même maquette que le hero de /produits/tresorerie : l'image du mockup iPad
   sert de cadre (coque, sidebar, barre du haut) et seul le panneau de droite
   est reconstruit en HTML, calé sur la zone vide de l'image.

   On réutilise ici la mécanique de HeroDemo (scène de 1200 x 643 mise à
   l'échelle sur la largeur disponible) plutôt que des pixels figés : le hero
   de la facturation électronique affiche la maquette surdimensionnée et
   débordante à droite, l'échelle doit donc pouvoir dépasser 1.

   Statique, contrairement à HeroDemo : pas de GSAP, pas de bascule de vue. */

const DESIGN_W = 1200;
const DESIGN_H = 643;

export default function PurchaseInvoicesDemo({ className = "" }) {
  const wrapRef = React.useRef(null);
  const [scale, setScale] = React.useState(1);

  React.useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setScale(el.clientWidth / DESIGN_W);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      className={`${s.wrap} ${className}`.trim()}
      style={{ height: DESIGN_H * scale }}
    >
      <div className={s.stage} style={{ transform: `scale(${scale})` }}>
        <img
          className={s.device}
          src="/lp/tresorerie/ipad-mockup.png"
          alt="Interface Newbi : les factures d'achat reçues des fournisseurs, avec leur échéance, leur catégorie et leur statut de paiement"
          width={2400}
          height={1286}
        />
        <div className={s.panel}>
          <div className={s.layer}>
            <PurchaseInvoicesView />
          </div>
        </div>

        {/* Badge de conformité, posé dans la maquette juste au-dessus de
            l'encadré violet « Facturation électronique » de la sidebar —
            mêmes repères que sur le hero de la LP factures. Les positions
            sont en pourcentages de la scène, qui a exactement le cadrage de
            l'image : elles suivent donc la mise à l'échelle.
            Pas de lien ici, contrairement à la LP factures : la page de
            destination est celle sur laquelle le badge est affiché. */}
        <span className="absolute left-[6.4%] top-[51.6%] z-10 flex w-[11.7%] items-center justify-center rounded-sm bg-white p-[0.9%]">
          <img
            src="/logo_Compatible_Facturation_electronique-footer.png"
            alt="Conforme Facturation électronique 2026"
            width={621}
            height={289}
            className="h-auto w-full object-contain"
          />
        </span>
      </div>
    </div>
  );
}
