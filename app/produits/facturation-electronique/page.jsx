import React from "react";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import Footer7 from "@/src/components/footer7";
import { BlogFurtherReading } from "@/src/components/blog/blog-further-reading";
import { HeroSection } from "./section/hero-section";
import { Poppins } from "next/font/google";
import FAQ from "./section/faq";
import HomePricingSection from "@/app/(main)/new/lp-home/HomePricingSection";
import FacturationElectroniqueComponentsSection from "./section/FacturationElectroniqueComponentsSection";
import { FacturationBanner } from "@/app/produits/factures/section/FacturationBanner";
import EssentielSection from "./section/EssentielSection";
import LpSteps from "@/app/lp/_components/LpSteps";
import CeQueNewbiFaitSection from "./section/CeQueNewbiFaitSection";
import LpTestimonials from "@/app/lp/_components/LpTestimonials";
import LpFinalCta from "@/app/lp/_components/LpFinalCta";
import { JsonLd } from "@/src/components/seo/json-ld";
import { productJsonLd } from "@/src/lib/product-jsonld";

// Le calendrier de la réforme, repris dans la chronologie en trois colonnes
// (même composant que « Ta première facture électronique, ce matin »).
const DATES = [
  {
    aside: "À faire dès maintenant",
    when: "Dès aujourd'hui",
    title: "Choisissez votre plateforme agréée",
    desc: "C'est par elle que transiteront toutes vos factures. Newbi en est une : vous émettez et recevez au format électronique sans installer d'outil ni passer par un prestataire de plus.",
  },
  {
    aside: "1ʳᵉ échéance",
    when: "1ᵉʳ septembre 2026",
    title: "Vous devez pouvoir recevoir",
    desc: "Les factures de vos fournisseurs arriveront au format électronique, sur votre plateforme. Toutes les entreprises sont concernées à cette date, quelle que soit leur taille.",
  },
  {
    aside: "2ᵉ échéance",
    when: "1ᵉʳ septembre 2027",
    title: "Vous devez émettre",
    desc: "Vos factures clients partent au format électronique depuis votre plateforme. C'est l'échéance des TPE, des PME et des micro-entrepreneurs.",
  },
];

// Configuration de Poppins uniquement pour les landing pages
const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

// Export des metadata pour le SEO
export const metadata = {
  // `absolute` : le titre porte déjà la marque, sinon le layout racine
  // ajoute un second « | Newbi ».
  title: {
    absolute: "Facturation électronique 2026 : e-invoicing conforme | Newbi",
  },
  description:
    "Préparez-vous à la réforme de la facturation électronique 2026 avec newbi. Solution e-invoicing et e-reporting conforme, formats Factur-X, UBL, CII. Archivage légal 10 ans.",
  keywords:
    "facturation électronique, e-invoicing, e-reporting, réforme 2026, Factur-X, facture électronique, PPF, portail public facturation, conformité fiscale, archivage factures",
  openGraph: {
    title: "Facturation Électronique 2026 | newbi",
    description:
      "Anticipez l'obligation de facturation électronique. Solution conforme e-invoicing et e-reporting avec archivage légal.",
    type: "website",
    locale: "fr_FR",
  },
};

export default function FacturationElectroniquePage() {
  return (
    <>
      {/* Données structurées : application + fil d'Ariane, rendues côté serveur */}
      <JsonLd data={productJsonLd("facturation-electronique")} />
      <div className={`${poppins.variable} font-poppins`}>
        <FacturationBanner />
        <NewHeroNavbar hasBanner={true} />
        <main>
          {/* Hero Section */}
          <HeroSection />
          <EssentielSection />
          <LpSteps
            title="Les trois dates à retenir"
            intro="Rien à anticiper dans l'urgence : voilà ce que la réforme demande, et quand."
            steps={DATES}
            ctaLabel="Essayer 30 jours offerts"
            maxWidth="max-w-7xl"
            className="mt-10 md:mt-20 lg:mt-22"
          />
          <CeQueNewbiFaitSection />
          <HomePricingSection
            maxWidth="max-w-7xl"
            className="pt-10 md:pt-20 lg:pt-22 pb-0"
          />
          {/* Même bannière que sur les autres LP produits */}
          <LpFinalCta
            title={
              <>
                Passe à la facturation
                <br className="hidden md:block" /> électronique sans stress
              </>
            }
            subtitle="Crée ton compte, envoie ta première facture électronique aujourd'hui. Tu as 30 jours pour tester, sans carte bancaire."
            image="/lp/facturation-electronique/cta-laptop.jpg"
            imageAlt="Un indépendant consulte ses factures clients dans Newbi sur son ordinateur portable"
            maxWidth="max-w-7xl"
            className="pt-10 md:pt-20 lg:pt-22 pb-0 md:pb-0"
          />
          {/* Mêmes avis que les autres LP produits */}
          <LpTestimonials
            maxWidth="max-w-7xl"
            className="mt-10 md:mt-20 lg:mt-22"
          />
          {/* <FacturationElectroniqueComponentsSection /> */}
          <FAQ />
        </main>
        <BlogFurtherReading product="facturation-electronique" />
        <Footer7 />
      </div>
    </>
  );
}
