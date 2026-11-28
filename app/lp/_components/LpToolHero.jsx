import Link from "next/link";
import { Gift } from "lucide-react";
import LpCtaButton from "./LpCtaButton";

// Hero des LP outils (campagnes e-mail, prospection, rendez-vous) : même
// gabarit centré que /lp/facturation-electronique (H1, sous-titre, CTA noir
// + bouton secondaire), avec la pastille « 7 jours gratuits » au-dessus du
// titre et un visuel du produit en dessous. Depuis le 18/11/2026 la carte
// est demandée à l'inscription : on écrit « aucun prélèvement pendant
// l'essai », jamais « sans carte ».
export default function LpToolHero({
  eyebrow,
  title,
  subtitle,
  secondary,
  visual,
}) {
  return (
    <section id="lp-hero" className="px-5 pt-14 md:pt-20 pb-10 md:pb-16">
      <div className="max-w-6xl mx-auto text-center">
        {eyebrow && (
          <p className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-[13px] font-medium text-gray-700 mb-6">
            <span className="size-1.5 rounded-full bg-[#5A50FF]" />
            {eyebrow}
          </p>
        )}
        <h1 className="text-balance font-medium text-4xl sm:text-5xl lg:text-[3.5rem] leading-tight tracking-tight text-gray-950">
          {title}
        </h1>
        <p className="mt-4 lg:mt-6 text-base sm:text-lg tracking-tight text-gray-600 mb-6 lg:mb-8 max-w-xl mx-auto text-balance">
          {subtitle}
        </p>
        <div className="flex flex-col items-center">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <LpCtaButton
              dark
              label="Essayer 7 jours gratuits"
              sublabel={null}
              className="w-full sm:w-auto"
            />
            {secondary && (
              <Link
                href={secondary.href}
                className="inline-flex items-center justify-center w-full sm:w-auto rounded-xl px-8 py-3 text-base font-medium text-gray-900 bg-white border border-gray-300 hover:bg-gray-50 transition duration-200 active:scale-[0.98]"
              >
                {secondary.label}
              </Link>
            )}
          </div>
          <p className="mt-4 text-center text-[13px] text-gray-500 text-balance">
            <Gift
              size={14}
              strokeWidth={2}
              className="mr-1.5 inline-block align-[-2px] text-[#5A50FF]"
              aria-hidden="true"
            />
            <span>
              <strong className="font-medium text-gray-900">
                7 jours gratuits
              </strong>{" "}
              · aucun prélèvement pendant l&apos;essai · sans engagement
            </span>
          </p>
        </div>

        {visual && (
          <div className="relative mx-auto mt-10 md:mt-14 w-full max-w-5xl text-left">
            {visual}
          </div>
        )}
      </div>
    </section>
  );
}
