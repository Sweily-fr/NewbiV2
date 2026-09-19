import { Instrument_Serif } from "next/font/google";
import LpCtaButton from "./LpCtaButton";

// Même serif d'accent que le hero de la home, pour la cohérence de marque.
const accentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

// Hero de LP : surtitre, H1 (avec segment accentué optionnel), sous-titre,
// CTA unique, ligne de preuve, puis visuel. Le H1 doit reprendre le mot-clé
// de l'annonce (message match) : c'est la page qui le fournit.
export default function LpHero({
  eyebrow,
  title,
  accent,
  titleEnd = "",
  subtitle,
  proof,
  image,
  imageAlt,
  mobileImage,
  mobileImageAlt = "Application mobile Newbi",
  badge,
}) {
  return (
    <section id="lp-hero" className="px-5 pt-14 md:pt-20 pb-10 md:pb-16">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-10 lg:gap-8 items-center">
        <div className="lg:col-span-6 text-center lg:text-left">
          {eyebrow && (
            <p className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 mb-5">
              <span className="size-1.5 rounded-full bg-indigo-600" />
              {eyebrow}
            </p>
          )}
          <h1 className="text-[2rem] leading-[1.1] sm:text-5xl sm:leading-tight font-extrabold tracking-tight text-black mb-5 text-balance">
            {title}{" "}
            {accent && (
              <span
                className={`${accentSerif.className} italic font-normal text-indigo-600 text-[1.15em] leading-none`}
              >
                {accent}
              </span>
            )}
            {titleEnd}
          </h1>
          <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0">
            {subtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
            <LpCtaButton className="w-full sm:w-auto" />
            {badge}
          </div>
          {proof && (
            <p className="mt-6 text-xs sm:text-sm text-gray-600">{proof}</p>
          )}
        </div>
        <div className="lg:col-span-6">
          {/* Même composition que le hero de /produits/facturation-electronique
              (écran desktop + iPhone superposé en bas à gauche), mais avec les
              captures PNG haute définition : les SVG Factures_Desk/_mobile
              embarquent un JPEG compressé, flou sur écran Retina. */}
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
      </div>
    </section>
  );
}
