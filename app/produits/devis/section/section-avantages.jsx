import React from "react";
import { AnimatedList } from "@/src/components/magicui/animated-list";
import { cn } from "@/src/lib/utils";
import { getIconUrl } from "@/src/lib/image-utils";

let notifications = [
  {
    name: "Nouveau fichier reçu",
    description: "Un fichier vient de vous être envoyé.",
    time: "15m ago",

    icon: "💸",
    color: "#00C9A7",
  },
  {
    name: "Fichier téléchargé",
    description: "Votre fichier a été téléchargé par le destinataire.",
    time: "10m ago",
    icon: "👤",
    color: "#FFB800",
  },
  {
    name: "Transfert terminé",
    description: "Votre envoi a bien été complété.",
    time: "5m ago",
    icon: "💬",
    color: "#FF3D71",
  },
  {
    name: "Transfert sécurisé",
    description: "Votre fichier a été partagé avec un mot de passe.",
    time: "2m ago",
    icon: "🗞️",
    color: "#1E86FF",
  },
  {
    name: "Lien expiré",
    description: "Le lien de téléchargement a expiré.",
    time: "15m ago",

    icon: "💸",
    color: "#00C9A7",
  },
  {
    name: "Envoi programmé",
    description: "Votre fichier sera envoyé à l’heure prévue.",
    time: "10m ago",
    icon: "👤",
    color: "#FFB800",
  },
  {
    name: "Fichier supprimé",
    description: "Le fichier partagé a été supprimé du serveur.",
    time: "5m ago",
    icon: "💬",
    color: "#FF3D71",
  },
  {
    name: "Fichier partagé",
    description: "Votre fichier a été partagé avec un destinataire.",
    time: "2m ago",
    icon: "🗞️",
    color: "#1E86FF",
  },
  {
    name: "Nouveau message",
    description: "Un message vient de vous être envoyé.",
    time: "5m ago",
    icon: "💬",
    color: "#FF3D71",
  },
];

const Notification = ({ name, description, icon, color, time }) => {
  return (
    <figure
      className={cn(
        "relative mx-auto min-h-fit w-full max-w-[500px] cursor-pointer overflow-hidden rounded-lg p-4",
        // animation styles
        "transition-all duration-200 ease-in-out hover:scale-[103%]",
        // light styles
        "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
        // dark styles
        "transform-gpu dark:bg-transparent dark:backdrop-blur-md dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset]"
      )}
    >
      <div className="flex flex-row items-center gap-3">
        <div
          className="flex size-10 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: color,
          }}
        >
          <span className="text-lg">{icon}</span>
        </div>
        <div className="flex flex-col overflow-hidden">
          <figcaption className="flex flex-row items-center whitespace-pre text-lg font-medium dark:text-white ">
            <span className="text-sm sm:text-lg">{name}</span>
            <span className="mx-1">·</span>
            <span className="text-xs text-gray-500">{time}</span>
          </figcaption>
          <p className="text-sm font-normal dark:text-white/60">
            {description}
          </p>
        </div>
      </div>
    </figure>
  );
};

export default function SectionAvantages() {
  return (
    <section className="bg-[#FDFDFD] dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-xl sm:text-3xl font-medium text-gray-900 mb-4">
          Tout pour créer et gérer vos devis simplement
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-10 lg:grid-cols-6 lg:grid-rows-2">
          <div className="max-lg:rounded-t-4xl lg:col-span-3 lg:rounded-tl-4xl group relative flex flex-col overflow-hidden rounded-lg bg-white shadow-xs ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/15">
            <div className="relative w-full overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-700 flex-shrink-0">
              <img 
                src="/images/lp-devis/Generer_devis.jpg" 
                alt="Générer devis" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="relative p-6">
              <h3 className="font-mono text-xs/5 font-semibold tracking-widest text-gray-500 uppercase dark:text-gray-400">
                Création ultra-rapide de devis
              </h3>
              <p className="mt-1 text-2xl/8 font-medium tracking-tight text-gray-950 dark:text-white">
                Générez votre devis en quelques secondes.
              </p>
              <p className="mt-2 max-w-[600px] text-sm/6 text-gray-600 dark:text-gray-400">
                Remplissez les infos clés, sélectionnez vos produits et votre devis est prêt à être envoyé.
              </p>
            </div>
          </div>

          <div className="lg:col-span-3 lg:rounded-tr-4xl group relative flex flex-col overflow-hidden rounded-lg bg-white shadow-xs ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/15">
            <div className="relative w-full overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-700 flex-shrink-0">
              <img 
                src="/images/lp-devis/Devis_ressemble.jpg" 
                alt="Personnalisation" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="relative p-6">
              <h3 className="font-mono text-xs/5 font-semibold tracking-widest text-gray-500 uppercase dark:text-gray-400">
                Personnalisation à votre image
              </h3>
              <p className="mt-1 text-2xl/8 font-medium tracking-tight text-gray-950 dark:text-white">
                Un devis qui vous ressemble.
              </p>
              <p className="mt-2 max-w-[600px] text-sm/6 text-gray-600 dark:text-gray-400">
                Ajoutez logo et couleurs pour un devis à l’image de votre
                entreprise.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 lg:rounded-bl-4xl group relative flex flex-col overflow-hidden rounded-lg bg-white shadow-xs ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/15">
            <div className="relative w-full overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-700 flex-shrink-0">
              <img 
                src="/images/lp-devis/Creez_catalogue.jpg" 
                alt="Catalogue produit" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="relative p-6">
              <h3 className="font-mono text-xs/5 font-semibold tracking-widest text-gray-500 uppercase dark:text-gray-400">
                Un gain de temps grâce au catalogue produit
              </h3>
              <p className="mt-1 text-2xl/8 font-medium tracking-tight text-gray-950 dark:text-white">
                Créez votre catalogue produit une seule fois
              </p>
              <p className="mt-2 max-w-[600px] text-sm/6 text-gray-600 dark:text-gray-400">
                Ajoutez services et produits instantanément. Les prix, TVA et remises s’appliquent sans effort.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 group relative flex flex-col overflow-hidden rounded-lg bg-white shadow-xs ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/15">
            <div className="relative w-full overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-700 flex-shrink-0">
              <img 
                src="/images/lp-devis/retrouvez_clients.jpg" 
                alt="Catalogue client" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="relative p-6">
              <h3 className="font-mono text-xs/5 font-semibold tracking-widest text-gray-500 uppercase dark:text-gray-400">
              Un catalogue client intégré
              </h3>
              <p className="mt-1 text-2xl/8 font-medium tracking-tight text-gray-950 dark:text-white">
              Retrouvez vos clients en un clic.
              </p>
              <p className="mt-2 max-w-[600px] text-sm/6 text-gray-600 dark:text-gray-400">
              Renseignez vos infos clients une seule fois ou retrouvez-les facilement.
              </p>
            </div>
          </div>
          <div className="lg:col-span-2 pt-2 lg:rounded-br-4xl group relative flex flex-col overflow-hidden rounded-lg bg-white shadow-xs ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/15">
            <div className="relative w-full overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-700 flex-shrink-0">
              <img 
                src="/images/lp-devis/Avancement.jpg" 
                alt="Suivi devis" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="relative p-6">
              <h3 className="font-mono text-xs/5 font-semibold tracking-widest text-gray-500 uppercase dark:text-gray-400">
                Un suivi express de vos devis
              </h3>
              <p className="mt-1 text-2xl/8 font-medium tracking-tight text-gray-950 dark:text-white">
                Voyez leur avancement, relancez, concluez
              </p>
              <p className="mt-2 max-w-[600px] text-sm/6 text-gray-600 dark:text-gray-400">
                Suivez les ouvertures et statuts en temps réel. Relancez au bon moment pour accélérer la signature.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
