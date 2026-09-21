"use client";

import dynamic from "next/dynamic";

// Bento « Ce que tu ne feras plus jamais à la main » : même disposition que
// « Tout ce qu'il te faut pour facturer » sur /lp/facturation-electronique
// (7/5 puis 4/4/4, cartes gris dégradé sans bordure), avec les 5 bénéfices
// d'origine. Visuels sobres (façon Linear / Notion) ancrés en bas à gauche et
// sortant de la carte ; animés pour devis → facture et reçu scanné.
const QuoteToInvoiceVisual = dynamic(
  () => import("./QuoteToInvoiceAnimation"),
  { ssr: false },
);
const ReceiptScanVisualAnimated = dynamic(
  () => import("./ReceiptScanAnimation"),
  { ssr: false },
);
import BankMatchStatic from "./BankMatchVisual";
import TeamAccessVisual from "./TeamAccessVisual";

const CARD =
  "rounded-3xl bg-gradient-to-b from-[#F4F4F6] to-[#FAFAFB] p-7 md:p-8 flex flex-col overflow-hidden";
const TITLE =
  "text-xl md:text-2xl font-medium tracking-tight text-gray-950 mb-3";
const TEXT = "text-[15px] leading-relaxed text-gray-700";

export default function BenefitsBento({
  title = "Ce que tu ne feras plus jamais à la main",
  items,
}) {
  const [a, b, c, d, e] = items;
  return (
    <section className="px-5 py-14 md:py-20">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-balance text-gray-950 mb-10 md:mb-14">
          {title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5">
          {/* Ligne 1 — devis → facture (large, animé) + relances */}
          <article
            className={`${CARD} md:col-span-7 min-h-[420px] pb-0 md:pb-0`}
          >
            <h3 className={TITLE}>{a.title}</h3>
            <p className={`${TEXT} max-w-lg`}>{a.desc}</p>
            {/* Zone visuel : le document est ancré en bas à gauche et sort du
                cadre de la carte */}
            <div className="relative flex-1 min-h-[300px] mt-6 -mx-7 md:-mx-8">
              <QuoteToInvoiceVisual />
            </div>
          </article>

          {/* Carte photo : même image que la bannière CTA, texte en blanc sur
              un voile sombre */}
          <article className="relative rounded-3xl overflow-hidden min-h-[320px] md:col-span-5 flex flex-col justify-end p-7 md:p-8 text-white">
            <img
              src="/lp/facturation-electronique/cta-laptop.jpg"
              alt=""
              className="absolute inset-0 size-full object-cover object-[60%_center]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/10" />
            <div className="relative">
              <h3 className="text-xl md:text-2xl font-medium tracking-tight mb-3">
                {b.title}
              </h3>
              <p className="text-[15px] leading-relaxed text-white/85">
                {b.desc}
              </p>
            </div>
          </article>

          {/* Ligne 2 — reçus (animé), banque et comptable (statiques) ; les
              trois visuels sortent du bas de leur carte */}
          <article className={`${CARD} md:col-span-4 pb-0 md:pb-0`}>
            <h3 className={TITLE}>{c.title}</h3>
            <p className={TEXT}>{c.desc}</p>
            <div className="relative flex-1 min-h-[230px] mt-6 -mx-7 md:-mx-8">
              <ReceiptScanVisualAnimated />
            </div>
          </article>
          <article className={`${CARD} md:col-span-4 pb-0 md:pb-0`}>
            <h3 className={TITLE}>{d.title}</h3>
            <p className={TEXT}>{d.desc}</p>
            <div className="relative flex-1 min-h-[230px] mt-6 -mx-7 md:-mx-8">
              <BankMatchStatic />
            </div>
          </article>
          <article className={`${CARD} md:col-span-4 pb-0 md:pb-0`}>
            <h3 className={TITLE}>{e.title}</h3>
            <p className={TEXT}>{e.desc}</p>
            <div className="relative flex-1 min-h-[260px] mt-6 -mx-7 md:-mx-8">
              <TeamAccessVisual />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
