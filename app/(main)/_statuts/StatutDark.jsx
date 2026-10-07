import React from "react";

/* Bloc sombre, même gabarit que « Pourquoi vos fichiers ne passent pas par
   e-mail » sur /produits/transfers : fond #0B0B0C plein cadre, titre, chapô,
   puis quatre repères séparés par un filet haut. */
export default function StatutDark({ titre, chapo, reperes, conclusion }) {
  return (
    // Le bloc noir est plein cadre, mais l'espace qui le précède reste blanc
    // et suit le rythme vertical des autres sections de la page.
    <section className="pt-10 md:pt-20 lg:pt-22">
      <div
        data-nav-theme="dark"
        className="relative overflow-hidden bg-[#0B0B0C] px-5 py-16 text-white md:py-32"
      >
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-4 text-balance text-4xl font-medium leading-tight tracking-tight md:text-5xl lg:text-[3.5rem]">
            {titre}
          </h2>
          <p className="mb-10 max-w-2xl text-[17px] leading-relaxed text-white/60 md:mb-14">
            {chapo}
          </p>

          <dl className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {reperes.map(({ chiffre, titre: t, texte }) => (
              <div key={t} className="border-t border-white/15 pt-6">
                <dt>
                  <span className="block text-4xl font-medium tracking-tight md:text-5xl">
                    {chiffre}
                  </span>
                  <span className="mt-3 block text-[17px] font-medium tracking-tight">
                    {t}
                  </span>
                </dt>
                <dd className="mt-2 text-[15px] leading-relaxed text-white/60">
                  {texte}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-10 max-w-3xl text-[17px] leading-relaxed text-white/60 md:mt-12">
            {conclusion}
          </p>
        </div>
      </div>
    </section>
  );
}
