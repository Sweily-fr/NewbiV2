import React from "react";
import { Droplets, CreditCard, Timer } from "lucide-react";

/* Même disposition que « À tes côtés, dès la première facture » de la LP home,
   reprise sur les autres pages métier : tout est centré sous un grand titre,
   trois colonnes avec un pictogramme au trait dans une tuile de 64 px.

   Les trois réglages décrits existent bien sur le transfert de fichiers :
   `hasWatermark`, `isPaymentRequired` + `paymentAmount`, et le trio
   `expiryDate` / `passwordProtected` / `expiryReminderEnabled`. */
const ITEMS = [
  {
    title: "Le filigrane protège l'épreuve",
    desc: "Activez-le et vos images s'affichent marquées : le client voit la sélection, la commente, mais ne peut rien télécharger. De quoi faire valider un reportage sans livrer les originaux.",
    Icon: Droplets,
  },
  {
    title: "Le paiement avant le téléchargement",
    desc: "Fixez un montant sur le transfert : le lien ne libère les fichiers qu'une fois le règlement effectué. La livraison et l'encaissement cessent d'être deux sujets séparés.",
    Icon: CreditCard,
  },
  {
    title: "Un lien qui ne traîne pas",
    desc: "Date d'expiration — sept jours par défaut —, mot de passe au besoin, destinataire nommé et rappel avant échéance. Vos fichiers ne restent pas accessibles indéfiniment.",
    Icon: Timer,
  },
];

export default function LivraisonSection() {
  return (
    <section className="relative overflow-hidden px-5 py-14 md:py-20">
      <div className="mx-auto max-w-7xl text-center">
        <h2 className="mb-12 text-balance text-4xl font-medium leading-tight tracking-tight text-gray-950 md:mb-16 md:text-5xl lg:text-[3.5rem]">
          Livrez vos fichiers, pas votre travail gratuitement
        </h2>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-12">
          {ITEMS.map(({ title, desc, Icon }) => (
            <div key={title} className="flex flex-col items-center">
              <span className="mb-5 grid size-16 place-items-center rounded-2xl bg-[#F4F4F6] text-gray-900">
                <Icon size={32} strokeWidth={1.6} />
              </span>
              <h3 className="mb-3 text-xl font-medium tracking-tight text-gray-950 md:text-2xl">
                {title}
              </h3>
              <p className="text-[17px] leading-relaxed text-gray-600">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
