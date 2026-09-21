"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import LpCtaButton from "../../_components/LpCtaButton";
import { CTA_SUBLABEL } from "../../_components/lp-config";

gsap.registerPlugin(ScrollTrigger);

// Hero de la LP gestion : titre centré sur fond pointillé, entouré de
// mini-interfaces flottantes (reçus scannés, personnalisation, factures,
// rapprochement bancaire) qui montrent le produit sans capture d'écran.
// Au scroll (desktop) : le hero reste épinglé pendant que le mockup iPad
// monte depuis le bas et prend la place du texte, les cartes s'écartent.
// Sur mobile : pas d'épinglage, le mockup suit simplement le texte.

const DEVICE_IMAGE = "/lp/facturation-electronique/hero-ipad-factures.png";

// Direction de sortie des cartes flottantes pendant le scroll
// (assez loin pour sortir complètement de l'écran, sans fondu)
const CARD_EXIT = {
  tl: { x: -520, y: -260 },
  bl: { x: -520, y: 260 },
  tr: { x: 520, y: -260 },
  br: { x: 520, y: 260 },
};

function FloatingCard({ className = "", corner, children }) {
  return (
    <div
      data-hero-card={corner}
      className={`absolute hidden lg:block rounded-2xl bg-white border border-gray-200/80 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.25)] ${className}`}
    >
      {children}
    </div>
  );
}

function Chip({ tone = "gray", children }) {
  const tones = {
    gray: "bg-gray-100 text-gray-600",
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
    violet: "bg-[#5A50FF]/10 text-[#5A50FF]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export default function HeroSection({
  eyebrow,
  title,
  subtitle,
  proof,
  secondaryLabel = "Voir les tarifs",
  secondaryHref = "#pricing",
}) {
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const mm = gsap.matchMedia();
    mm.add(
      "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
      () => {
        const device = section.querySelector("[data-hero-device]");
        const text = section.querySelector("[data-hero-text]");
        const title = section.querySelector("[data-hero-title]");
        const cards = section.querySelectorAll("[data-hero-card]");

        // Mockup centré (transform GSAP), parqué sous le viewport au départ et
        // incliné en perspective ; il se redresse en montant
        // La perspective doit être sur le parent direct du mockup pour que
        // l'inclinaison 3D soit visible
        gsap.set(device.parentElement, { perspective: 1200 });
        gsap.set(device, {
          xPercent: -50,
          yPercent: 75,
          scale: 0.92,
          rotateX: 35,
          transformOrigin: "50% 100%",
          transformStyle: "preserve-3d",
        });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.6,
          },
        });

        // Le bloc texte reste en place : seul le H1 rétrécit en s'estompant,
        // le reste (sous-titre, boutons) s'estompe sans bouger
        tl.to(
          title,
          { scale: 0.6, opacity: 0, duration: 0.4, ease: "none" },
          0.5,
        );
        tl.to(text, { opacity: 0, duration: 0.3, ease: "none" }, 0.55);
        cards.forEach((card) => {
          const dir = CARD_EXIT[card.dataset.heroCard] || CARD_EXIT.tl;
          tl.to(card, { ...dir, duration: 0.6, ease: "none" }, 0.3);
        });
        tl.to(
          device,
          { yPercent: -50, scale: 1, duration: 1, ease: "none" },
          0,
        );
        tl.to(device, { rotateX: 0, duration: 0.7, ease: "none" }, 0.1);
      },
    );

    return () => mm.revert();
  }, []);

  return (
    <section
      id="lp-hero"
      ref={sectionRef}
      className="relative isolate px-5 lg:px-0 lg:h-[220vh]"
    >
      {/* Sur desktop, ce bloc reste collé en haut pendant le scroll de la
          section ; sur mobile il s'affiche normalement */}
      <div className="relative overflow-hidden pt-14 md:pt-20 pb-14 lg:pb-0 lg:sticky lg:top-0 lg:h-screen lg:pt-[var(--lp-top)] lg:flex lg:items-center">
        <div className="relative w-full max-w-6xl mx-auto lg:px-5 lg:h-full flex items-center lg:items-start lg:pt-36 justify-center">
          {/* Texte central */}
          <div data-hero-text className="max-w-3xl mx-auto text-center">
            {eyebrow && (
              <p className="inline-flex items-center gap-2 text-sm font-medium text-[#5A50FF] mb-6">
                <span className="size-1.5 rounded-full bg-[#5A50FF]" />
                {eyebrow}
              </p>
            )}
            <h1
              data-hero-title
              className="origin-center text-balance font-medium text-[2.5rem] sm:text-5xl md:text-6xl lg:text-[4.25rem] leading-[1.08] tracking-tight"
            >
              {title}
            </h1>
            {/* Sous-titre et boutons : mêmes styles que le hero de
              /lp/facturation-electronique */}
            <h2 className="mt-4 lg:mt-6 text-base sm:text-lg font-normal tracking-tight text-gray-600 mb-6 lg:mb-8 max-w-xl mx-auto">
              {subtitle}
            </h2>
            <div className="flex flex-col items-center">
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <LpCtaButton
                  dark
                  sublabel={null}
                  className="w-full sm:w-auto"
                />
                <Link
                  href={secondaryHref}
                  className="inline-flex items-center justify-center w-full sm:w-auto rounded-xl px-8 py-3 text-base font-medium text-gray-900 bg-white border border-gray-300 hover:bg-gray-50 transition duration-200 active:scale-[0.98]"
                >
                  {secondaryLabel}
                </Link>
              </div>
              <p className="text-gray-400 text-xs pt-3 text-center">
                {CTA_SUBLABEL}
              </p>
            </div>
            {proof && (
              <p className="mt-6 text-xs sm:text-sm text-gray-600">{proof}</p>
            )}
          </div>

          {/* ── Cartes flottantes ── */}

          {/* Haut gauche : reçus scannés */}
          <FloatingCard
            corner="tl"
            className="-left-6 xl:-left-10 top-16 w-[190px] p-3 -rotate-1"
          >
            <p className="text-[11px] font-semibold text-gray-900 mb-2.5">
              Scanne tes reçus
            </p>
            <div className="relative rounded-xl border border-dashed border-gray-300 h-[66px] flex items-center justify-center">
              {/* Icône upload (lucide `upload`), dans une pastille grise */}
              <span className="flex size-9 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3v12" />
                  <path d="m17 8-5-5-5 5" />
                  <path d="M21 15v2a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-2" />
                </svg>
              </span>
              <div className="absolute -right-6 -bottom-9 flex flex-col items-start gap-1.5">
                {[
                  "ticket-resto.jpg",
                  "facture-ovh.pdf",
                  "note-de-frais.pdf",
                ].map((f) => (
                  <span
                    key={f}
                    className="rounded-lg bg-white border border-gray-200 shadow-sm px-2 py-0.5 text-[10px] text-gray-800"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-8 flex items-center justify-between text-[10px] text-gray-600">
              <span>TVA lue auto.</span>
              <Chip tone="green">✓ classé</Chip>
            </div>
          </FloatingCard>

          {/* Bas gauche : personnalisation des documents — style sobre
            (façon Linear / Notion) : lignes de réglages, pas d'aperçu chargé */}
          <FloatingCard
            corner="bl"
            className="-left-2 xl:-left-6 bottom-12 w-[220px] p-0 rotate-1"
          >
            <div className="px-3.5 pt-3 pb-2.5 border-b border-gray-100">
              <p className="text-[11px] font-medium text-gray-900">
                Personnalisation
              </p>
            </div>
            <div className="px-3.5 py-2.5 space-y-2.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Logo</span>
                <span className="flex items-center gap-1.5 text-gray-900">
                  <img
                    src="/newbi-icon.png"
                    alt=""
                    className="size-4 rounded"
                  />
                  newbi.png
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Couleur</span>
                <span className="flex items-center gap-1.5 text-gray-900">
                  <span className="size-3 rounded-full bg-[#5A50FF]" />
                  #5A50FF
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Police</span>
                <span className="text-gray-900">Inter</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Mentions</span>
                <span className="flex items-center gap-1 text-gray-900">
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  Auto
                </span>
              </div>
            </div>
            <div className="px-3.5 py-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
              <span>Appliqué à devis, factures, avoirs</span>
            </div>
          </FloatingCard>

          {/* Haut droite : factures et statuts + badge officiel */}
          <FloatingCard
            corner="tr"
            className="-right-6 xl:-right-10 top-20 w-[210px] p-1.5 rotate-1"
          >
            <div className="absolute -top-8 -right-6 rounded-xl bg-white border border-gray-200 shadow-md px-2 py-1.5">
              <img
                src="/logo_Compatible_Facturation_electronique-footer.png"
                alt="Solution compatible facturation électronique"
                className="h-9 w-auto object-contain"
              />
            </div>
            {[
              ["Atelier Horizon", "Payée", "green"],
              ["Studio Lumière", "Relance J+10", "blue"],
              ["Novacom Agency", "Brouillon", "gray"],
            ].map(([name, status, tone], i) => (
              <div
                key={name}
                className={`flex items-center justify-between rounded-xl px-2.5 py-2 text-[11px] text-gray-900 ${
                  i === 0
                    ? "bg-white shadow-sm border border-gray-200/80 -ml-2 mr-2"
                    : ""
                } ${i === 2 ? "opacity-50" : ""}`}
              >
                <span className="whitespace-nowrap">{name}</span>
                <Chip tone={tone}>{status}</Chip>
              </div>
            ))}
          </FloatingCard>

          {/* Bas droite : rapprochement bancaire */}
          <FloatingCard
            corner="br"
            className="right-0 xl:-right-4 bottom-28 w-[195px] p-2.5"
          >
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-700">
                €
              </span>
              <div className="text-[11px] text-gray-900 leading-snug">
                Virement reçu <span className="font-semibold">3 240,00 €</span>
                <br />
                <span className="text-gray-500">Atelier Horizon</span>
              </div>
            </div>
          </FloatingCard>
          <FloatingCard
            corner="br"
            className="-right-6 xl:-right-10 bottom-8 w-[210px] p-2.5 border-[#5A50FF]/40"
          >
            <div className="flex items-start gap-2.5">
              <img src="/newbi-icon.png" alt="" className="size-7 rounded-lg" />
              <div className="text-[11px] text-gray-900 leading-snug">
                Paiement rapproché avec la facture :
                <div className="mt-1.5 flex w-fit items-center gap-1.5 rounded-md border border-gray-200 px-2 py-0.5 text-[11px] text-gray-700">
                  F-2026-041
                  <span className="text-green-600">✓ payée</span>
                </div>
              </div>
            </div>
          </FloatingCard>
        </div>

        {/* Voile flou en bas du hero (desktop) : l'interface semble sortir du
          flou en montant */}
        <div
          aria-hidden="true"
          className="hidden lg:block pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[18vh] bg-gradient-to-t from-[#FDFDFD] via-[#FDFDFD]/70 to-transparent backdrop-blur-[3px] [mask-image:linear-gradient(to_top,black_40%,transparent)]"
        />

        {/* Mockup iPad : sous le texte sur mobile ; sur desktop, centré dans le
          viewport et animé au scroll (GSAP pilote sa transformation) */}
        <div
          data-hero-device
          className="relative mt-10 w-full max-w-6xl mx-auto lg:absolute lg:mt-0 lg:top-1/2 lg:left-1/2 lg:w-[min(1050px,84vw)] lg:will-change-transform"
        >
          <img
            src={DEVICE_IMAGE}
            alt="Interface Newbi sur iPad : liste des factures clients avec statuts"
            width="2200"
            height="1268"
            className="w-full h-auto"
            loading="eager"
            fetchPriority="high"
          />
        </div>
      </div>
    </section>
  );
}
