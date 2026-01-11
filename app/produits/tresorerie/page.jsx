import React from "react";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import Footer7 from "@/src/components/footer7";
import { HeroSection } from "./section/hero-section";
import { Poppins } from "next/font/google";
import FAQ from "./section/faq";
import { TresorerieBanner } from "./section/TresorerieBanner";
import TrustedBySection from "@/app/(main)/new/lp-home/TrustedBySection";
import TresorerieComponentsSection from "./section/TresorerieComponentsSection";
import TresorerieInfoBanner from "./section/TresorerieInfoBanner";

// Configuration de Poppins uniquement pour les landing pages
const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

// Export des metadata pour le SEO
export const metadata = {
  title: "Logiciel de Gestion de Trésorerie | Suivi Cash Flow PME | newbi",
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
      <div className={`${poppins.variable} font-poppins`}>
        {/* <TresorerieBanner /> */}
        <NewHeroNavbar hasBanner={false} />
        <main>
          {/* Hero Section */}
          <HeroSection />
          <TrustedBySection />
          <TresorerieComponentsSection />
          {/* <TresorerieInfoBanner /> */}
          <FAQ />
        </main>
        <Footer7 />
      </div>
    </>
  );
}
