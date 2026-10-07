import React from "react";

// Bloc sombre de fin de parcours : à gauche la promesse et les trois étapes
// de l'inscription empilées, à droite la main qui tient le téléphone.
const STEPS = [
  {
    n: "Étape 1",
    title: "Créez votre compte avec votre e-mail",
  },
  {
    n: "Étape 2",
    title: "Ajoutez votre logo et vos coordonnées",
  },
  {
    n: "Étape 3",
    title: "Envoyez votre première facture",
  },
];

export function ReadyToInvoiceSection() {
  return (
    // Le bloc noir est plein cadre, mais l'espace qui le précède doit rester
    // blanc et suivre le rythme des autres sections de la page.
    <section className="pt-10 md:pt-20 lg:pt-22">
      <style>{`
        /* Trois créneaux de 2 s : la barre se remplit, la pastille se
           verrouille, l'étape suivante démarre. L'animation ne se joue
           qu'une fois et reste sur l'état final. */
        @keyframes stepBar0 {
          0%        { transform: scaleX(0) }
          25%, 100% { transform: scaleX(1) }
        }
        @keyframes stepBar1 {
          0%, 33%   { transform: scaleX(0) }
          58%, 100% { transform: scaleX(1) }
        }
        @keyframes stepBar2 {
          0%, 66%   { transform: scaleX(0) }
          91%, 100% { transform: scaleX(1) }
        }
        @keyframes stepCheck0 { 0%, 24% { opacity: 0 } 27%, 100% { opacity: 1 } }
        @keyframes stepCheck1 { 0%, 57% { opacity: 0 } 60%, 100% { opacity: 1 } }
        @keyframes stepCheck2 { 0%, 90% { opacity: 0 } 93%, 100% { opacity: 1 } }
        @media (prefers-reduced-motion: reduce) {
          [data-step] { animation: none !important; opacity: 1 !important; transform: none !important }
        }
      `}</style>

      <div
        data-nav-theme="dark"
        className="relative overflow-hidden bg-[#0B0B0C] px-5 py-16 md:py-32 text-white"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Colonne texte : le titre, puis les étapes les unes sous les autres */}
          <div>
            <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-balance">
              Prêt à facturer en quelques minutes
            </h2>

            <div className="mt-10 md:mt-14 space-y-7">
              {STEPS.map((step, i) => (
                <div key={step.n}>
                  {/* Rail de progression : la barre se remplit, puis la
                      pastille passe en blanc plein, et l'étape suivante
                      enchaîne. */}
                  <div className="h-px w-full overflow-hidden bg-white/20">
                    <span
                      data-step
                      className="block h-full origin-left bg-white"
                      style={{ animation: `stepBar${i} 6s linear forwards` }}
                    />
                  </div>

                  <p className="mt-5 flex items-center gap-2.5 text-[15px] text-white/80">
                    <span className="relative inline-grid size-5 shrink-0 place-items-center">
                      <svg className="absolute size-5" viewBox="0 0 24 24">
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          className="text-white/30"
                        />
                      </svg>
                      <svg
                        data-step
                        className="absolute size-5"
                        viewBox="0 0 24 24"
                        style={{
                          animation: `stepCheck${i} 6s linear forwards`,
                        }}
                      >
                        <circle cx="12" cy="12" r="10" fill="#fff" />
                        <path
                          d="M7.5 12.3 10.6 15.4 16.5 9"
                          stroke="#0B0B0C"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      </svg>
                    </span>
                    {step.n}
                  </p>
                  <p className="mt-3 text-xl md:text-2xl font-medium tracking-tight leading-snug">
                    {step.title}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Colonne visuel : la main est calée dans l'angle bas droit de la
              section — les marges négatives annulent le padding du bloc noir */}
          <div className="relative flex justify-center self-end -mb-16 md:-mb-24 lg:static lg:mb-0">
            {/* À partir de lg, l'image sort du flux et se colle dans l'angle
                bas droit du bloc noir, donc au bord de l'écran. */}
            <img
              src="/lp/factures/iphone-main.png"
              alt="Liste des factures clients dans Newbi sur mobile : montants, statuts et dates"
              className="h-auto w-full max-w-[440px] lg:absolute lg:-bottom-40 lg:right-0 lg:w-[680px] lg:max-w-none"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default ReadyToInvoiceSection;
