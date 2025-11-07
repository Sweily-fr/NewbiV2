import React from "react";

export default function SectionAvantages() {
  return (
    <section className="bg-[#FDFDFD] dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-xl sm:text-3xl font-medium text-gray-900 mb-4">
          Obtenez ce que vous méritez,
          <br />
          sans effort
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-10 lg:grid-cols-6 lg:grid-rows-2">
          <div className="max-lg:rounded-t-4xl lg:col-span-3 lg:rounded-tl-4xl group relative flex flex-col overflow-hidden rounded-lg bg-white shadow-xs ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/15">
            <div className="relative w-full overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-700 flex-shrink-0">
              <img 
                src="/images/lp-transfert/paiement_transfert.jpg" 
                alt="Accès sécurisé par paiement du transfert" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="relative p-6">
              <h3 className="font-mono text-xs/5 font-semibold tracking-widest text-gray-500 uppercase dark:text-gray-400">
                Payez, puis téléchargez — simple et sûr.
              </h3>
              <p className="mt-1 text-2xl/8 font-medium tracking-tight text-gray-950 dark:text-white">
                Accès sécurisé par paiement du transfert.
              </p>
              <p className="mt-2 max-w-[600px] text-sm/6 text-gray-600 dark:text-gray-400">
                Protégez vos documents sensibles derrière un paiement obligatoire.
                Votre client reçoit un lien de téléchargement, débloqué
                uniquement après règlement. Vous choisissez le montant, suivez
                l’état (en attente, payé, téléchargé) et recevez des
                notifications à chaque étape.
              </p>
            </div>
          </div>

          <div className="lg:col-span-3 lg:rounded-tr-4xl group relative flex flex-col overflow-hidden rounded-lg bg-white shadow-xs ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/15">
            <div className="relative w-full overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-700 flex-shrink-0">
              <img 
                src="/images/lp-transfert/5_Go.jpg" 
                alt="Jusqu'à 5 Go par envoi" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="relative p-6">
              <h3 className="font-mono text-xs/5 font-semibold tracking-widest text-gray-500 uppercase dark:text-gray-400">
                Envoyez sans vous restreindre.
              </h3>
              <p className="mt-1 text-2xl/8 font-medium tracking-tight text-gray-950 dark:text-white">
                Jusqu’à 5 Go par envoi.
              </p>
              <p className="mt-2 max-w-[600px] text-sm/6 text-gray-600 dark:text-gray-400">
                Partagez des fichiers lourds sans compresser ni fractionner.
                Téléversement stable, reprise automatique en cas de coupure et
                prise en charge des formats professionnels les plus courants.
              </p>
            </div>
          </div>

          <div className="lg:col-span-6 lg:rounded-bl-4xl group relative flex flex-col overflow-hidden rounded-lg bg-white shadow-xs ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/15">
            <div className="relative w-full overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-700 flex-shrink-0">
              <img 
                src="/images/lp-transfert/lien_actif.jpg" 
                alt="Un lien actif jusqu'à 30 jours" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="relative p-6">
              <h3 className="font-mono text-xs/5 font-semibold tracking-widest text-gray-500 uppercase dark:text-gray-400">
                Un lien, du temps pour agir.
              </h3>
              <p className="mt-1 text-2xl/8 font-medium tracking-tight text-gray-950 dark:text-white">
                Un lien actif jusqu’à 30 jours.
              </p>
              <p className="mt-2 max-w-[600px] text-sm/6 text-gray-600 dark:text-gray-400">
                Offrez à vos clients une fenêtre confortable pour télécharger.
                Définissez la durée (jusqu’à 30 jours), avec rappel automatique
                avant expiration et désactivation immédiate au terme pour éviter
                les accès prolongés.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
