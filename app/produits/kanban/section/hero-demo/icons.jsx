// Jeu d'icônes de la démo produit : même trait fin que l'app, dessinées
// à la main pour éviter d'embarquer une librairie dans le hero.
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const Mail = ({ size = 14, sw = 1.6 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    strokeWidth={sw}
    {...base}
  >
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

export const Gear = ({ size = 14, sw = 1.6 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    strokeWidth={sw}
    {...base}
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
  </svg>
);

export const Import = ({ size = 13, sw = 1.7 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    strokeWidth={sw}
    {...base}
  >
    <path d="M12 15V3m0 12-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </svg>
);

export const Export = ({ size = 13, sw = 1.7 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    strokeWidth={sw}
    {...base}
  >
    <path d="M12 3v12m0-12 4 4m-4-4L8 7M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </svg>
);

export const Plus = ({ size = 13, sw = 2 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    strokeWidth={sw}
    {...base}
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const Info = ({ size = 11, sw = 1.8 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    strokeWidth={sw}
    {...base}
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
);

export const Search = ({ size = 13, sw = 1.7 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    strokeWidth={sw}
    {...base}
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const Filter = ({ size = 13, sw = 1.7 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    strokeWidth={sw}
    {...base}
  >
    <path d="M4 6h16M7 12h10M10 18h4" />
  </svg>
);

export const Sort = ({ size = 10, sw = 1.7 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    strokeWidth={sw}
    {...base}
  >
    <path d="M8 5v14m0-14 3 3M8 5 5 8M16 19V5m0 14 3-3m-3 3-3-3" />
  </svg>
);

export const Clock = ({ size = 10, sw = 1.8 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    strokeWidth={sw}
    {...base}
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v4l2.5 2" />
  </svg>
);

export const Check = ({ size = 10, sw = 1.8 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    strokeWidth={sw}
    {...base}
  >
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12 2.5 2.5L16 9.5" />
  </svg>
);

export const Doc = ({ size = 10, sw = 1.8 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    strokeWidth={sw}
    {...base}
  >
    <path d="M6 3h9l5 5v13H6z" />
  </svg>
);

export const Warning = ({ size = 11, sw = 1.8 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    strokeWidth={sw}
    {...base}
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5M12 16h.01" />
  </svg>
);

export const Chevron = ({ size = 10, sw = 1.8 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    strokeWidth={sw}
    {...base}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const ChevronRight = ({ size = 11, sw = 1.8 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    strokeWidth={sw}
    {...base}
  >
    <path d="m9 6 6 6-6 6" />
  </svg>
);

export const Star = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#F5B301">
    <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
  </svg>
);

export const Share = ({ size = 13, sw = 1.7 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    strokeWidth={sw}
    {...base}
  >
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
  </svg>
);

export const Calendar = ({ size = 11, sw = 1.7 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    strokeWidth={sw}
    {...base}
  >
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);

export const Flag = ({ size = 10, sw = 1.8 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    strokeWidth={sw}
    {...base}
  >
    <path d="M5 21V4h9l1 2h5v9h-6l-1-2H5" />
  </svg>
);

export const Lines = ({ size = 11, sw = 1.7 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    strokeWidth={sw}
    {...base}
  >
    <path d="M4 7h16M4 12h11M4 17h7" />
  </svg>
);

export const People = ({ size = 11, sw = 1.7 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    strokeWidth={sw}
    {...base}
  >
    <circle cx="9" cy="8" r="3" />
    <path d="M3 20a6 6 0 0 1 12 0M16 11a3 3 0 0 0 0-6" />
  </svg>
);
