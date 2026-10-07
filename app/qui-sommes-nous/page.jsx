import React from "react";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import Footer7 from "@/src/components/footer7";
import { HeroSection } from "./section/hero-section";
import { OurStorySection } from "./section/OurStorySection";
import { ValuesSection } from "./section/ValuesSection";
import { PressSection } from "./section/PressSection";
import LpFinalCta from "@/app/lp/_components/LpFinalCta";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata = {
  title: "Qui sommes-nous | newbi - Solution de gestion financière",
  description:
    "Découvrez l'équipe newbi et notre mission : simplifier la gestion financière des entrepreneurs et PME avec des outils intuitifs et performants.",
  openGraph: {
    title: "Qui sommes-nous | newbi",
    description:
      "Découvrez l'équipe newbi et notre mission de simplifier la gestion financière.",
    type: "website",
    locale: "fr_FR",
  },
};

export default function QuiSommesNousPage() {
  return (
    <>
      <div className={`${poppins.variable} font-poppins`}>
        <NewHeroNavbar hasBanner={false} />
        <main>
          <HeroSection />
          <OurStorySection />
          <ValuesSection />
          <PressSection />
          {/* Même bannière de fin que sur les LP produits */}
          <LpFinalCta
            title={
              <>
                Reprenez la main
                <br className="hidden md:block" /> sur votre administratif
              </>
            }
            subtitle="Crée ton compte et envoie ta première facture aujourd'hui. 30 jours pour tester, sans carte bancaire."
            image="/lp/facturation-electronique/cta-laptop.jpg"
            imageAlt="Un indépendant gère ses factures dans Newbi sur son ordinateur portable"
            maxWidth="max-w-7xl"
            className="pt-10 md:pt-20 lg:pt-22"
          />
        </main>
        <Footer7 />
      </div>
    </>
  );
}
