import { Instrument_Serif } from "next/font/google";
import LpCtaButton from "./LpCtaButton";

const accentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
  display: "swap",
});

// Chronologie concrète (« lundi / mercredi / vendredi » ou « jour 1 / 10 min
// plus tard / chaque mois ») plutôt qu'un « en 3 étapes » abstrait.
// Steps : { when, title, desc, aside? } — `aside` est une petite ligne de
// résultat affichée en bas de la carte (ex. « Devis signé en 2 min »).
export default function LpSteps({ title, intro, steps, ctaLabel }) {
  return (
    <section className="px-5 py-14 md:py-20 bg-[#202020] text-white">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mb-12 md:mb-16">
          <h2 className="text-3xl md:text-[2.5rem] font-medium tracking-[-0.015em] text-balance mb-4">
            {title}
          </h2>
          {intro && <p className="text-white/70 text-balance">{intro}</p>}
        </div>

        <ol className="relative grid md:grid-cols-3 gap-8 md:gap-6">
          {/* Ligne de temps (desktop) */}
          <div className="hidden md:block absolute top-3 left-0 right-0 h-px bg-white/15" />
          {steps.map((step) => (
            <li key={step.title} className="relative md:pt-10">
              <span className="hidden md:block absolute top-1.5 left-0 size-3 rounded-full bg-[#5A50FF] ring-4 ring-[#202020]" />
              <p
                className={`${accentSerif.className} italic text-2xl text-[#B9B3FF] mb-3`}
              >
                {step.when}
              </p>
              <h3 className="text-lg font-semibold leading-snug mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-white/70 leading-relaxed">
                {step.desc}
              </p>
              {step.aside && (
                <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white/80">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  {step.aside}
                </p>
              )}
            </li>
          ))}
        </ol>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-14">
          <LpCtaButton label={ctaLabel} className="w-full sm:w-auto" />
          <p className="text-sm text-white/60">
            Pas de paramétrage, pas de formation. Tu commences par ta première
            facture.
          </p>
        </div>
      </div>
    </section>
  );
}
