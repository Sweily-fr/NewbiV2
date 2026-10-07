import React from "react";
import { BadgePercent, ListOrdered, ReceiptText } from "lucide-react";

/* Même disposition que « À tes côtés, dès la première facture » de la LP home,
   reprise sur la LP BTP : tout est centré sous un grand titre, trois colonnes
   avec un pictogramme au trait dans une tuile de 64 px.

   Le contenu décrit ce que fait réellement l'application : un taux de TVA par
   ligne, une mention d'exonération obligatoire dès qu'une ligne est à 0 %, une
   numérotation continue par document, et le suivi du statut de règlement.
   Newbi n'a pas de type de document « note d'honoraires » : ce sont des
   factures, et c'est ainsi qu'elles sont nommées ici. */
const ITEMS = [
  {
    title: "L'exonération se règle à la ligne",
    desc: "Vous passez la ligne à 0 % de TVA : Newbi exige alors la mention d'exonération et la porte sur le document. Pour les soins relevant de l'article 261-4-1° du Code général des impôts, vous l'enregistrez une fois dans votre modèle.",
    Icon: BadgePercent,
  },
  {
    title: "Une numérotation continue",
    desc: "Chaque document reçoit un numéro qui suit votre séquence, sans trou ni doublon. Ce que la profession appelle note d'honoraires est juridiquement une facture : les mêmes règles s'y appliquent.",
    Icon: ListOrdered,
  },
  {
    title: "Ce que vous avez réellement encaissé",
    desc: "Chaque document porte son statut — émis, envoyé, payé. Vous filtrez sur la période pour lire vos encaissements, sans additionner vos relevés à la main.",
    Icon: ReceiptText,
  },
];

export default function ExonerationSection() {
  return (
    <section className="relative overflow-hidden px-5 py-14 md:py-20">
      <div className="mx-auto max-w-7xl text-center">
        <h2 className="mb-12 text-balance text-4xl font-medium leading-tight tracking-tight text-gray-950 md:mb-16 md:text-5xl lg:text-[3.5rem]">
          Des soins exonérés, une facturation qui le dit
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
