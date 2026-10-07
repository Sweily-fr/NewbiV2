import React from "react";
import Link from "next/link";

// Comment on démarre, en trois étapes. Bloc sombre pleine largeur : titre à
// gauche, bouton de contour à droite, puis trois cartes dont le texte est en
// haut et la photo occupe le bas, façon Qonto.
const ETAPES = [
  {
    n: "1",
    title: "Photographiez le justificatif",
    text: "Un ticket de caisse au comptoir, une facture fournisseur reçue par mail : vous prenez la photo ou vous importez le PDF, depuis le téléphone comme depuis l'ordinateur.",
    img: "/lp/achats/etapes/photo.jpg",
    alt: "Une commerçante photographie un ticket de caisse avec son téléphone",
  },
  {
    n: "2",
    title: "Newbi lit, classe et rapproche",
    text: "Fournisseur, date, montant et TVA sont reconnus, la dépense rejoint sa catégorie et se colle à la transaction bancaire correspondante. Vous validez d'un clic.",
    img: "/lp/achats/etapes/classement.jpg",
    alt: "Une indépendante vérifie ses dépenses sur son ordinateur portable",
  },
  {
    n: "3",
    title: "Votre comptable récupère tout",
    text: "En fin de mois, l'export part au format FEC, CSV, Sage ou Cegid, justificatifs attachés — ou votre expert-comptable vient les chercher depuis son accès gratuit.",
    img: "/lp/achats/etapes/comptable.jpg",
    alt: "Un indépendant remet ses pièces comptables à son expert-comptable",
  },
];

export default function CommentCaMarcheSection() {
  return (
    <section className="pt-10 md:pt-20 lg:pt-22">
      <div className="bg-[#0B0B0C] px-5 py-14 md:py-20 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-10 md:mb-14">
            <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-balance">
              Vos achats rangés en trois gestes
            </h2>
            {/* Bouton de contour clair, comme sur la référence */}
            <Link
              href="/auth/signup"
              className="flex-none self-start md:self-auto rounded-xl border border-white/30 px-7 py-3.5 text-[15px] text-white transition-colors hover:bg-white/10"
            >
              Essayer 30 jours offerts
            </Link>
          </div>

          {/* Chaque carte a sa photo en fond, avec un voile dégradé depuis le
              haut pour garder le texte lisible. */}
          <ul className="grid gap-4 md:gap-6 md:grid-cols-3">
            {ETAPES.map((e) => (
              <li
                key={e.n}
                className="relative flex min-h-[460px] md:min-h-[520px] flex-col overflow-hidden rounded-3xl bg-white/[0.06]"
              >
                <img
                  src={e.img}
                  alt={e.alt}
                  className="absolute inset-0 size-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/15" />
                <div className="relative p-7 md:p-8">
                  <span className="inline-flex size-7 items-center justify-center rounded-full bg-white/15 text-[13px] font-medium text-white">
                    {e.n}
                  </span>
                  <h3 className="mt-4 text-xl md:text-2xl font-medium tracking-tight leading-snug">
                    {e.title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-white/80">
                    {e.text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
