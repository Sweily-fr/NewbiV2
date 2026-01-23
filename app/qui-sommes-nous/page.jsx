import React from "react";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import Footer7 from "@/src/components/footer7";
import { HeroSection } from "./section/hero-section";
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
        </main>
        <Footer7 />
      </div>
    </>
  );
}
