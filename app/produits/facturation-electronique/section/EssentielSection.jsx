import React from "react";
import Link from "next/link";
import { FileCheck2, ShieldCheck } from "lucide-react";
import { OMBRE, SHEET } from "@/src/lib/lp-visuels";
import CartePosee from "@/src/components/lp/carte-posee";

// Trois cartes côte à côte, même gabarit que « Tes factures, conformes et
// gérées sans effort » sur la LP home (InvoicingTrioSection) : titre en haut,
// texte, puis un visuel ancré en bas qui sort du cadre de la carte. Chaque
// carte mène à la page utile.
const CARD =
  "group relative rounded-3xl bg-gradient-to-b from-[#F4F4F6] to-[#FAFAFB] p-7 md:p-8 pb-0 flex flex-col overflow-hidden min-h-[500px]";
const TITLE =
  "text-xl md:text-2xl font-medium tracking-tight text-gray-950 leading-snug";
const TEXT = "text-[15px] leading-relaxed text-gray-700 mt-4";

export default function EssentielSection() {
  return (
    <section className="relative overflow-hidden px-5 pt-10 md:pt-20 lg:pt-22 pb-0">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 md:mb-14">
          <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-balance text-gray-950">
            La réforme, et ce qui change pour vous
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          <Card
            href="/facturation-electronique-suis-je-concerne"
            title={
              <>
                Recevoir, dès
                <br className="hidden lg:block" /> septembre 2026
              </>
            }
            text="Toutes les entreprises, quelle que soit leur taille, devront accepter une facture au format électronique. Votre boîte de réception Newbi est déjà en place."
          >
            <ReceptionVisual />
          </Card>

          <Card
            href="/facturation-electronique-suis-je-concerne"
            title={
              <>
                Émettre, selon
                <br className="hidden lg:block" /> votre taille
              </>
            }
            text="Septembre 2026 pour les grandes et moyennes entreprises, septembre 2027 pour les TPE et les micro-entrepreneurs. Vérifiez votre échéance en deux clics."
          >
            <EcheanceVisual />
          </Card>

          <Card
            href="/produits/factures"
            title={
              <>
                Passer par une
                <br className="hidden lg:block" /> plateforme agréée
              </>
            }
            text="Vos factures ne circulent plus par e-mail : elles transitent par une plateforme agréée, au format Factur-X. Newbi s'en charge, sans supplément."
          >
            <PlateformeVisual />
          </Card>
        </div>
      </div>
    </section>
  );
}

function Card({ href, title, text, children }) {
  return (
    <Link href={href} className={CARD}>
      <div className="flex items-start justify-between gap-4">
        <h3 className={TITLE}>{title}</h3>
        <span className="flex-none grid place-items-center size-9 rounded-full bg-white text-gray-900 ring-1 ring-black/[0.06] opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 17 17 7M8 7h9v9" />
          </svg>
        </span>
      </div>
      <p className={TEXT}>{text}</p>
      <div className="relative flex-1 min-h-[210px] mt-8 -mx-7 md:-mx-8">
        {children}
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Visuels — ancrés en bas, ils sortent du cadre de leur carte         */
/* ------------------------------------------------------------------ */

/* Réception : la boîte de réception des factures fournisseurs, réduite à
   l'essentiel — l'émetteur et le montant. La mention du format est portée
   une seule fois, en en-tête, plutôt que répétée à chaque ligne.
   Les logos sont ceux déjà servis par la démo du hero de la LP home. */
const RECUES = [
  { nom: "OVHcloud", logo: "ovh", montant: "29,05 €" },
  { nom: "Adobe", logo: "adobe", montant: "71,88 €" },
  { nom: "Orange", logo: "orange", montant: "43,27 €" },
  { nom: "Google", logo: "google", montant: "16,50 €" },
];

function ReceptionVisual() {
  return (
    <div className={SHEET}>
      <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] px-4 py-3">
        <span className="text-[13px] font-medium text-gray-950">
          Factures reçues
        </span>
        <span className="rounded-md bg-[#EFEDFF] px-1.5 py-0.5 text-[10.5px] font-medium text-[#5A50FF]">
          Factur-X
        </span>
      </div>

      {RECUES.map((f) => (
        <div
          key={f.nom}
          className="flex items-center gap-2.5 border-b border-black/[0.04] px-4 py-2.5 last:border-b-0"
        >
          <img
            src={`/lp/home/logos/${f.logo}.svg`}
            alt=""
            width={16}
            height={16}
            className="size-4 flex-none object-contain"
          />
          <span className="flex-1 truncate text-[12.5px] text-gray-800">
            {f.nom}
          </span>
          <span className="text-[12.5px] tabular-nums text-gray-500">
            {f.montant}
          </span>
        </div>
      ))}
    </div>
  );
}

/* Échéance : le sélecteur de la page « suis-je concerné », ramené à ses deux
   catégories et à la date qui en découle. Elles sont reprises mot pour mot
   de cette page. */
function EcheanceVisual() {
  return (
    <div className={SHEET}>
      <div className="px-4 pt-3.5">
        <p className="mb-2 text-[11.5px] text-gray-500">Votre structure</p>
        <div className="space-y-1.5">
          <span className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-2.5 py-2 text-[12.5px] text-gray-600">
            Grandes entreprises et ETI
            <span className="size-3.5 flex-none rounded-full border border-gray-300" />
          </span>
          <span className="flex items-center justify-between gap-2 rounded-lg border border-[#5A50FF] bg-[#F6F5FF] px-2.5 py-2 text-[12.5px] font-medium text-gray-950">
            PME, TPE et micro-entreprises
            <span className="grid size-3.5 flex-none place-items-center rounded-full bg-[#5A50FF] text-white">
              <svg
                width="8"
                height="8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m5 13 4 4L19 7" />
              </svg>
            </span>
          </span>
        </div>
      </div>

      <div className="mt-3.5 border-t border-black/[0.06] px-4 py-3">
        <p className="text-[11.5px] text-gray-500">
          Votre échéance pour émettre
        </p>
        <p className="mt-0.5 text-[17px] font-medium tracking-tight text-gray-950">
          1<sup>er</sup> septembre 2027
        </p>
      </div>
    </div>
  );
}

/* Plateforme : la même photographie que la section « Prêt aujourd'hui, pas
   en 2026 » (CeQueNewbiFaitSection) — on y voit l'application en service,
   plutôt qu'un bureau générique. Deux cartes sont posées sur son bord, du
   même dessin que celles des heros de LP métier — pictogramme, titre, une
   ligne de précision. Elles longent le bord gauche : à la largeur d'une
   carte, un débordement à droite serait recoupé par le cadre. */
function PlateformeVisual() {
  return (
    <div className="absolute left-12 right-8 -bottom-6">
      <div className={`overflow-hidden rounded-2xl ${OMBRE}`}>
        <img
          src="/lp/facturation-electronique/cta-laptop.jpg"
          alt="Les factures clients dans Newbi, consultées depuis un ordinateur portable"
          width={1920}
          height={1080}
          loading="lazy"
          className="aspect-[16/10] size-full object-cover"
        />
      </div>

      <CartePosee
        icon={ShieldCheck}
        titre="Plateforme agréée"
        texte="Incluse dans l'offre"
        placement="-left-9 top-5"
      />
      <CartePosee
        icon={FileCheck2}
        titre="Format Factur-X"
        texte="Émission et réception"
        placement="-left-4 bottom-5"
      />
    </div>
  );
}
