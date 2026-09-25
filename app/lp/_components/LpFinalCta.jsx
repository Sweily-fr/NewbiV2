import LpCtaButton from "./LpCtaButton";

// Dernier bloc avant le footer : rappel de la promesse + CTA.
// Avec `image`, la carte devient une bannière photo pleine largeur (texte à
// gauche sur un voile sombre, bouton blanc) ; sinon, fond violet clair.
export default function LpFinalCta({
  title,
  subtitle,
  image,
  imageAlt = "",
  maxWidth = "max-w-6xl",
}) {
  if (image) {
    return (
      <section className="px-5 pt-6 md:pt-10 pb-16 md:pb-24">
        <div
          className={`relative ${maxWidth} mx-auto rounded-3xl overflow-hidden min-h-[420px] md:min-h-[520px] flex items-center`}
        >
          <img
            src={image}
            alt={imageAlt}
            className="absolute inset-0 size-full object-cover object-[60%_center]"
          />
          {/* Voile : vertical et plus dense sur mobile (texte au-dessus de l'écran),
              latéral sur desktop */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/60 to-black/30 md:bg-gradient-to-r md:from-black/80 md:via-black/45 md:to-transparent" />
          <div className="relative max-w-3xl px-7 py-12 md:px-12 md:py-16 text-white">
            <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight mb-5">
              {title}
            </h2>
            <p className="max-w-lg text-base md:text-lg text-white/85 leading-relaxed mb-8">
              {subtitle}
            </p>
            <LpCtaButton light sublabel={null} className="w-full sm:w-auto" />
            <p className="mt-3 text-xs text-white/60">
              30 jours offerts · sans carte bancaire · aucun prélèvement à la
              fin de l'essai
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-5 pb-16 md:pb-24">
      <div
        className={`${maxWidth} mx-auto rounded-3xl bg-gradient-to-br from-[#F0EEFF] via-[#F7F6FF] to-[#EDE9FF] px-6 py-14 md:py-20 text-center`}
      >
        <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-balance text-gray-950 mb-4">
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
