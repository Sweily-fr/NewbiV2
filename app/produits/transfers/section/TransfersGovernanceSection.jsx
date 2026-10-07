import React from "react";
import { Mail, MonitorSmartphone, ShieldCheck, Timer } from "lucide-react";
import { SHEET, VISUEL } from "@/src/lib/lp-visuels";
import {
  VisuelFiche,
  VisuelListe,
  VisuelPhoto,
  VisuelTuiles,
} from "@/src/components/lp/visuels";

// Même bento que « Garde le contrôle de ton activité » sur la LP home, déjà
// repris sur les LP signatures et facturation électronique : une grande carte
// et une carte moyenne en haut, trois cartes en dessous. Chaque carte porte un
// visuel ancré en bas — trois illustrations et deux photographies, pour que
// cinq cartes d'affilée ne se lisent pas toutes pareil.
const CARD =
  "rounded-3xl bg-gradient-to-b from-[#F4F4F6] to-[#FAFAFB] p-7 md:p-8 pb-0 flex flex-col overflow-hidden";
const TITLE =
  "text-xl md:text-2xl font-medium tracking-tight text-gray-950 mb-3";
const TEXT = "text-[15px] leading-relaxed text-gray-700";
// Cadre des deux photographies : elles remplissent la hauteur disponible et
// sortent du cadre à droite et en bas, qui les recadre.
const PHOTO = "left-12 -right-10 top-0 -bottom-10";

export default function TransfersGovernanceSection() {
  return (
    <section className="pt-10 md:pt-20 lg:pt-22 relative overflow-hidden px-5">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-balance text-gray-950 mb-4">
          Tout ce qu&apos;il faut pour transférer en toute confiance
        </h2>
        <p className="text-[17px] leading-relaxed text-gray-600 max-w-2xl mb-10 md:mb-14">
          Un lien de téléchargement, une date d&apos;expiration, un mot de passe
          si vous le voulez : l&apos;envoi de fichiers volumineux se règle
          depuis un seul écran, et vous savez toujours où en est votre
          transfert.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5">
          <article className={`${CARD} md:col-span-7 min-h-[470px]`}>
            <h3 className={TITLE}>
              Jusqu&apos;à 50 Go par transfert, sans compression
            </h3>
            <p className={`${TEXT} max-w-xl`}>
              Rushes vidéo, maquettes, archives de projet, plans 3D : vous
              déposez vos fichiers volumineux tels quels, dans n&apos;importe
              quel format, et ils arrivent intacts. Le volume dépend de votre
              offre : 5 Go par transfert en Freelance, 15 Go en TPE, 50 Go en
              Entreprise. Pas de découpage en plusieurs envois, pas de qualité
              sacrifiée pour tenir dans une pièce jointe.
            </p>
            <div className={VISUEL}>
              {/* Les trois paliers que le texte énumère, rien de plus. */}
              <VisuelTuiles
                className={SHEET}
                titre="Taille d'un transfert, selon votre offre"
                tuiles={[
                  { label: "Freelance", valeur: "5 Go" },
                  { label: "TPE", valeur: "15 Go" },
                  { label: "Entreprise", valeur: "50 Go", enAvant: true },
                ]}
                chip="Sans compression, tous formats"
              />
            </div>
          </article>

          <article className={`${CARD} md:col-span-5 min-h-[470px]`}>
            <h3 className={TITLE}>Un lien prêt en quelques secondes</h3>
            <p className={TEXT}>
              Glissez vos fichiers, Newbi génère le lien de téléchargement. À
              vous de l&apos;envoyer vous-même ou de laisser Newbi prévenir le
              destinataire par e-mail — il télécharge sans créer de compte, sur
              ordinateur comme sur mobile.
            </p>
            <div className={VISUEL}>
              <VisuelPhoto
                className={PHOTO}
                src="/lp/transfers/studio-envoi.jpg"
                alt="Deux créatifs envoient leurs fichiers depuis un studio photo"
                cartes={[
                  {
                    icon: Mail,
                    titre: "Destinataire prévenu",
                    texte: "Par e-mail, en option",
                  },
                  {
                    icon: MonitorSmartphone,
                    titre: "Sans créer de compte",
                    texte: "Ordinateur ou mobile",
                  },
                ]}
              />
            </div>
          </article>

          <article className={`${CARD} md:col-span-4 min-h-[450px]`}>
            <h3 className={TITLE}>Chiffré de bout en bout</h3>
            <p className={TEXT}>
              Vos transferts circulent en HTTPS et sont stockés sur des serveurs
              situés en France, conformes au RGPD. Pour un dossier sensible,
              ajoutez un mot de passe : seules les personnes à qui vous le
              confiez pourront ouvrir le lien.
            </p>
            <div className={VISUEL}>
              <VisuelListe
                className={SHEET}
                titre="Réglages du transfert"
                lignes={[
                  "Transfert en HTTPS",
                  "Serveurs situés en France",
                  "Mot de passe, au choix",
                ]}
                chip="Conforme RGPD"
              />
            </div>
          </article>

          <article className={`${CARD} md:col-span-4 min-h-[450px]`}>
            <h3 className={TITLE}>Vous savez qui a téléchargé</h3>
            <p className={TEXT}>
              Chaque ouverture et chaque téléchargement est horodaté, et vous
              recevez une notification dès que votre client récupère ses
              fichiers. Plus besoin de relancer pour savoir si l&apos;envoi est
              bien arrivé.
            </p>
            <div className={VISUEL}>
              <VisuelFiche
                className={SHEET}
                titre="Collection_AW26.zip"
                lignes={[
                  { cle: "Lien ouvert", valeur: "14:02" },
                  { cle: "Téléchargement", valeur: "14:05" },
                  { cle: "Vous êtes prévenu", valeur: "14:05" },
                ]}
                chip="Chaque étape horodatée"
              />
            </div>
          </article>

          <article className={`${CARD} md:col-span-4 min-h-[450px]`}>
            <h3 className={TITLE}>Vos fichiers s&apos;effacent tout seuls</h3>
            <p className={TEXT}>
              Vous choisissez la durée de validité du lien, de 24 heures à 30
              jours. Passé ce délai, les fichiers sont supprimés automatiquement
              : rien ne traîne en ligne, et votre espace de stockage reste
              propre.
            </p>
            <div className={VISUEL}>
              <VisuelPhoto
                className={PHOTO}
                src="/lp/transfers/bureau-net.jpg"
                alt="Un bureau rangé, sans fichier qui traîne"
                cartes={[
                  {
                    icon: Timer,
                    titre: "De 24 h à 30 jours",
                    texte: "Vous choisissez",
                  },
                  {
                    icon: ShieldCheck,
                    titre: "Suppression auto",
                    texte: "Le délai passé",
                  },
                ]}
              />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
