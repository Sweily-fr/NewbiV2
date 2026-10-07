import React from "react";
import { Percent, FileDown } from "lucide-react";
import { OMBRE, VISUEL } from "@/src/lib/lp-visuels";
import CartePosee from "@/src/components/lp/carte-posee";

// Mêmes jetons visuels que le bento « Garde le contrôle de ton activité »
// de la LP home. Chaque carte de texte porte un visuel ancré en bas, qui sort
// de son cadre — même matière que les sections de /produits/facturation-
// electronique, mais trois formes différentes (jauge, pile de documents,
// tuiles) pour que l'ensemble des LP ne se répète pas.
const CARD =
  "rounded-3xl bg-gradient-to-b from-[#F4F4F6] to-[#FAFAFB] p-7 md:p-8 flex flex-col overflow-hidden";
// Variante des cartes qui portent un visuel : il doit atteindre le bord bas.
const CARD_VISUEL = `${CARD} pb-0`;
const TITLE =
  "text-xl md:text-2xl font-medium tracking-tight text-gray-950 mb-3";
const TEXT = "text-[15px] leading-relaxed text-gray-700";

export default function FacturesGovernanceSection() {
  return (
    <section className="pt-10 md:pt-20 lg:pt-22 lg-pb-10 relative overflow-hidden px-5">
      {/* Le padding latéral est porté par la section : le conteneur fait donc
          bien 7xl pleins, comme la bannière et le bloc noir qui suivent. */}
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-balance text-gray-950 mb-4">
          Un logiciel de facturation complet
        </h2>
        <p className="text-[17px] leading-relaxed text-gray-600 max-w-2xl mb-10 md:mb-14">
          Devis, factures, avoirs, relances et export comptable au même endroit
          — conformes à la facturation électronique, sans ressaisie.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5">
          {/* Colonne étroite : la carte photo, puis le suivi des paiements */}
          <div className="md:col-span-4 flex flex-col gap-4 md:gap-5">
            {/* Texte en haut : le voile est donc dégradé depuis le haut */}
            <article className="relative flex-1 min-h-[520px] overflow-hidden rounded-3xl flex flex-col justify-start p-7 md:p-8 text-white">
              <img
                src="/lp/factures/carte-bureau.png"
                alt=""
                className="absolute inset-0 size-full object-cover object-[60%_center]"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/45 to-black/10" />
              <div className="relative">
                <h3 className="text-xl md:text-2xl font-medium tracking-tight mb-3">
                  Facturez depuis votre bureau ou votre téléphone
                </h3>
                <p className="text-[15px] leading-relaxed text-white/85">
                  Votre logiciel de facturation vous suit partout. Vous créez un
                  devis chez un client, vous l&apos;envoyez avant d&apos;être
                  rentré.
                </p>
              </div>
            </article>

            <article className={CARD}>
              <h3 className={TITLE}>Ne courez plus après les paiements</h3>
              <p className={TEXT}>
                Suivez le statut de chaque facture en temps réel et déclenchez
                les relances automatiques avant que le retard ne
                s&apos;installe.
              </p>
            </article>
          </div>

          {/* Colonne large : deux cartes texte + illustration côte à côte */}
          <div className="md:col-span-8 flex flex-col gap-4 md:gap-5">
            <article className={`${CARD_VISUEL} min-h-[440px]`}>
              <h3 className={TITLE}>
                Créez des devis et des factures illimités
              </h3>
              <p className={`${TEXT} max-w-xl`}>
                Documents conformes à la réforme de la facturation électronique,
                à votre logo et à vos conditions. Aucun plafond : émettez autant
                de devis, factures et avoirs que nécessaire.
              </p>
              <div className={VISUEL}>
                <DocumentsVisual />
              </div>
            </article>

            {/* Dernière carte : elle absorbe la hauteur restante pour que les
                deux colonnes se referment à la même ligne */}
            <article className={`${CARD_VISUEL} flex-1 min-h-[500px]`}>
              <h3 className={TITLE}>Simplifiez votre pré-comptabilité</h3>
              <p className={`${TEXT} max-w-xl`}>
                Factures de vente, achats et justificatifs classés au fil de
                l&apos;eau, TVA calculée à la ligne. Votre expert-comptable
                récupère un export propre, au format FEC, Sage ou Cegid.
              </p>
              <div className={VISUEL}>
                <PrecomptaVisual />
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Visuels — ancrés en bas, ils sortent du cadre de leur carte         */
/* ------------------------------------------------------------------ */

/* Documents : un document au lieu d'une liste, et deux feuilles qui dépassent
   derrière lui — c'est le « illimités » du titre, montré plutôt qu'écrit. */
// Les trois documents cités par le texte de la carte.
const TYPES = ["Devis", "Facture", "Avoir"];

const POSTES = [
  { large: "w-7/12", montant: "840,00 €", accent: true },
  { large: "w-5/12", montant: "320,00 €" },
  { large: "w-8/12", montant: "80,00 €" },
  { large: "w-6/12", montant: "33,33 €" },
];

function DocumentsVisual() {
  return (
    <div className="absolute left-12 right-8 -bottom-6">
      {/* Les deux feuilles de la pile : décalées vers le haut et rentrées, on
          n'en voit que la tranche. */}
      <div className="absolute inset-x-10 -top-6 h-10 rounded-t-2xl bg-white ring-1 ring-black/[0.04]" />
      <div className="absolute inset-x-5 -top-3 h-10 rounded-t-2xl bg-white ring-1 ring-black/[0.06]" />

      <div className="relative rounded-2xl bg-white overflow-hidden shadow-[0_1px_2px_rgba(16,16,32,0.04),0_8px_24px_-12px_rgba(16,16,32,0.18)] ring-1 ring-black/[0.06]">
        {/* Les trois types de document que la carte annonce, l'actif en
            violet de marque : c'est ce qui donne sa couleur au visuel. */}
        <div className="flex items-center justify-between gap-3 px-4 pt-4">
          {/* « à votre logo » : plutôt qu'un bloc de couleur, le logo d'un
              vrai client, déjà servi par la démo du hero de la LP home. */}
          <img
            src="/lp/home/logos/sweily.png"
            alt=""
            width={2000}
            height={660}
            loading="lazy"
            className="h-5 w-auto object-contain"
          />
          <span className="flex items-center gap-1">
            {TYPES.map((t) => (
              <span
                key={t}
                className={`rounded-md px-1.5 py-0.5 text-[10.5px] font-medium ${
                  t === "Facture"
                    ? "bg-[#EFEDFF] text-[#5A50FF]"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {t}
              </span>
            ))}
          </span>
        </div>

        <div className="mt-4 space-y-2.5 px-4">
          {POSTES.map((p) => (
            <span key={p.montant} className="flex items-center gap-3">
              <span
                className={`h-1.5 rounded-full ${p.accent ? "bg-[#DCD9FF]" : "bg-gray-100"} ${p.large}`}
              />
              <span className="ml-auto text-[11.5px] tabular-nums text-gray-400">
                {p.montant}
              </span>
            </span>
          ))}
        </div>

        <div className="mt-3.5 flex items-center justify-between border-t border-black/[0.06] px-4 py-3">
          <span className="text-[11.5px] text-gray-500">Total TTC</span>
          <span className="text-[13px] font-medium tabular-nums text-[#5A50FF]">
            1 240,00 €
          </span>
        </div>
      </div>
    </div>
  );
}

/* Pré-comptabilité : une photographie plutôt qu'un encadré — trois visuels
   construits d'affilée dans la même colonne finissaient par se ressembler.

   Elle n'occupe que la droite de la carte, sort du cadre à droite et en bas,
   qui la recadre, et porte deux cartes posées sur son bord gauche. Sa hauteur
   vient du cadre (top-0 / -bottom-10) et non de sa largeur : à ratio fixe,
   elle remonterait par-dessus le texte. */
function PrecomptaVisual() {
  return (
    <div className="absolute -right-10 top-0 -bottom-10 w-[340px] lg:w-[560px]">
      <div className={`h-full overflow-hidden rounded-2xl ${OMBRE}`}>
        <img
          src="/lp/factures/precomptabilite.jpg"
          alt="Pièces comptables, calculatrice et carnet sur un bureau"
          width={1400}
          height={933}
          loading="lazy"
          className="size-full object-cover object-[55%_60%]"
        />
      </div>

      {/* Les deux précisions que porte le texte de la carte, rien de plus. */}
      <CartePosee
        icon={Percent}
        titre="TVA à la ligne"
        texte="Chaque taux, calculé"
        placement="-left-9 top-6"
      />
      <CartePosee
        icon={FileDown}
        titre="Export comptable"
        texte="FEC, Sage ou Cegid"
        placement="-left-5 bottom-16"
      />
    </div>
  );
}
