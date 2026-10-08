import React from "react";
import { OMBRE, VISUEL } from "@/src/lib/lp-visuels";
import { VisuelListe } from "@/src/components/lp/visuels";

// Même bento que « Garde le contrôle de ton activité » sur la LP home, repris
// sur les LP produits : une grande carte et une carte moyenne en haut, trois
// cartes en dessous. Chaque carte porte une photo de l'équipe, ancrée en bas
// et sortant du cadre à droite, comme sur les bentos des LP produit.
const CARD =
  "rounded-3xl bg-gradient-to-b from-[#F4F4F6] to-[#FAFAFB] p-7 md:p-8 pb-0 flex flex-col overflow-hidden";
const TITLE =
  "text-xl md:text-2xl font-medium tracking-tight text-gray-950 mb-3";
const TEXT = "text-[15px] leading-relaxed text-gray-700";
// Cadre des photographies : calé à droite, il remplit la hauteur disponible et
// sort du cadre en bas et à droite, qui le recadre. Les clichés sont verticaux,
// la fenêtre est donc étroite — étalée sur toute la largeur de la carte, elle
// ne garderait qu'une bande du sujet. `largeur` l'ajuste à la carte.
// Place de la fenêtre dans la carte : contre un bord, dont elle sort, ou au
// milieu. On alterne d'une carte à l'autre pour que la rangée ne se lise pas
// comme une suite d'images toutes calées du même côté.
const PHOTO = {
  droite: "-right-10 top-0 -bottom-10",
  centre: "left-1/2 -translate-x-1/2 top-0 -bottom-10",
  gauche: "-left-10 top-0 -bottom-10",
};

// `position` recadre la fenêtre sur le sujet : centrée par défaut, elle coupe
// les têtes des clichés dont les visages sont hauts dans le cadre.
function Photo({ src, alt, largeur = "w-[240px]", position, cote = "droite" }) {
  return (
    <div className={VISUEL}>
      <div className={`absolute ${PHOTO[cote]} ${largeur}`}>
        <div className={`h-full overflow-hidden rounded-2xl ${OMBRE}`}>
          <img
            src={src}
            alt={alt}
            width={1050}
            height={1400}
            loading="lazy"
            className="size-full object-cover"
            style={position ? { objectPosition: position } : undefined}
          />
        </div>
      </div>
    </div>
  );
}

export function ValuesSection() {
  return (
    <section className="pt-10 md:pt-20 lg:pt-22 relative overflow-hidden px-5">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-balance text-gray-950 mb-4">
          Ce à quoi nous tenons
        </h2>
        <p className="text-[17px] leading-relaxed text-gray-600 max-w-2xl mb-10 md:mb-14">
          Cinq principes qui décident de ce que nous construisons, de ce que
          nous facturons et de ce que nous refusons de faire.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5">
          <article className={`${CARD} md:col-span-7 min-h-[449px]`}>
            <h3 className={TITLE}>Un outil qu&apos;on comprend seul</h3>
            <p className={`${TEXT} max-w-xl`}>
              Vous ne devriez pas avoir besoin d&apos;une formation pour envoyer
              une facture. Chaque écran est pensé pour qu&apos;on sache quoi
              faire sans manuel : un vocabulaire clair, les options avancées
              repliées, et jamais plus de champs que nécessaire. Quand une
              fonctionnalité demande une explication, c&apos;est qu&apos;elle
              est mal conçue.
            </p>
            {/* Une illustration plutôt qu'une photo sur cette carte : elle
                reprend mot pour mot les trois promesses du texte. L'encadré
                est calé à droite comme les photos voisines — étalé sur les
                sept colonnes, trois lignes courtes laisseraient un grand
                vide. */}
            <div className={VISUEL}>
              <VisuelListe
                className="absolute right-8 -bottom-6 w-[340px]"
                titre="Nouvelle facture"
                lignes={[
                  "Un vocabulaire clair",
                  "Les options avancées repliées",
                  "Jamais plus de champs que nécessaire",
                ]}
                chip="Sans manuel"
              />
            </div>
          </article>

          <article className={`${CARD} md:col-span-5 min-h-[449px]`}>
            <h3 className={TITLE}>Des prix affichés en entier</h3>
            <p className={TEXT}>
              Un tarif, visible sur le site, sans palier caché ni frais de mise
              en service. Vous testez 30 jours sans carte bancaire, vous
              résiliez en deux clics, et votre abonnement n&apos;augmente pas
              parce que vous avez envoyé plus de factures que le mois dernier.
            </p>
            <Photo
              src="/lp/about/cafe-equipe.jpg"
              alt="Un membre de l'équipe Newbi en pause café"
              largeur="w-[280px]"
            />
          </article>

          <article className={`${CARD} md:col-span-4 min-h-[433px]`}>
            <h3 className={TITLE}>Vos données restent les vôtres</h3>
            <p className={TEXT}>
              Tout est hébergé en France et conforme au RGPD. Nous ne revendons
              rien, nous n&apos;exploitons pas vos chiffres, et vous pouvez
              exporter l&apos;intégralité de vos documents à tout moment — y
              compris le jour où vous partez.
            </p>
            <Photo
              src="/lp/about/evenement-equipe.jpg"
              alt="L'équipe Newbi en t-shirt newbi.fr lors d'un événement"
            />
          </article>

          <article className={`${CARD} md:col-span-4 min-h-[433px]`}>
            <h3 className={TITLE}>Une équipe qu&apos;on joint vraiment</h3>
            <p className={TEXT}>
              Pas de centre d&apos;appel : vous écrivez, c&apos;est
              quelqu&apos;un de l&apos;équipe qui répond, souvent la personne
              qui a développé la fonctionnalité. Les demandes qui reviennent le
              plus souvent passent devant dans la feuille de route.
            </p>
            <Photo
              src="/lp/about/echange-equipe.jpg"
              alt="Deux membres de l'équipe Newbi en discussion"
              position="50% 15%"
              cote="centre"
            />
          </article>

          <article className={`${CARD} md:col-span-4 min-h-[433px]`}>
            <h3 className={TITLE}>À jour avant les échéances</h3>
            <p className={TEXT}>
              Facturation électronique, mentions obligatoires, taux de TVA : les
              règles changent, et c&apos;est notre travail de prendre
              l&apos;avance pour que vous n&apos;ayez rien à faire le jour où
              elles s&apos;appliquent.
            </p>
            <Photo
              src="/lp/about/session-du-soir.jpg"
              alt="L'équipe Newbi au travail en fin de journée"
              cote="gauche"
            />
          </article>
        </div>
      </div>
    </section>
  );
}
