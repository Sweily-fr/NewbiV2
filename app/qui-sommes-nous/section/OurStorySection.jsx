import React from "react";
import Image from "next/image";

// Quatre repères chiffrés, tous tirés de ce que le site affiche déjà.
const REPERES = [
  { chiffre: "5", label: "associés, une seule équipe" },
  { chiffre: "7", label: "outils dans un même espace" },
  { chiffre: "+1 000", label: "indépendants nous font confiance" },
  { chiffre: "100 %", label: "des données hébergées en France" },
];

export function OurStorySection() {
  return (
    <section className="pt-10 md:pt-20 lg:pt-22 relative overflow-hidden px-5">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16 items-center">
          <div className="lg:col-span-6">
            <div className="relative h-[360px] lg:h-[480px] overflow-hidden rounded-3xl bg-[#F4F4F6]">
              <Image
                src="/lp/about/fondateurs.jpg"
                alt="Jonathan et Anthony, les fondateurs de Newbi"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>

          <div className="lg:col-span-6">
            <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-balance text-gray-950 mb-4">
              Nous avons d&apos;abord créé Newbi pour nous
            </h2>
            <p className="text-[17px] leading-relaxed text-gray-600 mb-4">
              Tout commence chez Sweily, notre agence web : cinq associés, cinq
              métiers, et le même constat chaque fin de mois. Un outil pour les
              devis, un autre pour les factures, un tableur pour la trésorerie,
              une boîte mail pour relancer. Des heures perdues à recopier les
              mêmes informations d&apos;un endroit à l&apos;autre.
            </p>
            <p className="text-[17px] leading-relaxed text-gray-600">
              Newbi rassemble tout ça dans un seul espace : un devis devient une
              facture, la facture part en facturation électronique, le paiement
              se rapproche de votre compte bancaire. Vous ne ressaisissez rien,
              et vous passez votre temps sur votre métier plutôt que sur votre
              administratif.
            </p>
          </div>
        </div>

        <dl className="mt-14 md:mt-20 grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
          {REPERES.map(({ chiffre, label }) => (
            <div key={label} className="border-t border-gray-200 pt-6">
              <dt className="text-4xl md:text-5xl font-medium tracking-tight text-gray-950">
                {chiffre}
              </dt>
              <dd className="mt-3 text-[15px] leading-relaxed text-gray-600">
                {label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
