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

export default function FeatureGrid({ className }) {
  return (
    <section className="bg-[#FDFDFD] dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl sm:text-4xl font-medium text-gray-900 mb-4">
          Des outils puissants pour simplifier
          <br /> votre quotidien
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-10 lg:grid-cols-6 lg:grid-rows-2">
          <div className="max-lg:rounded-t-4xl lg:col-span-3 lg:rounded-tl-4xl group relative flex flex-col overflow-hidden rounded-lg bg-white shadow-xs ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/15">
            <div className="relative h-60 shrink-0">
              <div className="h-60 bg-[url(/images/lp-home/facturesPro.svg)] bg-[length:auto_152%] bg-[position:left_12px_top_-20px] bg-no-repeat"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-white to-50% dark:from-gray-800 dark:from-[-25%]"></div>
            </div>
            <div className="relative p-6">
              <h3 className="font-mono text-xs/5 font-semibold tracking-widest text-gray-500 uppercase dark:text-gray-400">
                Facturation
              </h3>
              <p className="mt-1 text-2xl/8 font-medium tracking-tight text-gray-950 dark:text-white">
                Factures professionnelles
              </p>
              <p className="mt-2 max-w-[600px] text-sm/6 text-gray-600 dark:text-gray-400">
                Créez des factures personnalisées en quelques clics. Ajoutez
                votre logo, définissez vos conditions de paiement et envoyez-les
                directement à vos clients.
              </p>
            </div>
          </div>

          <div className="lg:col-span-3 lg:rounded-tr-4xl group relative flex flex-col overflow-hidden rounded-lg bg-white shadow-xs ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/15">
            <div className="relative h-60 shrink-0">
              <div className="absolute inset-0 bg-[url(/images/lp-home/competitors.png)] bg-[length:auto_250%] bg-[position:left_-45px_top_-130px] bg-no-repeat"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-white to-50% dark:from-gray-800 dark:from-[-25%]"></div>
            </div>
            <div className="relative p-6">
              <h3 className="font-mono text-xs/5 font-semibold tracking-widest text-gray-500 uppercase dark:text-gray-400">
                Devis
              </h3>
              <p className="mt-1 text-2xl/8 font-medium tracking-tight text-gray-950 dark:text-white">
                Devis convaincants
              </p>
              <p className="mt-2 max-w-[600px] text-sm/6 text-gray-600 dark:text-gray-400">
                Élaborez des devis détaillés et professionnels qui
                impressionneront vos clients. Suivez leur statut en temps réel
                et convertissez-les en factures en un clic.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 lg:rounded-bl-4xl group relative flex flex-col overflow-hidden rounded-lg bg-white shadow-xs ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/15">
            <div className="relative h-60 shrink-0">
              <div
                aria-hidden="true"
                className="relative h-full overflow-hidden"
              >
                <div className="absolute inset-0">
                  <div
                    style={{
                      "--opacity": "3%",
                      width: "528px",
                      height: "528px",
                      willChange: "auto",
                    }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,transparent_25%,color-mix(in_srgb,#5B50FF_var(--opacity),transparent)_100%)] ring-1 ring-blue-500/8 ring-inset"
                  ></div>
                  <div
                    style={{
                      "--opacity": "5%",
                      width: "400px",
                      height: "400px",
                      willChange: "auto",
                    }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,transparent_25%,color-mix(in_srgb,#5B50FF_var(--opacity),transparent)_100%)] ring-1 ring-blue-500/8 ring-inset"
                  ></div>
                  <div
                    style={{
                      "--opacity": "5%",
                      width: "272px",
                      height: "272px",
                      willChange: "auto",
                    }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,transparent_25%,color-mix(in_srgb,#5B50FF_var(--opacity),transparent)_100%)] ring-1 ring-blue-500/8 ring-inset"
                  ></div>
                  <div
                    style={{
                      "--opacity": "10%",
                      width: "144px",
                      height: "144px",
                      willChange: "auto",
                    }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,transparent_25%,color-mix(in_srgb,#5B50FF_var(--opacity),transparent)_100%)] ring-1 ring-blue-500/8 ring-inset"
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-white to-35% dark:from-gray-800 dark:from-[-25%]"></div>
                </div>
                <div className="absolute left-1/2 h-full w-104 -translate-x-1/2">
                  <div
                    style={{
                      right: "150px",
                      top: "120px",
                      transform: "none",
                      willChange: "auto",
                    }}
                    className="absolute size-16 rounded-full bg-white shadow-sm ring-1 ring-black/5 flex items-center justify-center"
                  >
                    <img
                      alt=""
                      src={getIconUrl("outlook-svgrepo-com.svg")}
                      className="size-8"
                    />
                  </div>
                  <div
                    style={{
                      left: "360px",
                      top: "144px",
                      transform: "none",
                      willChange: "auto",
                    }}
                    className="absolute size-16 rounded-full bg-white shadow-sm ring-1 ring-black/5 flex items-center justify-center"
                  >
                    <img
                      alt=""
                      src={getIconUrl("linkedin-icon.svg")}
                      className="size-8"
                    />
                  </div>
                  <div
                    style={{
                      left: "285px",
                      top: "20px",
                      transform: "none",
                      willChange: "auto",
                    }}
                    className="absolute size-16 rounded-full bg-white shadow-sm ring-1 ring-black/5 flex items-center justify-center"
                  >
                    <img
                      alt=""
                      src={getIconUrl("google-gmail.svg")}
                      className="size-8"
                    />
                  </div>
                  <div
                    style={{
                      left: "255px",
                      top: "210px",
                      transform: "none",
                      willChange: "auto",
                    }}
                    className="absolute size-16 rounded-full bg-white shadow-sm ring-1 ring-black/5 flex items-center justify-center"
                  >
                    <img
                      alt=""
                      src={getIconUrl("yahoo.svg")}
                      className="size-8"
                    />
                  </div>
                  <div
                    style={{
                      left: "144px",
                      top: "40px",
                      transform: "none",
                      willChange: "auto",
                    }}
                    className="absolute size-16 rounded-full bg-white shadow-sm ring-1 ring-black/5 flex items-center justify-center"
                  >
                    <img
                      alt=""
                      src={getIconUrl("apple.svg")}
                      className="size-8"
                    />
                  </div>
                  <div
                    style={{
                      left: "36px",
                      top: "56px",
                      transform: "none",
                      willChange: "auto",
                    }}
                    className="absolute size-16 rounded-full bg-white shadow-sm ring-1 ring-black/5 flex items-center justify-center"
                  >
                    <img
                      alt=""
                      src={getIconUrl("yahoo.svg")}
                      className="size-8"
                    />
                  </div>
                  <div
                    style={{
                      left: "96px",
                      top: "176px",
                      transform: "none",
                      willChange: "auto",
                    }}
                    className="absolute size-16 rounded-full bg-white shadow-sm ring-1 ring-black/5 flex items-center justify-center"
                  >
                    <img
                      alt=""
                      src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Thunderbird_2023_icon.svg"
                      className="size-8"
                    />
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-white to-50% dark:from-gray-800 dark:from-[-25%]"></div>
            </div>
            <div className="relative p-6">
              <h3 className="font-mono text-xs/5 font-semibold tracking-widest text-gray-500 uppercase dark:text-gray-400">
                Signature
              </h3>
              <p className="mt-1 text-2xl/8 font-medium tracking-tight text-gray-950 dark:text-white">
                Signatures de mail
              </p>
              <p className="mt-2 max-w-[600px] text-sm/6 text-gray-600 dark:text-gray-400">
                Créez des signatures email professionnelles pour toute votre
                équipe. Intégrez votre logo, vos coordonnées et des liens vers
                vos réseaux sociaux en quelques minutes.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 group relative flex flex-col overflow-hidden rounded-lg bg-white shadow-xs ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/15">
            <div className="relative h-60 shrink-0">
              <div className="absolute inset-0 bg-[url(/images/lp-home/app.png)] bg-[length:auto_150%] bg-[position:left_-5px_top_0px] bg-no-repeat"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-white to-50% dark:from-gray-800 dark:from-[-25%]"></div>
            </div>
            <div className="relative p-6">
              <h3 className="font-mono text-xs/5 font-semibold tracking-widest text-gray-500 uppercase dark:text-gray-400">
                Organisation
              </h3>
              <p className="mt-1 text-2xl/8 font-medium tracking-tight text-gray-950 dark:text-white">
                Tableau Kanban
              </p>
              <p className="mt-2 max-w-[600px] text-sm/6 text-gray-600 dark:text-gray-400">
                Organisez vos projets avec notre tableau Kanban intuitif. Suivez
                la progression de vos tâches, assignez-les à votre équipe et
                visualisez votre flux de travail en temps réel.
              </p>
            </div>
          </div>
          <div className="lg:col-span-2 pt-2 lg:rounded-br-4xl group relative flex flex-col overflow-hidden rounded-lg bg-white shadow-xs ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/15">
            <div className="relative h-60 shrink-0">
              {/* Notifications en arrière-plan */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 scale-90 opacity-100">
                  <AnimatedList>
                    {notifications.map((item, idx) => (
                      <Notification {...item} key={idx} />
                    ))}
                  </AnimatedList>
                </div>
                {/* Effet de flou blanc en bas */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white to-transparent dark:from-gray-800"></div>
              </div>

              {/* Image de fond originale */}
              {/* <div className="absolute inset-0 bg-[url(/profile.png)] bg-[length:auto_100%] bg-[position:left_-20px_top_0px] bg-no-repeat opacity-60"></div> */}
              <div className="absolute inset-0 bg-gradient-to-t from-white to-50% dark:from-gray-800 dark:from-[-25%]"></div>
            </div>
            <div className="relative p-6">
              <h3 className="font-mono text-xs/5 font-semibold tracking-widest text-gray-500 uppercase dark:text-gray-400">
                Partage
              </h3>
              <p className="mt-1 text-2xl/8 font-medium tracking-tight text-gray-950 dark:text-white">
                Transfert de fichiers
              </p>
              <p className="mt-2 max-w-[600px] text-sm/6 text-gray-600 dark:text-gray-400">
                Partagez facilement des fichiers volumineux avec vos clients et
                collaborateurs. Sécurisez vos transferts avec des mots de passe
                et suivez les téléchargements en temps réel.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
