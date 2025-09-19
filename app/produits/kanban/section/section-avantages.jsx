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
          Obtenez ce que vous méritez.
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-10 lg:grid-cols-6 lg:grid-rows-2">
          <div className="max-lg:rounded-t-4xl lg:col-span-3 lg:rounded-tl-4xl group relative flex flex-col overflow-hidden rounded-lg bg-white shadow-xs ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/15">
            <div className="relative h-60 shrink-0">
              <div className="h-60 bg-[url(/images/lp-home/profile.png)] bg-[length:auto_250%] bg-[position:left_-135px_top_-130px] bg-no-repeat"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-white to-50% dark:from-gray-800 dark:from-[-25%]"></div>
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
            <div className="relative h-60 shrink-0">
              <div className="absolute inset-0 bg-[url(/images/lp-home/competitors.png)] bg-[length:auto_250%] bg-[position:left_-45px_top_-130px] bg-no-repeat"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-white to-50% dark:from-gray-800 dark:from-[-25%]"></div>
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
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,transparent_25%,color-mix(in_srgb,var(--color-blue-500)_var(--opacity),transparent)_100%)] ring-1 ring-blue-500/8 ring-inset"
                  ></div>
                  <div
                    style={{
                      "--opacity": "5%",
                      width: "400px",
                      height: "400px",
                      willChange: "auto",
                    }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,transparent_25%,color-mix(in_srgb,var(--color-blue-500)_var(--opacity),transparent)_100%)] ring-1 ring-blue-500/8 ring-inset"
                  ></div>
                  <div
                    style={{
                      "--opacity": "5%",
                      width: "272px",
                      height: "272px",
                      willChange: "auto",
                    }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,transparent_25%,color-mix(in_srgb,var(--color-blue-500)_var(--opacity),transparent)_100%)] ring-1 ring-blue-500/8 ring-inset"
                  ></div>
                  <div
                    style={{
                      "--opacity": "10%",
                      width: "144px",
                      height: "144px",
                      willChange: "auto",
                    }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,transparent_25%,color-mix(in_srgb,var(--color-blue-500)_var(--opacity),transparent)_100%)] ring-1 ring-blue-500/8 ring-inset"
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-white to-35% dark:from-gray-800 dark:from-[-25%]"></div>
                </div>
                <div className="absolute left-1/2 h-full w-104 -translate-x-1/2">
                  <div className="absolute top-32 left-44 flex size-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5">
                    <svg
                      viewBox="0 0 34 34"
                      fill="none"
                      className="h-9 fill-black dark:fill-white"
                    >
                      <path d="M19.598 18.5C18.7696 19.9349 16.9348 20.4265 15.4999 19.5981C14.065 18.7696 13.5734 16.9349 14.4018 15.5C15.2303 14.0651 17.065 13.5735 18.4999 14.4019C19.9348 15.2303 20.4264 17.0651 19.598 18.5Z"></path>
                      <path d="M23.232 10.2058C22.6797 11.1623 21.4565 11.4901 20.4999 10.9378C19.5433 10.3855 19.2156 9.16235 19.7679 8.20576C20.3201 7.24918 21.5433 6.92143 22.4999 7.47371C23.4565 8.026 23.7842 9.24918 23.232 10.2058Z"></path>
                      <path d="M19.7679 25.7944C19.2156 24.8378 19.5433 23.6146 20.4999 23.0623C21.4565 22.51 22.6797 22.8378 23.232 23.7944C23.7843 24.7509 23.4565 25.9741 22.4999 26.5264C21.5433 27.0787 20.3202 26.7509 19.7679 25.7944Z"></path>
                      <path d="M25.9999 19.0001C24.8953 19.0001 23.9999 18.1047 23.9999 17.0001C23.9999 15.8956 24.8953 15.0001 25.9999 15.0001C27.1045 15.0001 27.9999 15.8956 27.9999 17.0001C27.9999 18.1047 27.1045 19.0001 25.9999 19.0001Z"></path>
                      <path d="M14.232 25.7942C13.6797 26.7508 12.4565 27.0786 11.4999 26.5263C10.5433 25.974 10.2156 24.7508 10.7679 23.7942C11.3201 22.8376 12.5433 22.5099 13.4999 23.0622C14.4565 23.6145 14.7842 24.8376 14.232 25.7942Z"></path>
                      <path d="M10.7679 10.2059C10.2157 9.24936 10.5434 8.02618 11.5 7.4739C12.4566 6.92161 13.6798 7.24936 14.232 8.20595C14.7843 9.16253 14.4566 10.3857 13.5 10.938C12.5434 11.4903 11.3202 11.1625 10.7679 10.2059Z"></path>
                      <path d="M7.99999 19.0002C6.89542 19.0002 5.99999 18.1047 5.99999 17.0002C5.99999 15.8956 6.89542 15.0002 7.99999 15.0002C9.10456 15.0002 9.99999 15.8956 9.99999 17.0002C9.99999 18.1047 9.10456 19.0002 7.99999 19.0002Z"></path>
                      <path d="M25.8659 3.64359C25.5898 4.12188 24.9782 4.28575 24.4999 4.00961C24.0216 3.73347 23.8577 3.12188 24.1339 2.64359C24.41 2.16529 25.0216 2.00142 25.4999 2.27756C25.9782 2.5537 26.1421 3.16529 25.8659 3.64359Z"></path>
                      <path d="M33.0001 18.0002C32.4478 18.0002 32.0001 17.5524 32.0001 17.0002C32.0001 16.4479 32.4478 16.0002 33.0001 16.0002C33.5523 16.0002 34.0001 16.4479 34.0001 17.0002C34.0001 17.5524 33.5523 18.0002 33.0001 18.0002Z"></path>
                      <path d="M31.3561 9.86594C30.8778 10.1421 30.2663 9.97821 29.9901 9.49992C29.714 9.02162 29.8778 8.41003 30.3561 8.13389C30.8344 7.85775 31.446 8.02162 31.7222 8.49992C31.9983 8.97821 31.8344 9.5898 31.3561 9.86594Z"></path>
                      <path d="M30.3563 25.866C29.878 25.5899 29.7141 24.9783 29.9903 24.5C30.2664 24.0217 30.878 23.8578 31.3563 24.134C31.8346 24.4101 31.9985 25.0217 31.7223 25.5C31.4462 25.9783 30.8346 26.1422 30.3563 25.866Z"></path>
                      <path d="M16.0001 33.0001C16.0001 32.4478 16.4478 32.0001 17.0001 32.0001C17.5524 32.0001 18.0001 32.4478 18.0001 33.0001C18.0001 33.5524 17.5524 34.0001 17.0001 34.0001C16.4478 34.0001 16.0001 33.5524 16.0001 33.0001Z"></path>
                      <path d="M24.134 31.3566C23.8579 30.8783 24.0218 30.2667 24.5001 29.9905C24.9784 29.7144 25.59 29.8783 25.8661 30.3566C26.1422 30.8349 25.9784 31.4464 25.5001 31.7226C25.0218 31.9987 24.4102 31.8349 24.134 31.3566Z"></path>
                      <path d="M9.86593 31.3564C9.58978 31.8347 8.97819 31.9986 8.4999 31.7224C8.02161 31.4463 7.85773 30.8347 8.13388 30.3564C8.41002 29.8781 9.02161 29.7142 9.4999 29.9904C9.97819 30.2665 10.1421 30.8781 9.86593 31.3564Z"></path>
                      <path d="M1 18.0001C0.447715 18.0001 -3.44684e-08 17.5524 0 17.0001C3.44684e-08 16.4478 0.447715 16.0001 1 16.0001C1.55228 16.0001 2 16.4478 2 17.0001C2 17.5524 1.55228 18.0001 1 18.0001Z"></path>
                      <path d="M3.64329 25.866C3.16499 26.1422 2.5534 25.9783 2.27726 25.5C2.00112 25.0217 2.16499 24.4101 2.64329 24.134C3.12158 23.8578 3.73317 24.0217 4.00931 24.5C4.28545 24.9783 4.12158 25.5899 3.64329 25.866Z"></path>
                      <path d="M2.6435 9.86602C2.1652 9.58987 2.00133 8.97828 2.27747 8.49999C2.55361 8.0217 3.1652 7.85782 3.6435 8.13397C4.12179 8.41011 4.28566 9.0217 4.00952 9.49999C3.73338 9.97828 3.12179 10.1422 2.6435 9.86602Z"></path>
                      <path d="M16.0001 1C16.0001 0.447715 16.4478 -4.87226e-08 17.0001 0C17.5524 4.87226e-08 18.0001 0.447715 18.0001 1C18.0001 1.55228 17.5524 2 17.0001 2C16.4478 2 16.0001 1.55228 16.0001 1Z"></path>
                      <path d="M8.13398 3.64371C7.85783 3.16542 8.02171 2.55383 8.5 2.27768C8.97829 2.00154 9.58988 2.16542 9.86603 2.64371C10.1422 3.122 9.97829 3.73359 9.5 4.00973C9.02171 4.28588 8.41012 4.122 8.13398 3.64371Z"></path>
                    </svg>
                  </div>
                  <img
                    alt=""
                    src={getIconUrl("linkedin.svg")}
                    style={{
                      left: "360px",
                      top: "144px",
                      transform: "none",
                      willChange: "auto",
                    }}
                    className="absolute size-16 rounded-full bg-white shadow-sm ring-1 ring-black/5"
                  />
                  <img
                    alt=""
                    src={getIconUrl("dribbble.svg")}
                    style={{
                      left: "285px",
                      top: "20px",
                      transform: "none",
                      willChange: "auto",
                    }}
                    className="absolute size-16 rounded-full bg-white shadow-sm ring-1 ring-black/5"
                  />
                  <img
                    alt=""
                    src={getIconUrl("upwork.svg")}
                    style={{
                      left: "255px",
                      top: "210px",
                      transform: "none",
                      willChange: "auto",
                    }}
                    className="absolute size-16 rounded-full bg-white shadow-sm ring-1 ring-black/5"
                  />
                  <img
                    alt=""
                    src={getIconUrl("linkedin.svg")}
                    style={{
                      left: "144px",
                      top: "40px",
                      transform: "none",
                      willChange: "auto",
                    }}
                    className="absolute size-16 rounded-full bg-white shadow-sm ring-1 ring-black/5"
                  />
                  <img
                    alt=""
                    src={getIconUrl("upwork.svg")}
                    style={{
                      left: "36px",
                      top: "56px",
                      transform: "none",
                      willChange: "auto",
                    }}
                    className="absolute size-16 rounded-full bg-white shadow-sm ring-1 ring-black/5"
                  />
                  <img
                    alt=""
                    src={getIconUrl("we-work-remotely.svg")}
                    style={{
                      left: "96px",
                      top: "176px",
                      transform: "none",
                      willChange: "auto",
                    }}
                    className="absolute size-16 rounded-full bg-white shadow-sm ring-1 ring-black/5"
                  />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-white to-50% dark:from-gray-800 dark:from-[-25%]"></div>
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
            <div className="relative h-60 shrink-0">
              <div className="absolute inset-0 bg-[url(/images/lp-home/app.png)] bg-[length:auto_250%] bg-[position:left_5px_top_-80px] bg-no-repeat"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-white to-50% dark:from-gray-800 dark:from-[-25%]"></div>
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
