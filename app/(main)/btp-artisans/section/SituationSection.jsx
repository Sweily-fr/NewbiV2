import React from "react";
import { Calculator, Lock, ClipboardCheck } from "lucide-react";

/* Même disposition et mêmes jetons visuels que la section « À tes côtés, dès
   la première facture » de la LP home : tout est centré sous un grand titre,
   trois colonnes avec un pictogramme au trait dans une tuile de 64 px. Le
   bouton que porte la section d'origine n'est pas repris : la page en compte
   déjà un dans le hero et un autre dans la bannière qui suit.

   Le contenu décrit ce que fait réellement l'application : les trois types de
   document (standard, acompte, situation), le pourcentage d'avancement global
   ou par ligne, le montant du marché et la retenue de garantie exprimée en
   pourcentage. Les règles métier correspondantes sont détaillées dans
   l'article « Facture de situation BTP » du blog, lié plus bas. */
const ITEMS = [
  {
    title: "L'avancement, global ou ligne par ligne",
    desc: "Vous renseignez le montant du marché et le pourcentage d'avancement — d'un seul coup pour tout le document, ou poste par poste. Newbi calcule le montant de la période et numérote la situation.",
    Icon: Calculator,
  },
  {
    title: "La retenue de garantie",
    desc: "Vous appliquez le pourcentage convenu au marché : il est retranché du net à payer sur chaque situation, et reste identifié jusqu'à sa libération.",
    Icon: Lock,
  },
  {
    title: "L'acompte, puis le solde",
    desc: "Une facture d'acompte à la commande, des situations pendant les travaux, une facture de solde à la fin : trois types de document, une seule numérotation continue.",
    Icon: ClipboardCheck,
  },
];

export default function SituationSection() {
  return (
    <section className="relative overflow-hidden px-5 py-14 md:py-20">
      <div className="mx-auto max-w-7xl text-center">
        <h2 className="mb-12 text-balance text-4xl font-medium leading-tight tracking-tight text-gray-950 md:mb-16 md:text-5xl lg:text-[3.5rem]">
          La facture de situation, comme sur le chantier
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
