"use client";
import React from "react";
import { useSession } from "@/src/lib/auth-client";
import { Heart } from "lucide-react";

// Logos officiels des réseaux sociaux (SVG servis depuis /public/social/*.svg).
// Ces glyphs sont les logos officiels fournis par les plateformes elles-mêmes,
// et non des icônes de librairie — plus reconnaissables par les utilisateurs
// qu'un pictogramme générique. Rendus via <img> pour préserver leur design
// natif (couleurs officielles, formes exactes).
const SOCIAL_ICON_CLASS = "size-6 object-contain";
import { Button } from "@/src/components/ui/button";
import { getAssetUrl } from "@/src/lib/image-utils";
import Link from "next/link";
// import { useCookieConsent } from "@/src/hooks/useCookieConsent";

const defaultSections = [
  {
    title: "Produits",
    links: [
      { name: "Facturation", href: "#" },
      { name: "Devis", href: "#" },
      { name: "Signature Email", href: "#" },
      { name: "Optimisation Blog SEO", href: "#" },
      { name: "Tous nos outils", href: "#" },
    ],
  },
  {
    title: "Ressources",
    links: [
      // { name: "Blog", href: "#" },
      { name: "FAQ", href: "#" },
      { name: "Tarifs", href: "/#pricing" },
      { name: "Communauté", href: "#" },
    ],
  },
  {
    title: "Légal",
    links: [
      { name: "Conditions d'utilisation", href: "#" },
      { name: "Politique de confidentialité", href: "#" },
      { name: "CGV", href: "#" },
      { name: "Cookies", href: "#" },
    ],
  },
];

// Réseaux sociaux par défaut — non utilisés dans le rendu actuel (les vraies
// icônes sont rendues inline dans la colonne brand du footer avec les URLs
// officielles Newbi). Gardé exporté pour compat si un consommateur override
// la prop socialLinks. Retiré Facebook + Twitter car aucun compte officiel.
const defaultSocialLinks = [
  {
    icon: (
      <img src="/social/instagram.svg" alt="" className={SOCIAL_ICON_CLASS} />
    ),
    href: "https://www.instagram.com/newbi_fr",
    label: "Instagram",
  },
  {
    icon: <img src="/social/tiktok.svg" alt="" className={SOCIAL_ICON_CLASS} />,
    href: "https://www.tiktok.com/@newbi.fr",
    label: "TikTok",
  },
  {
    icon: (
      <img src="/social/linkedin.svg" alt="" className={SOCIAL_ICON_CLASS} />
    ),
    href: "https://fr.linkedin.com/company/newbi-france",
    label: "LinkedIn",
  },
  {
    icon: (
      <img src="/social/youtube.svg" alt="" className={SOCIAL_ICON_CLASS} />
    ),
    href: "https://www.youtube.com/@Newbi_fr",
    label: "YouTube",
  },
];

const defaultLegalLinks = [
  { name: "Conditions d'utilisation", href: "#" },
  { name: "Politique de confidentialité", href: "#" },
];

const Footer7 = ({
  logo = {
    url: "https://www.shadcnblocks.com",
    src: getAssetUrl("newbiLogo.png"),
    alt: "logo",
    title: "",
  },
  sections = defaultSections,
  description = "Simplifiez votre gestion d'entreprise avec nos outils innovants.",
  socialLinks = defaultSocialLinks,
  copyright = "Conçu avec ❤️ en France par Sweily",
  legalLinks = defaultLegalLinks,
}) => {
  const { data: session } = useSession();
  // const { openCookieSettings } = useCookieConsent();

  // Helper function to get the appropriate link based on authentication
  const getToolLink = (toolPath) => {
    return session?.user ? `/dashboard/outils/${toolPath}` : "/auth/login";
  };

  return (
    <div className="px-2 py-2 lg:px-2 bg-[#5A50FF]/10">
      <div className="mx-auto w-full lg:px-8 rounded-[15px] md:rounded-[18px] lg:rounded-[18px] bg-white/50">
        <div className="relative pt-12 pb-12 md:pt-20 md:pb-16 text-center sm:py-24 px-4 md:px-0">
          <hgroup>
            {/* <h2 className="font-mono text-xs/5 font-medium tracking-widest text-gray-500 uppercase">
              Commencez gratuitement aujourd'hui
            </h2> */}
            <p className="mt-4 md:mt-6 text-xl md:text-2xl lg:text-4xl font-normal tracking-tight text-gray-950">
              Vous aussi, gagnez du temps sur vos achats
              <br className="hidden md:block" />
              <span className="md:hidden"> </span>Commencez gratuitement
              aujourd'hui.
            </p>
          </hgroup>
          <p className="mx-auto mt-4 md:mt-6 max-w-sm text-sm/6 text-gray-500">
            Commencez à gagner plus rapidement avec newbi.
          </p>
          <div className="mt-4 md:mt-6 flex justify-center">
            <Link
              href="/auth/signup"
              className="inline-block rounded-xl px-8 py-3 text-center text-base font-normal transition duration-150 active:scale-[0.98] bg-[#202020] text-white dark:bg-white dark:text-black hover:bg-gray-800"
            >
              Démarrer gratuitement
            </Link>
          </div>
        </div>
        <div className="pb-6">
          <div className="group/row relative isolate pt-[calc(--spacing(2)+1px)] last:pb-[calc(--spacing(2)+1px)]">
            <div
              aria-hidden="true"
              className="absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2"
            >
              <div className="absolute inset-x-0 top-0 border-t border-black/5"></div>
              <div className="absolute inset-x-0 top-2 border-t border-black/5"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 sm:gap-y-8 md:gap-y-10 pt-4 md:pt-6 pb-4 md:pb-6 lg:grid-cols-6 lg:gap-8 px-4 md:px-0">
              <div className="col-span-1 sm:col-span-2 md:col-span-2 flex flex-col items-center md:items-start mb-6 sm:mb-4 md:mb-0">
                <div className="lg:pb-6 group/item relative">
                  <img
                    src="/newbiLetter.png"
                    alt="Logo newbi"
                    width="100"
                    height="40"
                    className="object-contain"
                  />
                </div>
                {/* Réseaux sociaux — sous le logo dans la colonne brand du
                    footer. Comptes officiels Newbi confirmés (schema.org
                    sameAs sur newbi.fr + comptes fournis par le user). */}
                <div className="flex items-center gap-5 mt-3">
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Suivez Newbi sur Instagram"
                    className="opacity-90 hover:opacity-100 transition-opacity duration-200 p-1"
                    href="https://www.instagram.com/newbi_fr"
                  >
                    <img
                      src="/social/instagram.svg"
                      alt=""
                      className={SOCIAL_ICON_CLASS}
                    />
                  </a>
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Suivez Newbi sur TikTok"
                    className="opacity-90 hover:opacity-100 transition-opacity duration-200 p-1"
                    href="https://www.tiktok.com/@newbi.fr"
                  >
                    <img
                      src="/social/tiktok.svg"
                      alt=""
                      className={SOCIAL_ICON_CLASS}
                    />
                  </a>
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Suivez Newbi sur LinkedIn"
                    className="opacity-90 hover:opacity-100 transition-opacity duration-200 p-1"
                    href="https://fr.linkedin.com/company/newbi-france"
                  >
                    <img
                      src="/social/linkedin.svg"
                      alt=""
                      className={SOCIAL_ICON_CLASS}
                    />
                  </a>
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Suivez Newbi sur YouTube"
                    className="opacity-90 hover:opacity-100 transition-opacity duration-200 p-1"
                    href="https://www.youtube.com/@Newbi_fr"
                  >
                    <img
                      src="/social/youtube.svg"
                      alt=""
                      className={SOCIAL_ICON_CLASS}
                    />
                  </a>
                </div>
                {/* Lien Trustpilot — sous la row des réseaux sociaux dans la
                    colonne brand. Simple lien externe (aucun cookie déposé)
                    avec l'étoile officielle Trustpilot en vert #00B67A. Le
                    texte est en gris foncé #202020 (charte Newbi), seule
                    l'étoile porte l'accent vert Trustpilot. */}
                {/* Bloc d'évaluations et téléchargements — tous les liens
                    suivent le pattern "icône + texte" pour uniformité visuelle.
                    Le texte est en gris foncé #202020 (charte Newbi), l'accent
                    couleur est porté uniquement par l'icône. */}
                <div className="flex flex-col gap-5 mt-8">
                  <a
                    href="https://fr.trustpilot.com/review/newbi.fr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium leading-none text-[#202020] hover:text-gray-700 transition-colors"
                  >
                    <img
                      src="/social/trustpilot-star.svg"
                      alt=""
                      className="size-5 object-contain shrink-0"
                    />
                    <span>Évaluez-nous sur Trustpilot</span>
                  </a>
                  <a
                    href="https://www.google.com/search?q=newbi+facturation+avis"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium leading-none text-[#202020] hover:text-gray-700 transition-colors"
                  >
                    <img
                      src="/social/google.svg"
                      alt=""
                      className="size-5 object-contain shrink-0"
                    />
                    <span>Évaluez-nous sur Google</span>
                  </a>
                  {/* Badges stores mobiles — URLs standard des stores :
                      fonctionneront dès que les apps seront publiques.
                      Aujourd'hui iOS en TestFlight, Android en Internal Test. */}
                  <a
                    href="https://apps.apple.com/app/id6772126520"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium leading-none text-[#202020] hover:text-gray-700 transition-colors"
                  >
                    <img
                      src="/social/app-store.svg"
                      alt=""
                      className="size-5 object-contain shrink-0 rounded-[5px]"
                    />
                    <span>Télécharger sur l'App Store</span>
                  </a>
                  <a
                    href="https://play.google.com/store/apps/details?id=fr.newbi.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium leading-none text-[#202020] hover:text-gray-700 transition-colors"
                  >
                    <img
                      src="/social/google-play.svg"
                      alt=""
                      className="size-5 object-contain shrink-0"
                    />
                    <span>Télécharger sur Google Play</span>
                  </a>
                </div>
              </div>
              <div className="col-span-1">
                <h3 className="text-sm/6 font-medium text-gray-700 mb-2 sm:mb-3 md:mb-6">
                  Produits
                </h3>
                <ul className="mt-2 sm:mt-3 md:mt-6 space-y-2 sm:space-y-3 md:space-y-4 text-sm/6">
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href={"/produits/factures"}
                    >
                      Facturation
                    </a>
                  </li>
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href={"/produits/devis"}
                    >
                      Devis
                    </a>
                  </li>
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href={"/produits/transfers"}
                    >
                      Transferts fichiers
                    </a>
                  </li>
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href={"/produits/kanban"}
                    >
                      Gestion de projet
                    </a>
                  </li>
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href={"/produits/signatures"}
                    >
                      Signatures de mail
                    </a>
                  </li>
                </ul>
              </div>
              <div className="col-span-1">
                <h3 className="text-sm/6 font-medium text-gray-700 mb-2 sm:mb-3 md:mb-6">
                  Ressources
                </h3>
                <ul className="mt-2 sm:mt-3 md:mt-6 space-y-2 sm:space-y-3 md:space-y-4 text-sm/6">
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href="https://docs.newbi.fr/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Devenez partenaire
                    </a>
                  </li>
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href="https://docs.newbi.fr/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Documentation
                    </a>
                  </li>
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href="/blog"
                    >
                      Blog
                    </a>
                  </li>
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href="/faq"
                    >
                      FAQ
                    </a>
                  </li>
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href="/#pricing"
                    >
                      Tarifs
                    </a>
                  </li>
                </ul>
              </div>
              <div className="col-span-1">
                <h3 className="text-sm/6 font-medium text-gray-700 mb-2 sm:mb-3 md:mb-6">
                  Support
                </h3>
                <ul className="mt-2 sm:mt-3 md:mt-6 space-y-2 sm:space-y-3 md:space-y-4 text-sm/6">
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href="/contact"
                    >
                      Contactez-nous
                    </a>
                  </li>
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href="https://chat.whatsapp.com/FGLms8EYhpv1o5rkrnIldL?mode=ems_copy_h_t"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Communauté
                    </a>
                  </li>
                </ul>
              </div>
              <div className="col-span-1">
                <h3 className="text-sm/6 font-medium text-gray-700 mb-2 sm:mb-3 md:mb-6">
                  Legal
                </h3>
                <ul className="mt-2 sm:mt-3 md:mt-6 space-y-2 sm:space-y-3 md:space-y-4 text-sm/6">
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href="/mentions-legales"
                    >
                      Mentions légales
                    </a>
                  </li>
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href="/politique-de-confidentialite"
                    >
                      Politique de confidentialité
                    </a>
                  </li>
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href="/cgv"
                    >
                      CGV
                    </a>
                  </li>
                  <li>
                    <a
                      className="font-regular text-gray-950 hover:text-gray-700"
                      href="/supprimer-compte"
                    >
                      Supprimer mon compte
                    </a>
                  </li>
                  {/* <li>
                    <button
                      className="font-regular text-gray-950 hover:text-gray-700 cursor-pointer"
                      onClick={openCookieSettings}
                    >
                      Cookies
                    </button>
                  </li> */}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 md:px-0 pt-4 pb-2">
          <Link
            href="/produits/facturation-electronique"
            className="inline-block"
          >
            <img
              src="/logo_Compatible_Facturation_electronique-footer.png"
              alt="Solution compatible Facturation électronique"
              className="h-16 w-auto object-contain rounded-lg"
            />
          </Link>
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between group/row relative isolate pt-[calc(--spacing(2)+1px)] last:pb-[calc(--spacing(2)+1px)] px-4 md:px-0 gap-4 sm:gap-0">
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2"
          >
            <div className="absolute inset-x-0 top-0 border-t border-black/5"></div>
            <div className="absolute inset-x-0 top-2 border-t border-black/5"></div>
          </div>
          <div className="text-center sm:text-left">
            <div className="py-2 sm:py-3 group/item relative">
              <div className="text-xs sm:text-sm/6 text-gray-950">
                <a
                  href="https://www.sweily.fr"
                  className="hover:text-gray-700 transition-colors"
                >
                  By Sweily
                </a>{" "}
                — Made with{" "}
                <Heart
                  size={14}
                  className="inline-block text-red-500 fill-red-500 mx-1"
                />{" "}
                in France • © 2026
              </div>
            </div>
          </div>
          {/* Anciennement : row de réseaux sociaux dupliquée en bas du footer.
              Retirée car les mêmes liens sont maintenant sous le logo Newbi
              (colonne brand). Éviter la duplication qui doublait le poids
              visuel de la même info. */}
        </div>
      </div>
    </div>
  );
};

export default Footer7;
