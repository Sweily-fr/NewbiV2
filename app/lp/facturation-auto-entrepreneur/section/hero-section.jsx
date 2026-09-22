import Link from "next/link";
import LpCtaButton from "../../_components/LpCtaButton";
import { CTA_SUBLABEL } from "../../_components/lp-config";

// Hero de la LP auto-entrepreneur (copie de
// /lp/facturation-electronique/section/hero-section, sans le code hérité en
// commentaire) : H1 centré, sous-titre, CTA + bouton secondaire vers le
// simulateur « es-tu concerné ? », mockup iPad en dessous.
export default function HeroSection({
  title,
  subtitle,
  secondaryLabel = "Suis-je concerné en tant qu'auto-entrepreneur ?",
  secondaryHref = "#concerne",
}) {
  return (
    <section id="lp-hero" className="px-5 pt-14 md:pt-20 pb-10 md:pb-16">
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-balance font-medium text-4xl sm:text-5xl md:text-5xl lg:text-[3.5rem] leading-tight tracking-tight">
          {title}
        </h1>
        <h2 className="mt-4 lg:mt-6 text-base sm:text-lg font-normal tracking-tight text-gray-600 dark:text-gray-300 mb-6 lg:mb-8 max-w-xl mx-auto">
          {subtitle}
        </h2>
        <div className="flex flex-col items-center">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <LpCtaButton dark sublabel={null} className="w-full sm:w-auto" />
            <Link
              href={secondaryHref}
              className="inline-flex items-center justify-center w-full sm:w-auto rounded-xl px-8 py-3 text-base font-medium text-gray-900 bg-white border border-gray-300 hover:bg-gray-50 transition duration-200 active:scale-[0.98]"
            >
              {secondaryLabel}
            </Link>
          </div>
          <p className="text-gray-400 text-xs pt-3 text-center">
            {CTA_SUBLABEL}
          </p>
        </div>

        {/* Mockup iPad « Factures clients », centré sous les CTA. Sur mobile,
            l'image est agrandie et dépasse volontairement à droite (le layout
            LP est en overflow-x-clip, pas de scroll horizontal). */}
        <div className="relative mx-auto mt-10 md:mt-14 w-full max-w-6xl">
          <img
            src="/lp/facturation-electronique/hero-ipad-factures.png"
            alt="Interface Newbi sur iPad : factures d'auto-entrepreneur avec leurs statuts"
            width="2200"
            height="1268"
            className="w-[190%] max-w-none md:w-full md:max-w-full h-auto"
            loading="eager"
            fetchPriority="high"
          />
        </div>
      </div>
    </section>
  );
}
