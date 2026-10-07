import React from "react";
import { Poppins } from "next/font/google";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import TrustedBySection from "@/app/(main)/new/lp-home/TrustedBySection";
import HomePricingSection from "@/app/(main)/new/lp-home/HomePricingSection";
import LpFinalCta from "@/app/lp/_components/LpFinalCta";
import LpTestimonials from "@/app/lp/_components/LpTestimonials";
import StatutHero from "./StatutHero";
import StatutBento from "./StatutBento";
import StatutDark from "./StatutDark";
import StatutFaq from "./StatutFaq";
import { SITE_URL } from "@/src/lib/site";
import { statutJsonLd } from "./statut-jsonld";
import { JsonLd } from "@/src/components/seo/json-ld";
import { BlogFurtherReading } from "@/src/components/blog/blog-further-reading";

// Même configuration de police que les LP produits.
const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

/* Gabarit unique des pages « Pour qui ». Chaque statut n'écrit qu'un fichier
   de contenu : l'enchaînement des sections, leurs styles et leur rythme
   vertical sont les mêmes partout, comme sur les LP produits. */
export function metadataStatut({ slug, titreSeo, description, motsCles }) {
  return {
    title: { absolute: titreSeo },
    description,
    keywords: motsCles,
    alternates: { canonical: `/${slug}` },
    openGraph: {
      title: titreSeo,
      description,
      url: `${SITE_URL}/${slug}`,
      siteName: "Newbi",
      type: "website",
      locale: "fr_FR",
      // Même visuel de partage que les pages produit (seo-data.js) : sans lui,
      // un partage sur LinkedIn ou WhatsApp sort sans image.
      images: [
        {
          url: "/images/op-newbi.png",
          width: 1200,
          height: 630,
          alt: titreSeo,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: titreSeo,
      description,
      images: ["/images/op-newbi.png"],
    },
  };
}

export default function StatutPage({ contenu }) {
  const { hero, bento, sombre, cta, faq, jsonLd } = contenu;

  return (
    <div className={`${poppins.variable} font-poppins`}>
      {/* Application + fil d'Ariane, rendus côté serveur comme sur les pages
          produit. La FAQ pose son propre bloc FAQPage. */}
      {jsonLd && <JsonLd data={statutJsonLd(jsonLd)} />}
      <NewHeroNavbar />
      {/* Même enchaînement que les LP produits : hero, preuve sociale, bento,
          bloc sombre, bannière, prix, avis, FAQ. */}
      <StatutHero {...hero} />
      <TrustedBySection variant="default" />
      <StatutBento {...bento} />
      <StatutDark {...sombre} />
      <LpFinalCta
        title={cta.titre}
        subtitle={cta.sousTitre}
        image="/lp/facturation-electronique/cta-laptop.jpg"
        imageAlt={cta.imageAlt}
        maxWidth="max-w-7xl"
        className="pt-10 md:pt-20 lg:pt-22 pb-0 md:pb-0"
      />
      <HomePricingSection
        maxWidth="max-w-7xl"
        className="pt-10 md:pt-20 lg:pt-22 pb-0"
      />
      <LpTestimonials
        maxWidth="max-w-7xl"
        className="mt-10 md:mt-20 lg:mt-22"
      />
      <StatutFaq {...faq} />
      {/* Trois articles du blog propres au statut : c'est le seul maillage
          interne contextuel de la page, le reste des liens vient du footer. */}
      {jsonLd && <BlogFurtherReading product={jsonLd.slug} />}
    </div>
  );
}
