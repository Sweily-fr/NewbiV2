import React from "react";
import { Mail, MonitorSmartphone, Star, Users } from "lucide-react";
import { OMBRE, SHEET, VISUEL } from "@/src/lib/lp-visuels";
import { VisuelListe, VisuelPhoto } from "@/src/components/lp/visuels";

// Même bento que « Garde le contrôle de ton activité » sur la LP home :
// une grande carte et une carte moyenne en haut, trois cartes en dessous.
// Chaque carte porte un visuel ancré en bas — trois illustrations et deux
// photographies, pour que cinq cartes d'affilée ne se lisent pas toutes
// pareil. Les deux illustrations propres au produit (la signature et la
// bannière) sont écrites ici : elles ne servent nulle part ailleurs.
const CARD =
  "rounded-3xl bg-gradient-to-b from-[#F4F4F6] to-[#FAFAFB] p-7 md:p-8 pb-0 flex flex-col overflow-hidden";
const TITLE =
  "text-xl md:text-2xl font-medium tracking-tight text-gray-950 mb-3";
const TEXT = "text-[15px] leading-relaxed text-gray-700";
// Cadre des deux photographies : elles remplissent la hauteur disponible et
// sortent du cadre à droite et en bas, qui les recadre.
const PHOTO = "left-12 -right-10 top-0 -bottom-10";

export default function SignaturesGovernanceSection() {
  return (
    <section className="pt-10 md:pt-20 lg:pt-22 relative overflow-hidden px-5">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-balance text-gray-950 mb-4">
          Tout ce que fait votre générateur de signature mail
        </h2>
        <p className="text-[17px] leading-relaxed text-gray-600 max-w-2xl mb-10 md:mb-14">
          Un modèle, des coordonnées qui se remplissent toutes seules, une
          bannière que vous changez pour toute l&apos;équipe : vos signatures
          e-mail se gèrent depuis un seul écran.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5">
          <article className={`${CARD} md:col-span-7 min-h-[470px]`}>
            <h3 className={TITLE}>
              Un modèle unique, déployé à toute l&apos;équipe
            </h3>
            <p className={`${TEXT} max-w-xl`}>
              Vous choisissez une mise en page, Newbi l&apos;applique à chaque
              collaborateur avec ses propres nom, fonction et coordonnées. Une
              nouvelle recrue arrive ? Sa signature est générée à son nom dès
              son ajout, sans repasser derrière elle.
            </p>
            <div className={VISUEL}>
              <SignatureVisual />
            </div>
          </article>

          <article className={`${CARD} md:col-span-5 min-h-[470px]`}>
            <h3 className={TITLE}>Chacun à sa place, en un clic</h3>
            <p className={TEXT}>
              Classez vos collaborateurs par groupe — direction, commercial,
              atelier — et donnez à chaque groupe sa signature. Un interrupteur
              active ou désactive la signature d&apos;une personne, une étoile
              désigne sa signature principale.
            </p>
            <div className={VISUEL}>
              <VisuelPhoto
                className={PHOTO}
                src="/lp/signatures/equipe.jpg"
                alt="Une petite équipe réunie autour d'un même écran"
                cartes={[
                  {
                    icon: Users,
                    titre: "Par groupe",
                    texte: "Une signature par groupe",
                  },
                  {
                    icon: Star,
                    titre: "Signature principale",
                    texte: "Désignée d'une étoile",
                  },
                ]}
              />
            </div>
          </article>

          <article className={`${CARD} md:col-span-4 min-h-[450px]`}>
            <h3 className={TITLE}>Gmail, Outlook et Apple Mail</h3>
            <p className={TEXT}>
              L&apos;installation est guidée pour chaque messagerie, et la
              signature s&apos;affiche à l&apos;identique sur ordinateur comme
              sur mobile — images, couleurs et liens compris.
            </p>
            <div className={VISUEL}>
              <VisuelPhoto
                className={PHOTO}
                src="/lp/signatures/mobile.jpg"
                alt="Un e-mail consulté sur un téléphone, à côté de l'ordinateur"
                cartes={[
                  {
                    icon: Mail,
                    titre: "Installation guidée",
                    texte: "Pour chaque messagerie",
                  },
                  {
                    icon: MonitorSmartphone,
                    titre: "Rendu identique",
                    texte: "Ordinateur et mobile",
                  },
                ]}
              />
            </div>
          </article>

          <article className={`${CARD} md:col-span-4 min-h-[450px]`}>
            <h3 className={TITLE}>Des bannières qui travaillent pour vous</h3>
            <p className={TEXT}>
              Salon, recrutement, nouveauté : ajoutez une bannière sous la
              signature de l&apos;équipe. Chaque e-mail envoyé devient un
              support de communication, et vous changez la campagne pour tout le
              monde en une fois.
            </p>
            <div className={VISUEL}>
              <BanniereVisual />
            </div>
          </article>

          <article className={`${CARD} md:col-span-4 min-h-[450px]`}>
            <h3 className={TITLE}>Vos liens toujours à jour</h3>
            <p className={TEXT}>
              Réseaux sociaux, prise de rendez-vous, site, mentions légales :
              vous modifiez une information une fois et toutes les signatures
              concernées suivent, sans relancer personne.
            </p>
            <div className={VISUEL}>
              <VisuelListe
                className={SHEET}
                titre="Liens de la signature"
                lignes={[
                  "Réseaux sociaux",
                  "Prise de rendez-vous",
                  "Site et mentions légales",
                ]}
                chip="Modifiés une fois, partout"
              />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Visuels propres au produit                                          */
/* ------------------------------------------------------------------ */

/* La signature elle-même, telle qu'elle sort du générateur : le filet de
   couleur à gauche, le bloc de coordonnées, les liens. La carte fait sept
   colonnes, l'encadré prend donc toute sa largeur. */
function SignatureVisual() {
  return (
    <div className={`${SHEET} ${OMBRE}`}>
      <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] px-4 py-3">
        <p className="text-[13px] font-medium text-gray-950">
          Modèle « Atelier Boréal »
        </p>
        <span className="rounded-md bg-[#EFEDFF] px-1.5 py-0.5 text-[10.5px] font-medium text-[#5A50FF]">
          12 collaborateurs
        </span>
      </div>

      <div className="flex items-start gap-3.5 px-4 py-4">
        <span className="grid size-11 flex-none place-items-center rounded-full bg-[#EFEDFF] text-[13px] font-semibold text-[#5A50FF]">
          CM
        </span>
        <span className="block border-l-2 border-[#5A50FF] pl-3.5">
          <span className="block text-[13px] font-medium text-gray-950">
            Camille Moreau
          </span>
          <span className="mt-0.5 block text-[11.5px] text-gray-500">
            Responsable commerciale · Atelier Boréal
          </span>
          <span className="mt-1.5 block text-[11.5px] text-gray-500">
            06 12 34 56 78 · camille@atelier-boreal.fr
          </span>
          <span className="mt-2 flex gap-1.5">
            {["LinkedIn", "Site", "Rendez-vous"].map((l) => (
              <span
                key={l}
                className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600"
              >
                {l}
              </span>
            ))}
          </span>
        </span>
      </div>
    </div>
  );
}

/* La bannière posée sous la signature, et les campagnes entre lesquelles on
   bascule. Les trois sont celles que cite le texte de la carte. */
const CAMPAGNES = ["Salon", "Recrutement", "Nouveauté"];

function BanniereVisual() {
  return (
    <div className={`${SHEET} ${OMBRE}`}>
      <div className="border-b border-black/[0.06] px-4 py-3">
        <p className="text-[13px] font-medium text-gray-950">
          Bannière de l&apos;équipe
        </p>
      </div>

      <div className="px-4 py-3.5">
        <span className="flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-[#5A50FF] to-[#8F88FF] px-3.5 py-3">
          <span className="block">
            <span className="block text-[12.5px] font-medium text-white">
              Nous recrutons
            </span>
            <span className="mt-0.5 block text-[11px] text-white/80">
              Voir les postes ouverts
            </span>
          </span>
          <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[10px] font-medium text-white">
            Active
          </span>
        </span>

        <div className="mt-3 flex gap-1.5">
          {CAMPAGNES.map((c) => (
            <span
              key={c}
              className={`rounded-md px-1.5 py-0.5 text-[10.5px] font-medium ${
                c === "Recrutement"
                  ? "bg-[#EFEDFF] text-[#5A50FF]"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
