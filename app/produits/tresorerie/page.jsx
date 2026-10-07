import React from "react";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import Footer7 from "@/src/components/footer7";
import { BlogFurtherReading } from "@/src/components/blog/blog-further-reading";
import { HeroSection } from "./section/hero-section";
import { Poppins } from "next/font/google";
import FAQ from "./section/faq";
import { TresorerieBanner } from "./section/TresorerieBanner";
import TrustedBySection from "@/app/(main)/new/lp-home/TrustedBySection";
import TresorerieGovernanceSection from "./section/TresorerieGovernanceSection";
import LpFinalCta from "@/app/lp/_components/LpFinalCta";
import LpTestimonials from "@/app/lp/_components/LpTestimonials";
import HomePricingSection from "@/app/(main)/new/lp-home/HomePricingSection";
import BankSecuritySection from "./section/BankSecuritySection";
import TresorerieComponentsSection from "./section/TresorerieComponentsSection";
import TresorerieInfoBanner from "./section/TresorerieInfoBanner";
import { TestimonialsSplit } from "./section/TestimonialsSplit";
import TresorerieFeaturesBanner from "./section/TresorerieFeaturesBanner";
import { JsonLd } from "@/src/components/seo/json-ld";
import { productJsonLd } from "@/src/lib/product-jsonld";

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
    absolute: "Logiciel de gestion de trésorerie : suivi et prévisions | Newbi",
  },
  description:
    "Pilotez votre trésorerie en temps réel avec newbi. Synchronisation bancaire automatique, prévisions de cash flow, alertes personnalisées. Le logiciel de gestion de trésorerie pour PME et entrepreneurs.",
  keywords:
    "gestion trésorerie, logiciel trésorerie, cash flow, suivi trésorerie, prévision trésorerie, trésorerie PME, gestion financière, synchronisation bancaire, tableau de bord financier",
  openGraph: {
    title: "Logiciel de Gestion de Trésorerie | newbi",
    description:
      "Anticipez vos besoins de trésorerie et prenez les bonnes décisions financières. Synchronisation bancaire, prévisions et alertes en temps réel.",
    type: "website",
    locale: "fr_FR",
  },
};

export default function TresoreriePage() {
  return (
    <>
      {/* Données structurées : application + fil d'Ariane, rendues côté serveur */}
      <JsonLd data={productJsonLd("tresorerie")} />
      <div className={`${poppins.variable} font-poppins`}>
        {/* <TresorerieBanner /> */}
        <NewHeroNavbar hasBanner={false} />
        <main>
          {/* Hero Section */}
          <HeroSection />
          <TrustedBySection variant="default" />
          <TresorerieGovernanceSection />
          {/* Même bannière que sur /lp/facturation-electronique */}
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
          <BankSecuritySection />
          <HomePricingSection
            maxWidth="max-w-7xl"
            className="pt-10 md:pt-20 lg:pt-22 pb-0"
          />
          {/* Mêmes avis que la home, sur la largeur des autres sections ; la
              marge haute reprend le rythme vertical du reste de la page */}
          <LpTestimonials
            maxWidth="max-w-7xl"
            className="mt-10 md:mt-20 lg:mt-22"
          />
          {/* <TresorerieComponentsSection /> */}
          {/* <TresorerieFeaturesBanner /> */}
          {/* <TestimonialsSplit /> */}
          {/* <TresorerieInfoBanner /> */}
          <FAQ />
        </main>
        <BlogFurtherReading product="tresorerie" />
        <Footer7 />
      </div>
    </>
  );
}
