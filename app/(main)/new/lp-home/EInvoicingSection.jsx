"use client";
import React from "react";
import Link from "next/link";

const steps = [
  {
    num: "1",
    title: "Début 2026",
    desc: "Newbi intègre la facturation électronique. Vous pouvez dès maintenant préparer votre transition en douceur.",
  },
  {
    num: "2",
    title: "1er sept. 2026",
    desc: "Toutes les entreprises doivent être en mesure de recevoir des factures au format électronique. Vous êtes déjà prêt avec Newbi.",
  },
  {
    num: "3",
    title: "1er sept. 2027",
    desc: "L'émission de factures électroniques devient obligatoire pour tous. Newbi vous permet d'émettre et transmettre en un clic.",
  },
];

export default function EInvoicingSection({ maxWidth = "max-w-6xl" }) {
  return (
    <section className="pt-10 md:pt-20 lg:pt-22 relative overflow-hidden">
      <div className={`${maxWidth} px-4 mx-auto`}>
        {/* Bloc principal */}
        <div className="rounded-3xl bg-gradient-to-br from-[#F0EEFF] via-[#F7F6FF] to-[#EDE9FF] overflow-hidden">
          {/* Hero row */}
          <div className="flex flex-col md:flex-row md:items-center gap-8 md:gap-0">
            {/* Text */}
            <div className="flex-1 px-6 lg:px-12 py-10 md:py-16">
              <span className="inline-block text-xs font-semibold uppercase tracking-wider text-[#5A50FF] mb-3">
                Newbi sera prêt, et vous ?
              </span>

              <h2 className="text-3xl md:text-[2.5rem] font-medium tracking-[-0.015em] text-gray-950 mb-4">
                Facturation électronique
              </h2>

              <p className="text-base text-gray-700 max-w-xl mb-4 leading-relaxed">
                À partir du <strong>1er septembre 2026</strong>, la facturation
                électronique se met en place : toutes les entreprises devront{" "}
                <strong>pouvoir recevoir</strong> des factures électroniques, et
                l'<strong>émission</strong> se généralisera progressivement.
              </p>
              <p className="text-base text-gray-700 max-w-xl mb-8 leading-relaxed">
                Concrètement, vous passerez par une{" "}
                <strong>solution comptable</strong> (SC) pour facturer en
                conformité. Avec Newbi, vous serez accompagné pas à pas dans
                cette transition, pour être prêt et conforme le jour J.
              </p>

              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-base font-medium text-white bg-[#202020] hover:bg-[#333333] transition-colors"
              >
                Choisir Newbi comme SC
              </Link>
            </div>

            {/* Image composée */}
            <div className="hidden md:block flex-1 min-w-0 relative h-[500px]">
              {/* Screenshot principal - liste factures */}
              <div
                className="absolute top-16 -right-8 w-[110%] z-10"
                style={{
                  WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 50%, transparent 85%)",
                  maskImage: "linear-gradient(to bottom, black 0%, black 50%, transparent 85%)",
                }}
              >
                <img
                  src="/lp/factures/Factures_Desk.svg"
                  alt="Interface factures Newbi"
                  className="w-full h-auto rounded-2xl"
                />
              </div>

              {/* Badge flottant - Conforme */}
              <div className="absolute top-6 left-62 z-20 flex items-center gap-2 bg-white rounded-xl border border-neutral-200/60 shadow-lg px-2 py-1.5">
                <img
                  src="/logo_Compatible_Facturation_electronique-footer.png"
                  alt="Conforme Facturation électronique 2026"
                  className="h-20 w-auto object-contain"
                />
              </div>

            </div>
          </div>

          {/* Timeline */}
          <div className="px-6 lg:px-12 pt-10 md:pt-16 pb-10 md:pb-16">
            <h3 className="text-xl font-semibold text-gray-950 text-center mb-8">
              Le calendrier de la réforme : les dates à retenir
            </h3>

            <div className="flex flex-col md:flex-row gap-6">
              {steps.map((step, i) => (
                <div key={i} className="relative flex-1 flex flex-col items-center gap-4">
                  {/* Ligne connectrice */}
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-4 left-[calc(50%+2rem)] w-[calc(100%-3rem)] h-px bg-white" />
                  )}

                  {/* Numéro */}
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-sm font-bold text-gray-950">
                    {step.num}
                  </div>

                  {/* Card */}
                  <div className="flex grow flex-col rounded-3xl border border-neutral-200/60 bg-white/40 p-3 h-full w-full overflow-hidden">
                    <div className="flex grow flex-col overflow-hidden bg-white rounded-xl p-6 gap-2">
                      <h4 className="text-base font-bold text-gray-950 text-center">
                        {step.title}
                      </h4>
                      <p className="text-sm text-gray-600 text-center leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
