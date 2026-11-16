import { SOCIAL_LABELS } from "@/src/utils/email-campaign-design";

/**
 * Icônes du bloc « Réseaux sociaux », comme celles que l'API envoie
 * (newbi-api, render.js > socialIconSpecFor) : pastille ronde de la couleur
 * du réseau (sombre #1f2937 ou claire #9ca3af selon le style) et signe
 * blanc ; le site web est un globe au trait, de la couleur principale en
 * style « Couleur ». Vue 24 × 24.
 */

export const BRAND_COLORS = {
  facebook: "#0866FF",
  instagram: "#E4405F",
  linkedin: "#0A66C2",
  x: "#000000",
  tiktok: "#000000",
  youtube: "#FF0000",
};

const TONES = { dark: "#1f2937", light: "#9ca3af" };

const TIKTOK_NOTE =
  "M305.5,82.5c-28-18.2-44.8-49.2-44.9-82.5h-70.8l-0.1,283.8c-1.3,32.8-28.9,58.4-61.7,57.2S69.6,312,70.8,279.2 c1.2-32,27.5-57.2,59.5-57.2c6,0,11.9,0.9,17.6,2.8v-72.3c-5.8-0.8-11.7-1.2-17.6-1.3C58.5,151.2,0,209.7,0,281.5 c0,72,58.3,130.3,130.3,130.3s130.3-58.3,130.3-130.3V137.6c28.7,20.6,63.2,31.7,98.5,31.7V98.5C340.1,98.5,321.5,93,305.5,82.5z";

/** Signe blanc du réseau, centré dans la pastille (environ 58 %). */
function Glyph({ network }) {
  const fg = "#ffffff";
  switch (network) {
    case "facebook":
      return (
        <path
          d="M13.1 19v-6.1h2.05l.32-2.4H13.1V8.98c0-.69.2-1.17 1.2-1.17h1.27V5.68a16 16 0 0 0-1.83-.09c-1.8 0-3.04 1.1-3.04 3.13v1.78H8.67v2.4h2.03V19z"
          fill={fg}
        />
      );
    case "instagram":
      return (
        <>
          <rect
            x="6.6"
            y="6.6"
            width="10.8"
            height="10.8"
            rx="3.2"
            fill="none"
            stroke={fg}
            strokeWidth="1.6"
          />
          <circle
            cx="12"
            cy="12"
            r="2.6"
            fill="none"
            stroke={fg}
            strokeWidth="1.6"
          />
          <circle cx="15.3" cy="8.7" r="0.85" fill={fg} />
        </>
      );
    case "linkedin":
      return (
        <>
          <circle cx="8.6" cy="8.4" r="1.3" fill={fg} />
          <rect x="7.45" y="10.4" width="2.3" height="6.6" rx="0.3" fill={fg} />
          <path
            d="M11.4 10.4h2.2v.95c.34-.6 1.14-1.12 2.27-1.12 2.17 0 2.57 1.38 2.57 3.18V17h-2.25v-3.25c0-.78-.02-1.79-1.1-1.79s-1.39.85-1.39 1.73V17H11.4z"
            fill={fg}
          />
        </>
      );
    case "x":
      return (
        <path
          d="M7.4 7.2h3.05l2.2 3.1 2.65-3.1h1.55l-3.5 4.05L17.1 16.8h-3.05l-2.4-3.4-2.9 3.4H7.2l3.75-4.35z"
          fill={fg}
        />
      );
    case "tiktok":
      return (
        <path
          d={TIKTOK_NOTE}
          fill={fg}
          transform="translate(7.7 6.6) scale(0.0262)"
        />
      );
    case "youtube":
      return (
        <>
          <rect x="5.8" y="8" width="12.4" height="8.4" rx="2.4" fill={fg} />
          <path d="M10.9 10.3v3.8l3.2-1.9z" fill="var(--ec-yt-play)" />
        </>
      );
    default:
      return null;
  }
}

/** Couleur de l'icône selon le style (et la couleur principale pour le site). */
export function iconTone(network, iconStyle, primaryColor = "#5a50ff") {
  if (TONES[iconStyle]) return TONES[iconStyle];
  if (network === "website") return primaryColor;
  return BRAND_COLORS[network] || TONES.dark;
}

export function SocialIcon({
  network,
  iconStyle = "color",
  primaryColor,
  size = 32,
}) {
  const tone = iconTone(network, iconStyle, primaryColor);
  const label = SOCIAL_LABELS[network] || "Lien";
  if (network === "website") {
    // Globe au trait, sans pastille, comme l'icône « site web » de l'API
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        role="img"
        aria-label={label}
        fill="none"
        stroke={tone}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ display: "block" }}
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      // Triangle de YouTube : couleur de la pastille, pour qu'il se détache
      style={{ display: "block", "--ec-yt-play": tone }}
    >
      <circle cx="12" cy="12" r="12" fill={tone} />
      <Glyph network={network} />
    </svg>
  );
}
