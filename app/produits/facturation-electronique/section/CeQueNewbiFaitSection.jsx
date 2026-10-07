import React from "react";
import { Lock } from "lucide-react";
import { SHEET, VISUEL } from "@/src/lib/lp-visuels";

// Mêmes jetons visuels et même bento que « Garde le contrôle de ton activité »
// sur la LP home : une grande carte et une carte photo en haut, trois cartes
// en dessous. Chaque carte de texte porte un visuel ancré en bas, qui sort de
// son cadre — même procédé que la section « La réforme » au-dessus.
const CARD =
  "relative rounded-3xl bg-gradient-to-b from-[#F4F4F6] to-[#FAFAFB] p-7 md:p-8 pb-0 flex flex-col overflow-hidden";
const TITLE =
  "text-xl md:text-2xl font-medium tracking-tight text-gray-950 mb-3";
const TEXT = "text-[15px] leading-relaxed text-gray-700";

export default function CeQueNewbiFaitSection() {
  return (
    <section className="relative overflow-hidden px-5 pt-10 md:pt-20 lg:pt-22 pb-0">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-balance text-gray-950 mb-4">
          Ce que Newbi fait à votre place
        </h2>
        <p className="text-[17px] leading-relaxed text-gray-600 max-w-2xl mb-10 md:mb-14">
          Vous facturez comme avant. Le format, la transmission, la réception et
          l&apos;archivage sont pris en charge.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5">
          <article className={`${CARD} md:col-span-7 min-h-[404px]`}>
            <h3 className={TITLE}>
              Vos factures au bon format, sans rien changer
            </h3>
            <p className={`${TEXT} max-w-xl`}>
              Vous créez votre facture comme aujourd&apos;hui : Newbi en produit
              la version Factur-X attendue par l&apos;administration — un PDF
              lisible pour votre client, les données structurées à
              l&apos;intérieur. Aucun module à acheter, aucune ressaisie.
            </p>
            <div className={VISUEL}>
              <FormatVisual />
            </div>
          </article>

          {/* Carte photo : texte en bas, voile remontant depuis le bas */}
          <article className="relative rounded-3xl overflow-hidden min-h-[404px] md:col-span-5 flex flex-col justify-end p-7 md:p-8 text-white">
            <img
              src="/lp/facturation-electronique/cta-laptop.jpg"
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10" />
            <div className="relative">
              <h3 className="text-xl md:text-2xl font-medium tracking-tight mb-3">
                Prêt aujourd&apos;hui, pas en 2026
              </h3>
              <p className="text-[15px] leading-relaxed text-white/85">
                Rien à migrer, rien à paramétrer : la conformité est déjà dans
                votre compte, incluse dans toutes les offres.
              </p>
            </div>
          </article>

          <article className={`${CARD} md:col-span-4 min-h-[386px]`}>
            <h3 className={TITLE}>Transmises, et suivies</h3>
            <p className={TEXT}>
              Vos factures partent par la plateforme agréée, pas par e-mail.
              Vous voyez où elles en sont : envoyée, reçue, acceptée ou rejetée.
            </p>
            <div className={VISUEL}>
              <SuiviVisual />
            </div>
          </article>

          <article className={`${CARD} md:col-span-4 min-h-[386px]`}>
            <h3 className={TITLE}>Vos fournisseurs au même endroit</h3>
            <p className={TEXT}>
              Les factures d&apos;achat arrivent directement dans Newbi, déjà
              lisibles, prêtes à être rapprochées de vos transactions bancaires.
            </p>
            <div className={VISUEL}>
              <RapprochementVisual />
            </div>
          </article>

          <article className={`${CARD} md:col-span-4 min-h-[386px]`}>
            <h3 className={TITLE}>Archivées dix ans</h3>
            <p className={TEXT}>
              La durée de conservation légale est tenue pour vous, factures
              émises comme reçues. Votre expert-comptable les retrouve depuis
              son accès gratuit.
            </p>
            <div className={VISUEL}>
              <ArchivageVisual />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Visuels — ancrés en bas, ils sortent du cadre de leur carte         */
/* ------------------------------------------------------------------ */

/* Format : la facture et ses deux faces, côte à côte dans un même encadré.
   La carte fait sept colonnes : l'encadré prend toute sa largeur plutôt que
   d'être calé dans un coin, sinon la moitié de la carte reste vide. */
function FormatVisual() {
  return (
    <div className={SHEET}>
      <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] px-4 py-3">
        <p className="text-[13px] font-medium text-gray-950">
          Facture F-2026-0142
        </p>
        <p className="text-[12px] tabular-nums text-gray-500">1 240,00 € TTC</p>
      </div>

      <div className="grid grid-cols-2 divide-x divide-black/[0.06]">
        <Volet
          puce="PDF"
          titre="Lisible par votre client"
          lignes={["w-10/12", "w-8/12", "w-11/12", "w-6/12"]}
        />
        <Volet
          puce="XML"
          titre="Lue par sa plateforme"
          champs={[
            ["SIREN", "w-7/12"],
            ["TVA", "w-5/12"],
            ["Échéance", "w-6/12"],
          ]}
        />
      </div>

      <div className="flex items-center gap-2 border-t border-black/[0.06] px-4 py-2.5">
        <span className="rounded-md bg-[#EFEDFF] px-1.5 py-0.5 text-[10.5px] font-medium text-[#5A50FF]">
          Factur-X
        </span>
        <span className="text-[11.5px] text-gray-500">
          Les deux dans un seul fichier
        </span>
      </div>
    </div>
  );
}

/* Un volet de l'encadré : une pastille de format, un intitulé, puis la trame
   du document — des barres grises, pas du faux texte. */
function Volet({ puce, titre, lignes, champs }) {
  return (
    <div className="px-4 py-3.5">
      <p className="flex items-center gap-2">
        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-gray-500">
          {puce}
        </span>
        <span className="text-[12px] text-gray-700">{titre}</span>
      </p>

      <div className="mt-3 space-y-1.5">
        {lignes?.map((l, i) => (
          <span
            key={i}
            className={`block h-1.5 rounded-full bg-gray-100 ${l}`}
          />
        ))}
        {champs?.map(([cle, l]) => (
          <span key={cle} className="flex items-center gap-2">
            <span className="text-[10px] tabular-nums text-gray-400">
              {cle}
            </span>
            <span className={`h-1.5 rounded-full bg-gray-100 ${l}`} />
          </span>
        ))}
      </div>
    </div>
  );
}

/* Suivi : les trois états que renvoie la plateforme, dans l'ordre. Le dernier
   est en attente — c'est ce qui donne à lire que l'état avance tout seul. */
const ETATS = [
  { label: "Envoyée", date: "18/09", fait: true },
  { label: "Reçue", date: "18/09", fait: true },
  { label: "Acceptée", date: "19/09", fait: false },
];

function SuiviVisual() {
  return (
    <div className={SHEET}>
      <div className="border-b border-black/[0.06] px-4 py-3">
        <p className="text-[13px] font-medium text-gray-950">
          Facture F-2026-0142
        </p>
      </div>

      <div className="px-4 py-3.5">
        {ETATS.map((e, i) => (
          <div key={e.label} className="flex items-start gap-2.5">
            {/* Pastille et segment de liaison : le dernier état n'en a pas. */}
            <div className="flex flex-col items-center self-stretch">
              <span
                className={`mt-0.5 size-2.5 flex-none rounded-full ${
                  e.fait
                    ? "bg-[#5A50FF]"
                    : "bg-white ring-1 ring-inset ring-gray-300"
                }`}
              />
              {i < ETATS.length - 1 && (
                <span className="w-px flex-1 bg-gray-200" />
              )}
            </div>
            <p
              className={`flex-1 pb-3.5 text-[12.5px] ${
                e.fait ? "text-gray-800" : "text-gray-400"
              }`}
            >
              {e.label}
            </p>
            <span
              className={`text-[12px] tabular-nums ${
                e.fait ? "text-gray-500" : "text-gray-300"
              }`}
            >
              {e.date}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Rapprochement : la facture fournisseur et l'opération bancaire en face.
   Logo repris de la démo du hero de la LP home, aucun nouvel asset. */
function RapprochementVisual() {
  return (
    <div className={SHEET}>
      <div className="flex items-center gap-2.5 px-4 py-3">
        <img
          src="/lp/home/logos/ovh.svg"
          alt=""
          width={16}
          height={16}
          className="size-4 flex-none object-contain"
        />
        <span className="flex-1 truncate text-[12.5px] text-gray-800">
          OVHcloud
        </span>
        <span className="text-[12.5px] tabular-nums text-gray-500">
          29,05 €
        </span>
      </div>

      <div className="flex items-center gap-2 px-4">
        <span className="h-px flex-1 bg-gray-200" />
        <span className="rounded-md bg-[#EFEDFF] px-1.5 py-0.5 text-[10.5px] font-medium text-[#5A50FF]">
          Rapprochée
        </span>
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      <div className="flex items-center gap-2.5 px-4 py-3">
        <span className="grid size-4 flex-none place-items-center rounded-[4px] bg-gray-100 text-[9px] font-semibold text-gray-500">
          €
        </span>
        <span className="flex-1 truncate text-[12.5px] text-gray-800">
          Prélèvement · 07/06
        </span>
        <span className="text-[12.5px] tabular-nums text-gray-500">
          29,05 €
        </span>
      </div>
    </div>
  );
}

/* Archivage : la fenêtre de conservation, et ce qu'elle couvre. */
function ArchivageVisual() {
  return (
    <div className={SHEET}>
      <div className="px-4 py-3.5">
        <p className="flex items-center gap-2 text-[12.5px] text-gray-500">
          <Lock size={13} strokeWidth={1.8} />
          Conservation légale
        </p>

        <div className="mt-3 flex items-center gap-2.5">
          <span className="text-[17px] font-medium tracking-tight text-gray-950">
            2026
          </span>
          <span className="h-px flex-1 bg-gray-200" />
          <span className="text-[17px] font-medium tracking-tight text-gray-950">
            2036
          </span>
        </div>
      </div>

      <div className="flex gap-1.5 border-t border-black/[0.06] px-4 py-2.5">
        {["Factures émises", "Factures reçues"].map((l) => (
          <span
            key={l}
            className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10.5px] font-medium text-gray-600"
          >
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
