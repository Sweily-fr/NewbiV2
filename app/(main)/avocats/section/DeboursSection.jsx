import React from "react";
import { Percent, Wallet, FolderOpen } from "lucide-react";

/* Même disposition que « À tes côtés, dès la première facture » de la LP home,
   reprise sur les autres pages métier : tout est centré sous un grand titre,
   trois colonnes avec un pictogramme au trait dans une tuile de 64 px.

   Le contenu croise les règles de l'article « Facture d'avocat » du blog et ce
   que fait réellement l'application : un taux de TVA par ligne, une mention
   d'exonération exigée dès qu'une ligne est à 0 %, des factures d'acompte, et
   des champs personnalisés sur les documents. */
const ITEMS = [
  {
    title: "Honoraires à 20 %, débours à 0 %",
    desc: "Le taux se choisit ligne par ligne : vos honoraires à 20 %, et les sommes avancées pour le compte du client — frais de greffe, huissier — sur une ligne à 0 % qui porte sa mention. Le document distingue clairement les deux.",
    Icon: Percent,
  },
  {
    title: "La provision avant les diligences",
    desc: "Une facture d'acompte sécurise la trésorerie avant d'engager la mission. Les factures suivantes s'imputent dessus, dans la même séquence de numérotation.",
    Icon: Wallet,
  },
  {
    title: "Le dossier porté sur le document",
    desc: "Référence de dossier, numéro de convention, référence CARPA le cas échéant : vos champs personnalisés figurent sur chaque facture, et se préparent une fois dans votre modèle.",
    Icon: FolderOpen,
  },
];

export default function DeboursSection() {
  return (
    <section className="relative overflow-hidden px-5 py-14 md:py-20">
      <div className="mx-auto max-w-7xl text-center">
        <h2 className="mb-12 text-balance text-4xl font-medium leading-tight tracking-tight text-gray-950 md:mb-16 md:text-5xl lg:text-[3.5rem]">
          Ce qui ne doit pas se mélanger sur une facture
        </h2>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-12">
          {ITEMS.map(({ title, desc, Icon }) => (
            <div key={title} className="flex flex-col items-center">
              <span className="mb-5 grid size-16 place-items-center rounded-2xl bg-[#F4F4F6] text-gray-900">
                <Icon size={32} strokeWidth={1.6} />
              </span>
              <h3 className="mb-3 text-xl font-medium tracking-tight text-gray-950 md:text-2xl">
                {title}
              </h3>
              <p className="text-[17px] leading-relaxed text-gray-600">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
