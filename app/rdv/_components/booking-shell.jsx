import Image from "next/image";
import { cn } from "@/src/lib/utils";
import { readableTextColor, safeAccentColor } from "@/src/utils/booking";

/**
 * Variables CSS de la couleur d'accent : --rdv-accent (fond plein),
 * --rdv-on-accent (texte posé dessus), --rdv-accent-ink (texte sur fond
 * teinté : l'accent s'il est assez foncé, sinon l'encre).
 */
export function accentVariables(color) {
  const accent = safeAccentColor(color);
  const onAccent = readableTextColor(accent);
  return {
    "--rdv-accent": accent,
    "--rdv-on-accent": onAccent,
    "--rdv-accent-ink": onAccent === "#ffffff" ? accent : "#171717",
  };
}

/**
 * Cadre des pages publiques de rendez-vous, mobile d'abord et en thème
 * clair, dans l'esprit de /transfer : fond Newbi teinté de la couleur
 * d'accent de la page, carte blanche, « Propulsé par Newbi » en pied.
 * Intégré (?embed=1) : ni fond ni pied de page, fond transparent pour se
 * fondre dans le site qui l'accueille.
 */
export function BookingShell({
  embed = false,
  accentColor,
  children,
  className,
}) {
  const accent = safeAccentColor(accentColor);

  if (embed) {
    return (
      <div
        className={cn("min-h-full w-full bg-transparent p-2 sm:p-4", className)}
        style={accentVariables(accent)}
      >
        {/* Le body du site est blanc : transparent pour l'iframe */}
        <style>{"html,body{background:transparent!important}"}</style>
        {children}
      </div>
    );
  }

  return (
    <div
      className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-white"
      style={accentVariables(accent)}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#f4f3ff] via-white to-[#f4f3ff]" />
      <div
        className="pointer-events-none absolute -top-24 -right-24 -z-10 h-80 w-80 rounded-full opacity-[0.12] blur-3xl"
        style={{ backgroundColor: accent }}
      />
      <div
        className="pointer-events-none absolute -bottom-28 -left-20 -z-10 h-96 w-96 rounded-full opacity-[0.10] blur-3xl"
        style={{ backgroundColor: accent }}
      />
      <main
        className={cn(
          "mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-12",
          className,
        )}
      >
        {children}
      </main>
      <footer className="flex justify-center pb-6">
        <a
          href="https://www.newbi.fr/?utm_source=prise-de-rendez-vous"
          target="_blank"
          rel="noopener"
          className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-gray-500 transition-colors hover:text-gray-800"
        >
          Propulsé par
          <Image src="/newbiLetter.png" alt="Newbi" width={56} height={18} />
        </a>
      </footer>
    </div>
  );
}

/** Carte blanche des pages publiques. */
export function BookingCard({ className, children }) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-3xl border border-gray-200/70 bg-white shadow-md",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Photo de l'organisateur ou logo de l'organisation, sinon initiales. */
export function OrganizerAvatar({ src, name, accentColor, size = 56 }) {
  const accent = safeAccentColor(accentColor);
  const initials = String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

  if (src) {
    return (
      // Image d'un domaine quelconque (logo R2, photo de profil) : pas
      // d'optimisation Next, simple balise
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full border border-gray-200 bg-white object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full text-base font-medium text-white"
      style={{ width: size, height: size, backgroundColor: accent }}
    >
      {initials || "?"}
    </span>
  );
}

/** Page indisponible : même message quelle que soit la raison (404 uniforme). */
export function BookingUnavailable({ embed, title, text }) {
  return (
    <BookingShell embed={embed}>
      <div className="flex flex-1 items-center justify-center">
        <BookingCard className="max-w-md">
          <div className="px-6 py-10 text-center">
            <h1 className="text-xl font-medium text-gray-900">
              {title || "Page indisponible"}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              {text ||
                "Cette page de réservation n'existe pas ou n'accepte plus de rendez-vous."}
            </p>
          </div>
        </BookingCard>
      </div>
    </BookingShell>
  );
}
