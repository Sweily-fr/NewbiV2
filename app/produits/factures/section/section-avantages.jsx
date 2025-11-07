import React from "react";

export default function SectionAvantages() {
  return (
    <section className="bg-[#FDFDFD] dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-xl sm:text-3xl font-medium text-gray-900 mb-4">
          Obtenez votre facture en quelques clics
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-10 lg:grid-cols-6 lg:grid-rows-2">
          <div className="max-lg:rounded-t-4xl lg:col-span-3 lg:rounded-tl-4xl group relative flex flex-col overflow-hidden rounded-lg bg-white shadow-xs ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/15">
            <div className="relative w-full overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-700 flex-shrink-0">
              <img 
                src="/images/lp-factures/Automatisez_relances.jpg" 
                alt="Paiements sans retard" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="relative p-6">
              <h3 className="font-mono text-xs/5 font-semibold tracking-widest text-gray-500 uppercase dark:text-gray-400">
                Des paiements sans retard
              </h3>
              <p className="mt-1 text-2xl/8 font-medium tracking-tight text-gray-950 dark:text-white">
                Automatisez toutes vos relances.
              </p>
              <p className="mt-2 max-w-[600px] text-sm/6 text-gray-600 dark:text-gray-400">
                Fini les oublis : nos relances automatiques rappellent à vos
                clients leurs factures dues, pour un encaissement rapide et sans
                efforts de votre part.
              </p>
            </div>
          </div>

          <div className="lg:col-span-3 lg:rounded-tr-4xl group relative flex flex-col overflow-hidden rounded-lg bg-white shadow-xs ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/15">
            <div className="relative w-full overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-700 flex-shrink-0">
              <img 
                src="/images/lp-factures/lourdeurs_administratives.jpg" 
                alt="Moins de paperasse" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="relative p-6">
              <h3 className="font-mono text-xs/5 font-semibold tracking-widest text-gray-500 uppercase dark:text-gray-400">
                Moins de paperasse, plus de liberté
              </h3>
              <p className="mt-1 text-2xl/8 font-medium tracking-tight text-gray-950 dark:text-white">
                Dites adieu aux lourdeurs administratives.
              </p>
              <p className="mt-2 max-w-[600px] text-sm/6 text-gray-600 dark:text-gray-400">
                Créez, envoyez et suivez vos factures en quelques clics grâce à
                une interface intuitive qui simplifie chaque étape et vous
                libère du temps au quotidien.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 lg:rounded-bl-4xl group relative flex flex-col overflow-hidden rounded-lg bg-white shadow-xs ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/15">
            <div className="relative w-full overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-700 flex-shrink-0">
              <img 
                src="/images/lp-factures/marquer_esprits.jpg" 
                alt="Plus pro, plus serein" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="relative p-6">
              <h3 className="font-mono text-xs/5 font-semibold tracking-widest text-gray-500 uppercase dark:text-gray-400">
                Plus pro, plus serein
              </h3>
              <p className="mt-1 text-2xl/8 font-medium tracking-tight text-gray-950 dark:text-white">
                Des factures à votre image, pour marquer les esprits.
              </p>
              <p className="mt-2 max-w-[600px] text-sm/6 text-gray-600 dark:text-gray-400">
                Projetez instantanément une image professionnelle avec des
                documents personnalisés et soignés qui renforcent la confiance
                de vos clients à chaque envoi.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 group relative flex flex-col overflow-hidden rounded-lg bg-white shadow-xs ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/15">
            <div className="relative w-full overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-700 flex-shrink-0">
              <img 
                src="/images/lp-factures/tresorerie.jpg" 
                alt="Vue claire sur les revenus" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="relative p-6">
              <h3 className="font-mono text-xs/5 font-semibold tracking-widest text-gray-500 uppercase dark:text-gray-400">
                Une vue claire sur vos revenus
              </h3>
              <p className="mt-1 text-2xl/8 font-medium tracking-tight text-gray-950 dark:text-white">
                Gardez un œil sur votre trésorerie, en temps réel.
              </p>
              <p className="mt-2 max-w-[600px] text-sm/6 text-gray-600 dark:text-gray-400">
                Pilotez votre activité sans stress : visualisez vos factures,
                paiements et relances en un coup d’œil, où que vous soyez, sur
                ordinateur ou mobile.
              </p>
            </div>
          </div>
          <div className="lg:col-span-2 pt-2 lg:rounded-br-4xl group relative flex flex-col overflow-hidden rounded-lg bg-white shadow-xs ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/15">
            <div className="relative w-full overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-700 flex-shrink-0">
              <img 
                src="/images/lp-factures/Facture_legalite.jpg" 
                alt="Conformité garantie" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="relative p-6">
              <h3 className="font-mono text-xs/5 font-semibold tracking-widest text-gray-500 uppercase dark:text-gray-400">
                Conformité garantie
              </h3>
              <p className="mt-1 text-2xl/8 font-medium tracking-tight text-gray-950 dark:text-white">
                Facturez en toute légalité, sans stress.
              </p>
              <p className="mt-2 max-w-[600px] text-sm/6 text-gray-600 dark:text-gray-400">
                Toutes vos factures respectent automatiquement les normes et
                obligations légales, pour une tranquillité d’esprit totale au
                quotidien.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
