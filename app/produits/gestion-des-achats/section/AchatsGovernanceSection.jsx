"use client";

import React from "react";
import Link from "next/link";
import OcrScanAnimation from "./OcrScanAnimation";
import ReconciliationAnimation from "./ReconciliationAnimation";
import CategorySortAnimation from "./CategorySortAnimation";

// Mêmes jetons visuels que le bento « Un logiciel de facturation complet »
// de la LP factures et « Garde le contrôle de ton activité » de la home.
const CARD =
  "rounded-3xl bg-gradient-to-b from-[#F4F4F6] to-[#FAFAFB] p-7 md:p-8 flex flex-col overflow-hidden";
const TITLE =
  "text-xl md:text-2xl font-medium tracking-tight text-gray-950 mb-3";
const TEXT = "text-[15px] leading-relaxed text-gray-700";

export default function AchatsGovernanceSection() {
  // Les illustrations ne se jouent qu'une fois : on les déclenche quand la
  // section arrive à l'écran, sinon le scénario serait déjà terminé quand on
  // y descend. `data-play` libère les animations (voir chaque illustration).
  const ref = React.useRef(null);
  const [play, setPlay] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setPlay(true);
        io.disconnect();
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      data-play={play ? "on" : undefined}
      className="pt-10 md:pt-20 lg:pt-22 lg-pb-10 relative overflow-hidden px-5"
    >
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-balance text-gray-950 mb-4">
          Tous vos achats au même endroit
        </h2>
        <p className="text-[17px] leading-relaxed text-gray-600 max-w-2xl mb-10 md:mb-14">
          Factures fournisseurs, notes de frais et justificatifs : scannés,
          catégorisés, rapprochés de vos transactions et prêts pour votre
          expert-comptable. Côté ventes, Newbi gère aussi vos{" "}
          <Link
            href="/produits/factures"
            className="text-gray-900 underline decoration-gray-300 underline-offset-2 hover:decoration-gray-900"
          >
            devis et factures
          </Link>
          , votre{" "}
          <Link
            href="/produits/tresorerie"
            className="text-gray-900 underline decoration-gray-300 underline-offset-2 hover:decoration-gray-900"
          >
            trésorerie
          </Link>{" "}
          et votre passage à la{" "}
          <Link
            href="/produits/facturation-electronique"
            className="text-gray-900 underline decoration-gray-300 underline-offset-2 hover:decoration-gray-900"
          >
            facturation électronique
          </Link>
          .
        </p>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5">
          {/* Carte principale : l'OCR fait la saisie */}
          <article className={`${CARD} md:col-span-7`}>
            <h3 className={TITLE}>
              Scannez un justificatif, l&apos;OCR fait la saisie
            </h3>
            <p className={`${TEXT} max-w-xl`}>
              Photographiez un ticket ou importez une facture d&apos;achat :
              fournisseur, date, montant et TVA sont lus automatiquement. Vous
              n&apos;avez plus qu&apos;à valider.
            </p>
            <div className="relative mt-8 flex-1 min-h-[260px] -mb-7 md:-mb-8">
              <OcrScanAnimation />
            </div>
          </article>

          {/* Le rapprochement bancaire */}
          <article className={`${CARD} md:col-span-5`}>
            <h3 className={TITLE}>
              Chaque dépense collée à sa transaction bancaire
            </h3>
            <p className={`${TEXT} max-w-md`}>
              Newbi rapproche vos justificatifs de vos opérations bancaires et
              vous montre, à tout moment, ce qu&apos;il reste à fournir.
            </p>
            <div className="relative mt-8 h-[225px] -mb-7 md:-mb-8">
              <ReconciliationAnimation />
            </div>
          </article>

          {/* La catégorisation */}
          <article className={`${CARD} md:col-span-5`}>
            <h3 className={TITLE}>
              Vos postes de dépenses, classés tout seuls
            </h3>
            <p className={`${TEXT} max-w-md`}>
              Chaque achat rejoint sa catégorie : vous voyez où part
              l&apos;argent, mois après mois, sans tenir de tableur.
            </p>
            <div className="relative mt-8 flex-1 min-h-[200px] -mb-7 md:-mb-8">
              <CategorySortAnimation />
            </div>
          </article>

          {/* Point de repos du bento : une photo, pas d'animation. Texte en
              haut, donc voile dégradé depuis le haut. */}
          <article className="relative md:col-span-7 min-h-[420px] overflow-hidden rounded-3xl flex flex-col justify-start p-7 md:p-8 text-white">
            <img
              src="/lp/achats/carte-comptable.jpg"
              alt=""
              className="absolute inset-0 size-full object-cover object-[55%_center]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/45 to-black/10" />
            <div className="relative">
              <h3 className="text-xl md:text-2xl font-medium tracking-tight mb-3">
                Un export propre pour votre comptable
              </h3>
              <p className="text-[15px] leading-relaxed text-white/85 max-w-xl">
                Achats, notes de frais et TVA déductible classés au fil de
                l&apos;eau. Votre expert-comptable récupère le mois complet au
                format FEC, CSV, Sage ou Cegid.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
