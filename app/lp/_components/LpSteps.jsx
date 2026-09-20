import LpCtaButton from "./LpCtaButton";
import { CTA_SUBLABEL } from "./lp-config";

// Chronologie en 3 colonnes : titre centré, puis pour chaque étape une ligne
// en haut, un check + libellé, le moment en gros, et la description.
// Steps : { when, title?, desc, aside? } — `title` (optionnel) ouvre le
// paragraphe en gras. `variant` : "dark" (fond #202020, défaut) ou "light".
export default function LpSteps({
  title,
  intro,
  steps,
  ctaLabel = "Essayer gratuitement",
  variant = "dark",
}) {
  const dark = variant === "dark";
  return (
    <section
      className={`px-5 py-14 md:py-20 ${
        dark ? "bg-[#202020] text-white" : "bg-[#F5F5F7] text-gray-950"
      }`}
    >
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-12 md:mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-balance mb-5">
            {title}
          </h2>
          {intro && (
            <p
              className={`text-balance ${dark ? "text-white/70" : "text-gray-600"}`}
            >
              {intro}
            </p>
          )}
        </div>

        <ol className="grid md:grid-cols-3 gap-10 md:gap-8">
          {steps.map((step) => (
            <li
              key={step.when}
              className={`border-t-2 pt-6 ${dark ? "border-white" : "border-gray-950"}`}
            >
              {step.aside && (
                <p
                  className={`flex items-center gap-2 text-sm mb-4 ${
                    dark ? "text-white/80" : "text-gray-800"
                  }`}
                >
                  <span
                    className={`flex size-5 items-center justify-center rounded-full ${
                      dark
                        ? "bg-white text-[#202020]"
                        : "bg-gray-950 text-white"
                    }`}
                  >
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  {step.aside}
                </p>
              )}
              <h3 className="text-2xl md:text-[1.75rem] font-medium tracking-tight leading-tight mb-3">
                {step.when}
              </h3>
              <p
                className={`text-base leading-relaxed ${
                  dark ? "text-white/70" : "text-gray-700"
                }`}
              >
                {step.title && (
                  <>
                    <span
                      className={`font-medium ${dark ? "text-white" : "text-gray-950"}`}
                    >
                      {step.title}.
                    </span>{" "}
                  </>
                )}
                {step.desc}
              </p>
            </li>
          ))}
        </ol>

        <div className="flex flex-col items-center mt-14">
          <LpCtaButton
            label={ctaLabel}
            sublabel={null}
            dark={!dark}
            light={dark}
            className="w-full sm:w-auto"
          />
          <p
            className={`text-xs text-center pt-3 ${
              dark ? "text-white/60" : "text-gray-500"
            }`}
          >
            {CTA_SUBLABEL}
          </p>
        </div>
      </div>
    </section>
  );
}
