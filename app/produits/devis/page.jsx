import React from "react";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import Footer7 from "@/src/components/footer7";
import { HeroSection } from "./section/hero-section";
import SectionAvantages from "./section/section-avantages";
import { Poppins } from "next/font/google";
import FAQ from "./section/faq";
import TestimonialsSection from "./section/testimonial";
import { generateNextMetadata } from "@/src/utils/seo-data";

// Configuration de Poppins uniquement pour les landing pages
const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

// Export des metadata pour le SEO
export const metadata = generateNextMetadata("devis");

export default function DevisPage() {
  return (
    <>
      <div className={`${poppins.variable} font-poppins`}>
        <NewHeroNavbar />
        <main>
          {/* Hero Section */}
          <HeroSection />
          <SectionAvantages />
          {/* <TestimonialsSection /> */}
          <FAQ />
          {/* <section className="min-h-screen py-20 flex flex-col justify-between">
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <h1 className="mt-8 max-w-8xl mx-auto text-balance font-semibold text-6xl md:text-7xl lg:mt-16 xl:text-[3.5rem]">
                  Des{" "}
                  <span className="bg-gradient-to-r from-[#5B4FFF] to-[#7A70FF] px-2 py-1 text-white rounded-md inline-block transform -rotate-1">
                    factures
                  </span>
                  <br />
                  professionnelles
                </h1>

                <p className="mx-auto mt-8 max-w-2xl text-balance text-md">
                  Automatisez et suivez facilement votre facturation. Créez,
                  envoyez et gérez vos factures en quelques clics avec notre
                  solution intuitive.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="rounded-xl px-5 bg-[#5B4FFF]"
                  >
                    <Link href="/dashboard/outils/factures">
                      <span>Créez votre facture</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-16">
            <div className="mx-auto max-w-6xl px-6 lg:px-12">
              <div className="flex flex-col items-center justify-center">
                <p className="text-md font-medium text-gray-600 mb-6">
                  +1.000 entreprises utilisent newbi pour gérer leurs factures
                </p>
                <LogoMarquee
                  logos={[
                    <div key="logo1" className="h-8 w-32 flex items-center">
                      <svg
                        viewBox="0 0 100 30"
                        className="h-full w-full text-gray-800"
                      >
                        <text
                          x="10"
                          y="20"
                          className="text-lg text-foreground font-bold"
                        >
                          Scaleway
                        </text>
                      </svg>
                    </div>,
                    <div key="logo2" className="h-8 w-32 flex items-center">
                      <svg
                        viewBox="0 0 100 30"
                        className="h-full w-full text-gray-800"
                      >
                        <text
                          x="10"
                          y="20"
                          className="text-lg text-foreground font-bold"
                        >
                          Meero
                        </text>
                      </svg>
                    </div>,
                    <div key="logo3" className="h-8 w-32 flex items-center">
                      <svg
                        viewBox="0 0 100 30"
                        className="h-full w-full text-gray-800"
                      >
                        <text
                          x="10"
                          y="20"
                          className="text-lg text-foreground font-bold"
                        >
                          Shapr
                        </text>
                      </svg>
                    </div>,
                    <div key="logo4" className="h-8 w-32 flex items-center">
                      <svg
                        viewBox="0 0 100 30"
                        className="h-full w-full text-gray-800"
                      >
                        <text
                          x="10"
                          y="20"
                          className="text-lg text-foreground font-bold"
                        >
                          Leena AI
                        </text>
                      </svg>
                    </div>,
                    <div key="logo5" className="h-8 w-32 flex items-center">
                      <svg
                        viewBox="0 0 100 30"
                        className="h-full w-full text-gray-800"
                      >
                        <text
                          x="10"
                          y="20"
                          className="text-lg text-foreground font-bold"
                        >
                          Eskimo
                        </text>
                      </svg>
                    </div>,
                    <div key="logo6" className="h-8 w-32 flex items-center">
                      <svg
                        viewBox="0 0 100 30"
                        className="h-full w-full text-gray-800"
                      >
                        <text
                          x="10"
                          y="20"
                          className="text-lg text-foreground font-bold"
                        >
                          Little Connect
                        </text>
                      </svg>
                    </div>,
                  ]}
                  speed={30}
                  pauseOnHover={true}
                />
              </div>
            </div>
          </div>
        </section> */}
          {/* <section>
          <AnimatedGroup
            variants={{
              container: {
                visible: {
                  transition: {
                    staggerChildren: 0.05,
                    delayChildren: 0.75,
                  },
                },
              },
              ...transitionVariants,
            }}
          >
            <div className="relative -mr-56 overflow-hidden px-2 sm:mr-0 sm:mt-12 md:mt-20">
              <div
                aria-hidden
                className="bg-gradient-to-b to-background absolute inset-0 z-10 from-transparent from-35%"
              />
              <div className="inset-shadow-2xs ring-background dark:inset-shadow-white/20 bg-background relative mx-auto max-w-6xl overflow-hidden rounded-2xl border p-4 shadow-lg shadow-zinc-950/15 ring-1">
                <img
                  className="bg-background aspect-15/8 relative hidden rounded-2xl dark:block"
                  src="https://tailark.com//_next/image?url=%2Fmail2.png&w=3840&q=75"
                  alt="app screen"
                  width="2700"
                  height="1440"
                />
                <img
                  className="z-2 border-border/25 aspect-15/8 relative rounded-2xl border dark:hidden"
                  src="https://tailark.com/_next/image?url=%2Fmail2-light.png&w=3840&q=75"
                  alt="app screen"
                  width="2700"
                  height="1440"
                />
              </div>
            </div>
          </AnimatedGroup>
        </section>

        <section className="py-20 flex flex-col justify-between bg-[#5B4FFF]">
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="flex flex-col gap-8">
              <div className="space-y-4 text-white">
                <h2 className="text-5xl font-semibold text-center">
                  Simplifiez votre facturation
                </h2>
                <p className="text-md text-center max-w-xl mx-auto">
                  Découvrez comment notre solution de facturation peut vous
                  faire gagner du temps et améliorer votre gestion financière.
                </p>
              </div>
              <BentoGrid>
                {features.map((feature) => (
                  <BentoCard
                    key={feature.name}
                    name={feature.name}
                    description={feature.description}
                    href={feature.href}
                    cta={feature.cta}
                    background={feature.background}
                    Icon={feature.Icon}
                    className={feature.className}
                  />
                ))}
              </BentoGrid>
              <div className="flex flex-col justify-center items-center mt-6 sm:flex-row gap-4">
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-xl px-5 text-base"
                >
                  <Link href="/dashboard/outils/factures">
                    <span className="text-nowrap">Essayer gratuitement</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="bg-[#5B4FFF]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 120"
            className="w-full h-auto"
          >
            <path
              fill="#ffffff"
              fillOpacity="1"
              d="M0,120 Q720,0 1440,120 L1440,120 L0,120 Z"
            ></path>
          </svg>
        </div>

        <section className="bg-white py-10">
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="flex flex-col items-center justify-center text-center space-y-8">
              <h2 className="text-4xl font-semibold">
                Ils nous font confiance
              </h2>
              <p className="text-md max-w-xl mx-auto text-gray-600">
                Rejoignez les milliers d'entreprises qui utilisent notre
                solution de facturation pour simplifier leur gestion financière.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mt-12">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-center h-24 bg-gray-50 rounded-lg"
                  >
                    <span className="text-xl font-medium text-gray-400">
                      Logo {i}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#222026] py-20 mx-20 rounded-2xl">
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="flex items-center justify-center text-center space-y-8">
              <div className="max-w-2xl">
                <h2 className="text-4xl font-bold text-white mb-6">
                  Vous n'avez toujours pas lancé votre première séquence ?
                </h2>
                <p className="text-lg text-gray-300 mb-8">
                  Il est temps d'y remédier.
                </p>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-xl px-8 py-3 font-medium"
                >
                  <Link href="/dashboard/outils/factures">
                    <span className="text-nowrap">Essayez gratuitement</span>
                  </Link>
                </Button>
              </div>
              <div className="flex min-h-[400px] w-full items-center justify-center py-20">
                <div className="w-full max-w-3xl">
                  <DisplayCards cards={defaultCards} />
                </div>
              </div>
            </div>
          </div>
        </section> */}
        </main>
        <Footer7 />
      </div>
    </>
  );
}
