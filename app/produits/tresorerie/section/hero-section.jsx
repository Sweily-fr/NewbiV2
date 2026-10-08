"use client";
import React from "react";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";
import { WhatsAppContactButton } from "@/src/components/whatsapp-contact-button";

// Portraits affichés sous les CTA : les mêmes clients que sur la LP home.
// `position` recadre chaque photo sur le visage.
const PROOF_AVATARS = [
  {
    src: "/lp/avis/maeva.jpg",
    alt: "Maëva, graphiste, cliente Newbi",
    position: "50% 18%",
  },
  {
    src: "/lp/avis/pedro-avatar.jpg",
    alt: "Pedro, commerçant, client Newbi",
    position: "50% 35%",
  },
  {
    src: "/lp/factures/41682668-4F07-4D9F-B672-DC469853793A.PNG",
    alt: "Mustafa, artisan du bâtiment, client Newbi",
    position: "50% 20%",
  },
  {
    src: "/lp/about/about-11.jpeg",
    alt: "Une cliente Newbi",
    position: "50% 25%",
  },
];

/* Repère de la maquette : le panneau HTML posé sur le mockup est calé en
   pourcentages de l'image, et ses contenus sont dimensionnés en pixels pour
   une image de 1 800 px de large. On garde donc ce repère et on met la scène
   à l'échelle de la place disponible, plutôt que de laisser le panneau se
   tasser. Le PNG fait 2 400 x 1 286, soit un rapport de 0,5358. */
const LARGEUR_SCENE = 1800;
const HAUTEUR_SCENE = Math.round(LARGEUR_SCENE * (1286 / 2400));

function MaquetteTresorerie() {
  const cadreRef = React.useRef(null);
  const [echelle, setEchelle] = React.useState(1);

  React.useLayoutEffect(() => {
    const el = cadreRef.current;
    if (!el) return;
    const mesurer = () => setEchelle(el.clientWidth / LARGEUR_SCENE);
    mesurer();
    const ro = new ResizeObserver(mesurer);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    /* Sur mobile la maquette est agrandie pour rester lisible et file vers la
       droite, comme sur la LP factures. */
    <div className="mt-10 md:mt-14 w-[150%] md:w-full">
      <div
        ref={cadreRef}
        className="relative w-full overflow-hidden"
        style={{ height: HAUTEUR_SCENE * echelle }}
      >
        <div
          className="absolute left-0 top-0"
          style={{
            width: LARGEUR_SCENE,
            height: HAUTEUR_SCENE,
            transformOrigin: "top left",
            transform: `scale(${echelle})`,
          }}
        >
          <div className="relative">
            <img
              src="/lp/tresorerie/ipad-mockup.png"
              alt="Dashboard trésorerie Newbi"
              className="w-full h-auto"
            />
            {/* Panneau de contenu du mockup, relevé sur le PNG
                        (2400 x 1286) : il commence après la sidebar et sous la
                        barre d'outils — x 471→2264, y 100→1245. En
                        pourcentages, le contenu suit la mise à l'échelle de
                        l'image quelle que soit la largeur. */}
            <div className="absolute z-10 flex flex-col gap-3 left-[19.62%] right-[5.67%] top-[7.78%] bottom-[3.19%] p-4">
              <div
                className="bg-white rounded-xl shadow-xs border border-neutral-200 p-4 flex flex-col"
                style={{ flex: "3" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-neutral-900">
                    Trésorerie
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-600 font-medium">
                      +6 766,01 €
                    </span>
                    <div className="text-[10px] text-neutral-400 bg-neutral-50 rounded px-2 py-0.5">
                      Cumul annuel
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-1">
                  <div className="flex flex-col justify-between text-[8px] text-neutral-400 py-1 pr-1">
                    <span>12K</span>
                    <span>9K</span>
                    <span>6K</span>
                    <span>3K</span>
                    <span>0€</span>
                  </div>
                  <div className="flex-1 relative">
                    <div className="absolute inset-0 flex flex-col justify-between">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="border-b border-neutral-100 w-full"
                        />
                      ))}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 flex items-end justify-around px-1 gap-[3px]">
                      {[
                        { h1: 35, h2: 20 },
                        { h1: 45, h2: 25 },
                        { h1: 30, h2: 15 },
                        { h1: 55, h2: 30 },
                        { h1: 40, h2: 22 },
                        { h1: 50, h2: 28 },
                        { h1: 60, h2: 35 },
                        { h1: 38, h2: 18 },
                        { h1: 48, h2: 26 },
                        { h1: 42, h2: 20 },
                        { h1: 52, h2: 30 },
                        { h1: 58, h2: 32 },
                      ].map((bar, i) => (
                        <div key={i} className="flex gap-[1px] items-end">
                          <div
                            className="w-[8px] bg-green-500 rounded-t-sm"
                            style={{
                              "--h": `${bar.h1}px`,
                              height: 0,
                              animation: `growBarUp 0.6s ease-out ${1.5 + i * 0.06}s forwards`,
                            }}
                          />
                          <div
                            className="w-[8px] bg-red-500 rounded-t-sm"
                            style={{
                              "--h": `${bar.h2}px`,
                              height: 0,
                              animation: `growBarUp 0.6s ease-out ${1.6 + i * 0.06}s forwards`,
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    <svg
                      className="absolute inset-0 w-full h-full"
                      viewBox="0 0 300 120"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient
                          id="treasuryGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#93c5fd"
                            stopOpacity="0.3"
                          />
                          <stop
                            offset="100%"
                            stopColor="#93c5fd"
                            stopOpacity="0"
                          />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0,80 C25,75 50,60 75,55 C100,50 125,65 150,45 C175,25 200,30 225,20 C250,15 275,18 300,15 L300,120 L0,120 Z"
                        fill="url(#treasuryGrad)"
                        opacity="0"
                        style={{
                          animation: "areaFade 1s ease-out 0.8s forwards",
                        }}
                      />
                      <path
                        d="M0,80 C25,75 50,60 75,55 C100,50 125,65 150,45 C175,25 200,30 225,20 C250,15 275,18 300,15"
                        fill="none"
                        stroke="#93c5fd"
                        strokeWidth="0.7"
                        strokeDasharray="400"
                        strokeDashoffset="400"
                        style={{
                          animation: "drawLine 1.2s ease-out 0.3s forwards",
                        }}
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2 pt-2 border-t border-neutral-100">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-sm bg-green-500" />
                    <span className="text-[9px] text-neutral-500">Entrées</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-sm bg-red-500" />
                    <span className="text-[9px] text-neutral-500">Sorties</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-sm bg-[#93c5fd]" />
                    <span className="text-[9px] text-neutral-500">
                      Trésorerie
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl shadow-xs border border-neutral-200 p-4 h-[140px] flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between mb-0">
                    <h4 className="text-[10px] font-semibold text-neutral-900">
                      Entrées
                    </h4>
                    <span className="text-[8px] text-neutral-400 bg-neutral-50 rounded px-1.5 py-0.5">
                      30j
                    </span>
                  </div>
                  <p className="text-[14px] font-bold text-neutral-900 mb-0">
                    12 480,00 €
                  </p>
                  <div className="flex-1 relative -mx-4 -mb-4 flex">
                    <div className="flex flex-col justify-between text-[6px] text-neutral-400 py-1 pl-4 pr-1">
                      <span>15K</span>
                      <span>10K</span>
                      <span>5K</span>
                      <span>0€</span>
                    </div>
                    <svg
                      className="flex-1 h-full"
                      viewBox="0 0 200 60"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient
                          id="incomeGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#22c55e"
                            stopOpacity="0.25"
                          />
                          <stop
                            offset="100%"
                            stopColor="#22c55e"
                            stopOpacity="0"
                          />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0,45 C15,42 25,38 40,30 C55,22 65,35 80,28 C95,21 110,18 125,25 C140,32 155,15 170,12 C185,9 195,14 200,10 L200,60 L0,60 Z"
                        fill="url(#incomeGrad)"
                        opacity="0"
                        style={{
                          animation: "areaFade 0.8s ease-out 1.2s forwards",
                        }}
                      />
                      <path
                        d="M0,45 C15,42 25,38 40,30 C55,22 65,35 80,28 C95,21 110,18 125,25 C140,32 155,15 170,12 C185,9 195,14 200,10"
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="0.7"
                        strokeDasharray="300"
                        strokeDashoffset="300"
                        style={{
                          animation: "drawLineIncome 1s ease-out 0.8s forwards",
                        }}
                      />
                    </svg>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-xs border border-neutral-200 p-4 h-[140px] flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between mb-0">
                    <h4 className="text-[10px] font-semibold text-neutral-900">
                      Sorties
                    </h4>
                    <span className="text-[8px] text-neutral-400 bg-neutral-50 rounded px-1.5 py-0.5">
                      30j
                    </span>
                  </div>
                  <p className="text-[14px] font-bold text-neutral-900 mb-0">
                    8 240,00 €
                  </p>
                  <div className="flex-1 relative -mx-4 -mb-4 flex">
                    <div className="flex flex-col justify-between text-[6px] text-neutral-400 py-1 pl-4 pr-1">
                      <span>10K</span>
                      <span>7K</span>
                      <span>3K</span>
                      <span>0€</span>
                    </div>
                    <svg
                      className="flex-1 h-full"
                      viewBox="0 0 200 60"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient
                          id="expenseGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#ef4444"
                            stopOpacity="0.25"
                          />
                          <stop
                            offset="100%"
                            stopColor="#ef4444"
                            stopOpacity="0"
                          />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0,35 C15,38 30,30 45,25 C60,20 75,32 90,38 C105,44 120,28 135,22 C150,16 165,30 180,35 C190,38 195,32 200,30 L200,60 L0,60 Z"
                        fill="url(#expenseGrad)"
                        opacity="0"
                        style={{
                          animation: "areaFade 0.8s ease-out 1.4s forwards",
                        }}
                      />
                      <path
                        d="M0,35 C15,38 30,30 45,25 C60,20 75,32 90,38 C105,44 120,28 135,22 C150,16 165,30 180,35 C190,38 195,32 200,30"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="0.7"
                        strokeDasharray="300"
                        strokeDashoffset="300"
                        style={{
                          animation: "drawLineIncome 1s ease-out 1s forwards",
                        }}
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <style>{`
                      @keyframes growBarUp { from { height: 0; } to { height: var(--h); } }
                      @keyframes drawLine { from { stroke-dashoffset: 400; } to { stroke-dashoffset: 0; } }
                      @keyframes areaFade { from { opacity: 0; } to { opacity: 1; } }
                      @keyframes drawLineIncome { from { stroke-dashoffset: 300; } to { stroke-dashoffset: 0; } }
                    `}</style>
          </div>
        </div>
      </div>
    </div>
  );
}

// Même disposition que le hero de /produits/factures : titre centré sur toute
// la largeur, sous-titre et boutons centrés dessous, puis la maquette en
// pleine largeur.
export function HeroSection() {
  return (
    <div className="relative w-full overflow-x-clip bg-white px-5 pb-6 md:pb-10 lg:pb-16">
      <div className="max-w-7xl mx-auto relative">
        {/* Pas de gouttière horizontale : tous les enfants occupent les douze
            colonnes, et `gap-x-24` ferait déborder la piste hors du conteneur
            entre 768 et 1 023 px. */}
        <div className="grid grid-cols-12 pt-40 md:pt-36 lg:pt-44">
          {/* Titre sur toute la largeur du conteneur */}
          <div className="col-span-12 text-center">
            {/* Même typographie et même échelle que le H1 de la LP
                factures : semi-gras, interlignage serré, noir profond. */}
            <h1 className="font-semibold text-[2.75rem] sm:text-[3.5rem] md:text-[4.25rem] lg:text-[4.5rem] leading-[1.1] tracking-tight text-[#0d0d0d] dark:text-white mb-6">
              La gestion de trésorerie, enfin simple
            </h1>
          </div>

          {/* Sous-titre, CTA et preuve sociale, centrés comme sur la LP
              factures */}
          <div className="col-span-12 lg:col-span-10 lg:col-start-2 text-center">
            <p className="text-lg md:text-xl font-normal tracking-tight text-gray-600 dark:text-gray-300 mx-auto mb-8 max-w-3xl">
              Synchronisez vos comptes bancaires, suivez vos encaissements et
              vos dépenses en temps réel, et{" "}
              <strong className="font-medium text-gray-900">
                anticipez vos besoins de trésorerie
              </strong>{" "}
              avant qu&apos;ils ne deviennent urgents.
            </p>
            <div className="mb-8 flex flex-col items-center gap-3 sm:mx-auto sm:flex sm:w-fit sm:flex-row sm:justify-center">
              {/* Même gabarit que le CTA du hero de la LP home */}
              <Button
                asChild
                size="md"
                variant="primary"
                className="h-auto w-full px-4 py-1.5 text-[17px] sm:w-auto"
              >
                <Link href="/auth/signup">
                  <span>Essayer 30 jours offerts</span>
                </Link>
              </Button>
              <WhatsAppContactButton
                className="bg-transparent hover:bg-gray-100 active:bg-gray-200 text-gray-900 dark:bg-transparent dark:hover:bg-gray-100 dark:text-gray-900"
                iconClassName="text-[#25D366]"
              />
            </div>
            {/* Preuve sociale : mêmes portraits superposés que le hero
                    de la LP home */}
            <div className="flex items-center justify-center gap-3">
              <div className="flex -space-x-2.5">
                {PROOF_AVATARS.map((avatar) => (
                  <img
                    key={avatar.src}
                    src={avatar.src}
                    alt={avatar.alt}
                    style={{ objectPosition: avatar.position }}
                    className="size-7 sm:size-8 rounded-full border-2 border-white object-cover"
                    loading="lazy"
                  />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-gray-600 text-left">
                <span className="text-gray-900 font-medium">
                  +1 000 indépendants
                </span>{" "}
                nous font confiance
              </p>
            </div>
          </div>

          <div className="col-span-12">
            <MaquetteTresorerie />
          </div>
        </div>
      </div>
    </div>
  );
}
