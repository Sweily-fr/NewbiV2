"use client";
import React from "react";

export default function BusinessAgility() {
  return (
    <div className="mx-2 mt-20 rounded-[15px] md:rounded-[20px] lg:rounded-[20px] bg-[#13131D] py-32">
      <div className="px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:max-w-7xl">
          <h2
            data-dark="true"
            className="font-mono text-xs/5 font-semibold tracking-widest text-gray-500 uppercase data-dark:text-gray-400"
          >
            Évoluez
          </h2>
          <h3
            data-dark="true"
            className="text-2xl sm:text-4xl font-medium text-gray-900 mb-4 data-dark:text-white"
          >
            Apportez de l'agilité à votre entreprise.
          </h3>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-16 lg:grid-cols-6 lg:grid-rows-2">
            <div
              data-dark="true"
              className="max-lg:rounded-t-4xl lg:col-span-4 lg:rounded-tl-4xl group relative flex flex-col overflow-hidden rounded-lg shadow-lg" style={{background: 'radial-gradient(circle 400px at center top, #2A2B4F 0%, #1B1D2A 100%)'}}
            >
              <div className="relative h-60 w-full overflow-hidden flex items-center justify-center flex-shrink-0">
                <img 
                  src="/images/lp-home/Collaborateur.png" 
                  alt="Collaborateur" 
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-linear-to-b from-white to-50% group-data-dark:from-gray-800 group-data-dark:from-[-25%]"></div>
              </div>
              <div className="p-6">
                <h3
                  data-dark="true"
                  className="font-mono text-xs/5 font-semibold tracking-widest text-gray-500 uppercase data-dark:text-gray-400"
                >
                  Tous au même niveau
                </h3>
                <p className="mt-1 text-2xl/8 font-medium tracking-tight text-gray-950 group-data-dark:text-white">
                  Ajoutez vos collaborateurs sans limites fonctionnelles
                </p>
                <p className="mt-2 max-w-[600px] text-sm/6 text-gray-600 group-data-dark:text-gray-400">
                  Invitez vos collègues en quelques clics et offrez-leur exactement les mêmes fonctionnalités que vous. Chacun peut créer, modifier, envoyer, suivre et sécuriser ses contenus sans passer par un administrateur. Droits clairs, onboarding express et visibilité partagée pour travailler vite et bien, ensemble.
                </p>
              </div>
            </div>
            <div
              data-dark="true"
              className="z-10 lg:col-span-2 lg:rounded-tr-4xl group relative flex flex-col overflow-hidden rounded-lg shadow-lg" style={{background: 'radial-gradient(circle 400px at center top, #2A2B4F 0%, #1B1D2A 100%)'}}
            >
              <div className="relative w-full overflow-hidden flex items-center justify-center flex-shrink-0">
                <img 
                  src="/images/lp-home/Vitesse_superieur.png" 
                  alt="Vitesse supérieure" 
                  className="w-full h-full object-contain"
                />
                {/* <div className="absolute inset-0 bg-linear-to-b from-white to-50% group-data-dark:from-gray-800 group-data-dark:from-[-25%]"></div> */}
              </div>
              <div className="p-6">
                <h3
                  data-dark="true"
                  className="font-mono text-xs/5 font-semibold tracking-widest text-gray-500 uppercase data-dark:text-gray-400"
                >
                  Automatisation et workflow
                </h3>
                <p className="mt-1 text-2xl/8 font-medium tracking-tight text-gray-950 group-data-dark:text-white">
                  Passez à la vitesse supérieur
                </p>
                <p className="mt-2 max-w-[600px] text-sm/6 text-gray-600 group-data-dark:text-gray-400">
                  Gagnez des heures en automatisant les tâches répétitives (modèles, déploiements, rappels, expirations) et adaptez la plateforme à vos process plutôt que l’inverse. Workflows configurables, reprises automatiques, et une interface pensée pour aller droit au but: vous livrez plus, plus vite.
                </p>
              </div>
            </div>
            <div
              data-dark="true"
              className="lg:col-span-2 lg:rounded-bl-4xl group relative flex flex-col overflow-hidden rounded-lg shadow-lg" style={{background: 'radial-gradient(circle 400px at center top, #2A2B4F 0%, #1B1D2A 100%)'}}
            >
              <div className="relative w-full overflow-hidden flex items-center justify-center flex-shrink-0 p-6">
                <div className="w-full h-full rounded-lg flex items-center justify-center to-transparent backdrop-blur-sm">
                  <img 
                    src="/images/lp-home/Ecosysteme.png" 
                    alt="Écosystème" 
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
                {/* <div className="absolute inset-0 bg-linear-to-b from-white to-50% group-data-dark:from-gray-800 group-data-dark:from-[-25%]"></div> */}
              </div>
              <div className="p-6">
                <h3
                  data-dark="true"
                  className="font-mono text-xs/5 font-semibold tracking-widest text-gray-500 uppercase data-dark:text-gray-400"
                >
                  Connectivité totale
                </h3>
                <p className="mt-1 text-2xl/8 font-medium tracking-tight text-gray-950 group-data-dark:text-white">
                  Restez maître de votre écosystème digital
                </p>
                <p className="mt-2 max-w-[600px] text-sm/6 text-gray-600 group-data-dark:text-gray-400">
                Faites circuler vos informations produits, clients et projets entre vos outils en toute fluidité. Connectez CRM, facturation, stockage et messagerie pour éviter les doubles saisies, garder des données à jour et déclencher des actions automatiques au bon moment.
                </p>
              </div>
            </div>
            <div
              data-dark="true"
              className="lg:col-span-4 lg:rounded-br-4xl group relative flex flex-col overflow-hidden rounded-lg shadow-lg" style={{background: 'radial-gradient(circle 400px at center top, #2A2B4F 0%, #1B1D2A 100%)'}}
            >
              <div className="relative w-full overflow-hidden flex items-center justify-center flex-shrink-0 px-7">
                <img 
                  src="/images/lp-home/Reglement.jpg" 
                  alt="Règlement" 
                  className="w-full h-full object-contain rounded-b-4xl"
                />
                {/* <div className="absolute inset-0 bg-linear-to-b from-white to-50% group-data-dark:from-gray-800 group-data-dark:from-[-25%]"></div> */}
              </div>
              <div className="p-6">
                <h3
                  data-dark="true"
                  className="font-mono text-xs/5 font-semibold tracking-widest text-gray-500 uppercase data-dark:text-gray-400"
                >
                  Sécurisez votre travail
                </h3>
                <p className="mt-1 text-2xl/8 font-medium tracking-tight text-gray-950 group-data-dark:text-white">
                  Ne courrez plus derrière vos règlements
                </p>
                <p className="mt-2 max-w-[600px] text-sm/6 text-gray-600 group-data-dark:text-gray-400">
                  Verrouillez l’accès à vos livrables derrière un paiement: vos clients paient, puis téléchargent. Fini la course aux règlements. Suivez l’état (en attente, payé, téléchargé), fixez le prix, la durée d’accès et, si besoin, révoquez en un clic. Vous sécurisez la valeur, vous gardez le contrôle.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
