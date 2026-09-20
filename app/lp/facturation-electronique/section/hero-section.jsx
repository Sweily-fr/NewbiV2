// import { Instrument_Serif } from "next/font/google";
import Link from "next/link";
import LpCtaButton from "../../_components/LpCtaButton";
import { CTA_SUBLABEL } from "../../_components/lp-config";

// Même serif d'accent que le hero de la home, pour la cohérence de marque.
// const accentSerif = Instrument_Serif({
//   subsets: ["latin"],
//   weight: ["400"],
//   style: ["normal", "italic"],
//   display: "swap",
// });

// Hero dédié à la LP facturation électronique (copie de LpHero en cours de
// refonte UX). Seul le H1 est affiché pour l'instant, avec le même style que
// le H1 de /produits/facturation-electronique, centré. Le reste du contenu
// (surtitre, accent serif, sous-titre, CTA, preuve, visuels) est conservé en
// commentaire pour être réintroduit au fil de la refonte.
export default function HeroSection({
  // eyebrow,
  title,
  // accent,
  // titleEnd = "",
  subtitle,
  // proof,
  // image,
  // imageAlt,
  // mobileImage,
  // mobileImageAlt = "Application mobile Newbi",
  // badge,
}) {
  return (
    <section id="lp-hero" className="px-5 pt-14 md:pt-20 pb-10 md:pb-16">
      <div className="max-w-6xl mx-auto text-center">
        {/* {eyebrow && (
          <p className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 mb-5">
            <span className="size-1.5 rounded-full bg-indigo-600" />
            {eyebrow}
          </p>
        )} */}
        <h1 className="text-balance font-medium text-4xl sm:text-5xl md:text-5xl lg:text-[3.5rem] leading-tight tracking-tight">
          {title}
          {/* {" "}
          {accent && (
            <span
              className={`${accentSerif.className} italic font-normal text-indigo-600 text-[1.15em] leading-none`}
            >
              {accent}
            </span>
          )}
          {titleEnd} */}
        </h1>
        {/* Sous-titre : mêmes classes que le h2 de /produits/facturation-electronique,
            centré (max-w-xl plutôt que max-w-md, le texte est plus long) */}
        <h2 className="mt-4 lg:mt-6 text-base sm:text-lg font-normal tracking-tight text-gray-600 dark:text-gray-300 mb-6 lg:mb-8 max-w-xl mx-auto">
          {subtitle}
        </h2>
        {/* CTA noir, libellé seul ; la réassurance passe en dessous comme sur
            /produits/facturation-electronique */}
        <div className="flex flex-col items-center">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <LpCtaButton dark sublabel={null} className="w-full sm:w-auto" />
            {/* Bouton secondaire : ancre vers le simulateur « Es-tu concerné ? » */}
            <Link
              href="#concerne"
              className="inline-flex items-center justify-center w-full sm:w-auto rounded-xl px-8 py-3 text-base font-medium text-gray-900 bg-white border border-gray-300 hover:bg-gray-50 transition duration-200 active:scale-[0.98]"
            >
              Savoir si je suis concerné
            </Link>
          </div>
          <p className="text-gray-400 text-xs pt-3 text-center">
            {CTA_SUBLABEL}
          </p>
        </div>

        {/* Mockup iPad « Factures clients », centré sous les CTA */}
        <div className="relative mx-auto mt-10 md:mt-14 w-full max-w-6xl">
          <img
            src="/lp/facturation-electronique/hero-ipad-factures.png"
            alt="Interface Newbi sur iPad : liste des factures clients avec statuts"
            width="2200"
            height="1268"
            className="w-full h-auto"
            loading="eager"
            fetchPriority="high"
          />
        </div>
        {/* <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
          <LpCtaButton className="w-full sm:w-auto" />
          {badge}
        </div>
        {proof && (
          <p className="mt-6 text-xs sm:text-sm text-gray-600">{proof}</p>
        )} */}
      </div>

      {/* Visuels : écran desktop + iPhone superposé en bas à gauche, captures
          PNG haute définition (les SVG Factures_Desk/_mobile embarquent un
          JPEG compressé, flou sur écran Retina). */}
      {/* <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-10 lg:gap-8 items-center">
        <div className="lg:col-span-6">
          <div className="relative lg:pl-12 lg:pb-8">
            <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <img
                src={image}
                alt={imageAlt}
                className="w-full h-auto"
                loading="eager"
                fetchPriority="high"
              />
              <div
                className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to top, #FDFDFD 0%, rgba(253,253,253,0.8) 50%, transparent 100%)",
                }}
              />
            </div>
            {mobileImage && (
              <div className="absolute bottom-0 left-0 w-[150px] xl:w-[170px] z-10 hidden lg:block">
                <img
                  src={mobileImage}
                  alt={mobileImageAlt}
                  className="w-full h-auto"
                />
                <div
                  className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(to top, #FDFDFD 0%, #FDFDFD 30%, transparent 100%)",
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div> */}
    </section>
  );
}
