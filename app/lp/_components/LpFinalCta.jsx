import LpCtaButton from "./LpCtaButton";

// Dernier bloc avant le footer : rappel de la promesse + CTA.
export default function LpFinalCta({ title, subtitle }) {
  return (
    <section className="px-5 pb-16 md:pb-24">
      <div className="max-w-6xl mx-auto rounded-3xl bg-gradient-to-br from-[#F0EEFF] via-[#F7F6FF] to-[#EDE9FF] px-6 py-14 md:py-20 text-center">
        <h2 className="text-3xl md:text-[2.5rem] font-medium tracking-[-0.015em] text-balance text-gray-950 mb-4">
          {title}
        </h2>
        <p className="text-gray-700 max-w-xl mx-auto mb-8">{subtitle}</p>
        <LpCtaButton className="w-full sm:w-auto" />
        <p className="mt-4 text-xs text-gray-500">
          Compte créé en 2 minutes · Aucun prélèvement à la fin de l'essai
        </p>
      </div>
    </section>
  );
}
