import React from "react";

export default function SectionAvantages() {
  return (
    <section className="bg-[#FDFDFD] dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-xl sm:text-3xl font-medium text-gray-900 mb-4">
          Obtenez ce que vous méritez.
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-10 lg:grid-cols-6 lg:grid-rows-2">
          <div className="max-lg:rounded-t-4xl lg:col-span-3 lg:rounded-tl-4xl group relative flex flex-col overflow-hidden rounded-lg bg-white shadow-xs ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/15">
            <div className="relative w-full overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-700 flex-shrink-0">
              <img 
                src="/images/lp-kanban/Simplicite.jpg" 
                alt="Simplicité radicale" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="relative p-6">
              <h3 className="font-mono text-xs/5 font-semibold tracking-widest text-gray-500 uppercase dark:text-gray-400">
                Tout est clair, tout de suite
              </h3>
              <p className="mt-1 text-2xl/8 font-medium tracking-tight text-gray-950 dark:text-white">
                Simplicité radicale
              </p>
              <p className="mt-2 max-w-[600px] text-sm/6 text-gray-600 dark:text-gray-400">
                Glissez, déposez vos cartes, changez de colonne, c’est fait. Pas
                de superflu, juste une interface intuitive pour avancer sur
                l’essentiel.
              </p>
            </div>
          </div>

          <div className="lg:col-span-3 lg:rounded-tr-4xl group relative flex flex-col overflow-hidden rounded-lg bg-white shadow-xs ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/15">
            <div className="relative w-full overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-700 flex-shrink-0">
              <img 
                src="/images/lp-kanban/personnalisation_totale.jpg" 
                alt="Une personnalisation totale" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="relative p-6">
              <h3 className="font-mono text-xs/5 font-semibold tracking-widest text-gray-500 uppercase dark:text-gray-400">
                Votre workflow, vos règles
              </h3>
              <p className="mt-1 text-2xl/8 font-medium tracking-tight text-gray-950 dark:text-white">
                Une personnalisation totale
              </p>
              <p className="mt-2 max-w-[600px] text-sm/6 text-gray-600 dark:text-gray-400">
                Créez vos colonnes, labels et champs personnalisés. Adaptez
                votre Kanban à votre manière de travailler, pas l’inverse.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 lg:rounded-bl-4xl group relative flex flex-col overflow-hidden rounded-lg bg-white shadow-xs ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/15">
            <div className="relative w-full overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-700 flex-shrink-0">
              <img 
                src="/images/lp-kanban/calendrier.jpg" 
                alt="Synchronisez votre calendrier" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="relative p-6">
              <h3 className="font-mono text-xs/5 font-semibold tracking-widest text-gray-500 uppercase dark:text-gray-400">
                Vos tâches dans votre agenda
              </h3>
              <p className="mt-1 text-2xl/8 font-medium tracking-tight text-gray-950 dark:text-white">
                Synchronisez votre calendrier
              </p>
              <p className="mt-2 max-w-[600px] text-sm/6 text-gray-600 dark:text-gray-400">
                Connectez votre agenda et voyez les échéances et priorités en
                temps réel. Modifiez une date ici, elle s’actualise partout.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 group relative flex flex-col overflow-hidden rounded-lg bg-white shadow-xs ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/15">
            <div className="relative w-full overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-700 flex-shrink-0">
              <img 
                src="/images/lp-kanban/relances_automatiques.jpg" 
                alt="Rappels et relances automatiques" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="relative p-6">
              <h3 className="font-mono text-xs/5 font-semibold tracking-widest text-gray-500 uppercase dark:text-gray-400">
                Zéro tâche oubliée
              </h3>
              <p className="mt-1 text-2xl/8 font-medium tracking-tight text-gray-950 dark:text-white">
                Rappels et relances automatiques
              </p>
              <p className="mt-2 max-w-[600px] text-sm/6 text-gray-600 dark:text-gray-400">
                Notifications intelligentes avant échéance, relances après.
                Vous gardez le fil, même dans les périodes chargées.
              </p>
            </div>
          </div>
          <div className="lg:col-span-2 pt-2 lg:rounded-br-4xl group relative flex flex-col overflow-hidden rounded-lg bg-white shadow-xs ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/15">
            <div className="relative w-full overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-700 flex-shrink-0">
              <img 
                src="/images/lp-kanban/gain_organisationnel.jpg" 
                alt="Un gain organisationnel immédiat" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="relative p-6">
              <h3 className="font-mono text-xs/5 font-semibold tracking-widest text-gray-500 uppercase dark:text-gray-400">
                Plus de visibilité, plus d’impact
              </h3>
              <p className="mt-1 text-2xl/8 font-medium tracking-tight text-gray-950 dark:text-white">
                Un gain organisationnel immédiat
              </p>
              <p className="mt-2 max-w-[600px] text-sm/6 text-gray-600 dark:text-gray-400">
                Priorisez en un coup d’œil, limitez le travail en cours et
                accélérez les livraisons. Résultat: plus de fluidité, plus de
                résultats.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
