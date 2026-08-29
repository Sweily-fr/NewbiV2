const isDev = process.env.NODE_ENV === "development";

// La barre de feedback Vercel (vercel.live) n'est injectée que sur les
// déploiements non-production : elle n'existait pas lors du balayage du
// 30/07/2026 fait sur la prod, d'où son blocage constaté sur staging.
const isVercelToolbar = process.env.VERCEL_ENV !== "production";

// Origine de l'API dérivée des variables d'environnement plutôt que codée en
// dur : staging pointe vers staging-api.newbi.fr et se faisait bloquer par une
// connect-src figée sur la prod (incident du 10/08/2026, toutes les requêtes
// GraphQL refusées). Les domaines de prod restent listés en dur comme filet de
// sécurité si la variable manque au moment du build.
const toOrigin = (value) => {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};
const apiOrigin = toOrigin(process.env.NEXT_PUBLIC_API_URL);
const apiOrigins = [
  ...new Set(
    [
      apiOrigin,
      // NEXT_PUBLIC_WS_URL peut manquer sur un environnement : on dérive aussi
      // l'origine WebSocket de l'API pour que les subscriptions passent quand
      // même (https://x → wss://x).
      apiOrigin && apiOrigin.replace(/^http/, "ws"),
      toOrigin(process.env.NEXT_PUBLIC_WS_URL),
      "https://api.newbi.fr",
      "wss://api.newbi.fr",
    ].filter(Boolean),
  ),
];

// CSP stricte en prod, Report-Only en dev (les violations restent visibles en
// console sans gêner le développement). Policy validée le 30/07/2026 par
// balayage Playwright : 16 pages publiques + 19 pages dashboard authentifiées,
// zéro violation résiduelle. Domaines tiers couverts : GTM + Meta Pixel
// (MarketingPixels.jsx), API GraphQL + WebSocket, buckets R2 (transferts de
// fichiers), Cloudinary, Turnstile. Les polices passent par next/font
// (auto-hébergées). frame-ancestors est omis : X-Frame-Options DENY couvre
// déjà le clickjacking. Si un flux casse en prod : repasser cspHeaderKey en
// Report-Only, redéployer, corriger la policy, rebasculer.
const cspHeaderKey = isDev
  ? "Content-Security-Policy-Report-Only"
  : "Content-Security-Policy";
const cspValue = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${isVercelToolbar ? " https://vercel.live" : ""} https://www.googletagmanager.com https://*.googletagmanager.com https://connect.facebook.net https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  `font-src 'self' data:${isVercelToolbar ? " https://vercel.live https://assets.vercel.com" : ""}`,
  // *.google-analytics.com : GA4 utilise des endpoints régionaux (region1.…).
  // *.r2.cloudflarestorage.com : URLs présignées d'upload des transferts de fichiers.
  // *.pusher.com : temps réel de la barre de feedback Vercel (non-production).
  `connect-src 'self'${isDev ? " http://localhost:* ws://localhost:*" : ""} ${apiOrigins.join(" ")}${isVercelToolbar ? " https://vercel.live https://*.pusher.com wss://*.pusher.com" : ""} https://*.r2.dev https://*.r2.cloudflarestorage.com https://api.cloudinary.com https://*.google-analytics.com https://*.googletagmanager.com https://www.facebook.com https://www.googleapis.com https://challenges.cloudflare.com`,
  // Les aperçus PDF des documents archivés (factures, avoirs, BC) et des
  // documents importés passent par le proxy same-origin /api/document-preview
  // ('self') : le cookie de session host-only ne part jamais vers api.newbi.fr
  // depuis une iframe (incident ERR_BLOCKED_BY_CSP puis ERR_BLOCKED_BY_RESPONSE
  // du 30/07/2026). blob: couvre les aperçus locaux de fichiers en cours
  // d'upload (factures d'achat) ; un blob URL est lié à notre origine.
  `frame-src 'self' blob:${isVercelToolbar ? " https://vercel.live" : ""} https://www.googletagmanager.com https://www.facebook.com https://challenges.cloudflare.com`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dossier de build isolable via NEXT_DIST_DIR. Deux processus Next qui
  // partagent le meme .next (dev + build, ou dev + serveur e2e) se marchent
  // dessus et provoquent des ENOENT sur .next/static/development/*.tmp.*
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: true,
  // Masque l'indicateur de mode dev de Next.js (le logo "N" en bas à gauche),
  // visible dans les aperçus PDF chargés en WebView. Cosmétique, dev uniquement.
  devIndicators: false,
  transpilePackages: ["@marsidev/react-turnstile", "apollo-upload-client"],
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },
  images: {
    unoptimized: process.env.NODE_ENV === "development",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  onDemandEntries: {
    maxInactiveAge: 60 * 1000, // 1 minute
    pagesBufferLength: 5,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  experimental: {
    // Transforme les imports "barrel" en imports directs pour les libs
    // ci-dessous (lucide-react, date-fns et recharts sont déjà couverts par
    // la liste par défaut de Next).
    optimizePackageImports: [
      "radix-ui",
      "react-aria-components",
      "@tanstack/react-table",
      "framer-motion",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
      "@dnd-kit/modifiers",
      "@dnd-kit/utilities",
      "@ark-ui/react",
      "@internationalized/date",
    ],
    // Conserve 30 s en cache client (Router Cache) le payload RSC des routes
    // dynamiques : un retour arrière ou une re-navigation rapide vers une
    // page déjà visitée ne refait plus l'aller-retour serveur.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },

  async headers() {
    return [
      {
        // Autoriser l'iframe same-origin pour la prévisualisation de fichiers
        source: "/api/shared-documents/preview-file/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=3600",
          },
        ],
      },
      {
        // Autoriser l'iframe same-origin pour l'aperçu des PDF archivés
        // (factures, devis, avoirs, BC) servis par le proxy document-preview
        source: "/api/document-preview/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
      {
        source:
          "/((?!api/shared-documents/preview-file|api/document-preview).*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: cspHeaderKey,
            value: cspValue,
          },
        ],
      },
    ];
  },

  // Redirections permanentes (301) pour les pages supprimées
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://eu-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
    ];
  },

  skipTrailingSlashRedirect: true,

  async redirects() {
    return [
      // Canonique : apex → www. Le cookie de session est host-only sur
      // www.newbi.fr ; sans cette redirection, un accès via newbi.fr
      // (lien, favori, email) paraît déconnecté.
      {
        source: "/:path*",
        has: [{ type: "host", value: "newbi.fr" }],
        destination: "https://www.newbi.fr/:path*",
        permanent: true,
      },
      // Anciens articles de blog : redirigés vers l'article équivalent (une
      // redirection vers l'accueil est traitée comme un soft-404 par Google)
      {
        source: "/blog/envoyer-fichiers-contre-paiement",
        destination: "/blog/transfert-fichiers-securise-professionnel",
        permanent: true,
      },
      {
        source: "/blog/meilleurs-outils-gratuits-gestion-entreprise",
        destination: "/blog/top-7-outils-gratuits-auto-entrepreneur",
        permanent: true,
      },
      {
        source: "/blog/compte-bancaire-particulier-ou-professionnel-freelance",
        destination: "/blog/connexion-bancaire-rapprochement-automatique",
        permanent: true,
      },
      {
        source: "/blog/transferer-fichiers-graphistes-2025",
        destination: "/blog/transfert-fichiers-securise-professionnel",
        permanent: true,
      },
      {
        source:
          "/blog/comparatif-outils-gestion-projet-clickup-monday-trello-newbi",
        destination: "/blog/top-outils-gestion-projet-freelance",
        permanent: true,
      },
      {
        source: "/blog/optimiser-referencement-google-article-seo",
        destination: "/blog",
        permanent: true,
      },
      {
        source: "/blog/alternative-gratuite-wetransfer-newbi",
        destination: "/blog/transfert-fichiers-securise-professionnel",
        permanent: true,
      },
      {
        source: "/blog/apparaitre-premier-google-articles-optimises",
        destination: "/blog",
        permanent: true,
      },
      {
        source: "/blog/odoo-vs-newbi-comparatif",
        destination: "/blog/dolibarr-vs-newbi-comparatif",
        permanent: true,
      },
      {
        source: "/blog/gestion-agence-architecture-interieur",
        destination: "/blog/gestion-projet-kanban-independant",
        permanent: true,
      },
      {
        source: "/blog/calendrier-impots-2025-independants",
        destination: "/blog/calendrier-fiscal-independant-2026",
        permanent: true,
      },
      {
        source: "/blog/creer-factures-professionnelles-en-ligne",
        destination: "/blog/facture-en-ligne-vs-excel",
        permanent: true,
      },
      {
        source: "/blog/importance-signature-mail-professionnelle",
        destination: "/blog/signature-mail-professionnelle-guide",
        permanent: true,
      },
      {
        source: "/blog/facture-numerique-facturation-electronique-obligatoire",
        destination: "/blog/facturation-electronique-obligatoire-2026",
        permanent: true,
      },
      {
        source: "/blog/creer-devis-professionnel-conversion",
        destination: "/blog/conseils-convertir-devis-facture",
        permanent: true,
      },
      {
        source: "/blog/modeles-factures-professionnelles-auto-entrepreneurs",
        destination: "/blog/comment-creer-facture-auto-entrepreneur",
        permanent: true,
      },
      {
        source: "/blog/signature-mail-professionnelle-conversion",
        destination: "/blog/conseils-ameliorer-signature-email",
        permanent: true,
      },
      {
        source: "/blog/generateur-mentions-legales-site-web",
        destination: "/blog/quest-ce-que-conditions-generales-vente",
        permanent: true,
      },
      {
        source: "/blog/outils-essentiels-gestion-entreprise",
        destination: "/blog/logiciel-gestion-tout-en-un-tpe",
        permanent: true,
      },
      {
        source: "/blog/devis-excel-limites-alternatives",
        destination: "/blog/alternatives-excel-gestion-entreprise",
        permanent: true,
      },
      {
        source: "/blog/gestion-tresorerie-independant",
        destination: "/blog/comment-gerer-tresorerie-entreprise",
        permanent: true,
      },
      {
        source: "/blog/gestion-tresorerie-freelance",
        destination: "/blog/comment-gerer-tresorerie-entreprise",
        permanent: true,
      },
      {
        source: "/blog/modifier-code-ape-independant",
        destination: "/blog/quest-ce-que-numero-siret-siren",
        permanent: true,
      },
      {
        source: "/blog/difference-devis-bon-commande",
        destination: "/blog/quest-ce-que-bon-commande",
        permanent: true,
      },
      {
        source: "/blog/temps-pour-faire-un-devis",
        destination: "/blog/comment-faire-devis-professionnel",
        permanent: true,
      },
      {
        source: "/blog/gestion-activite-independant",
        destination: "/blog/logiciel-gestion-tout-en-un-tpe",
        permanent: true,
      },
      {
        source: "/blog/clickup-vs-monday-comparatif",
        destination: "/blog/top-outils-gestion-projet-freelance",
        permanent: true,
      },
      {
        source: "/blog/cest-quoi-un-erp",
        destination: "/blog/logiciel-gestion-tout-en-un-tpe",
        permanent: true,
      },

      // Redirections des anciennes pages produits vers les nouvelles
      {
        source: "/factures",
        destination: "/produits/factures",
        permanent: true,
      },
      {
        source: "/devis",
        destination: "/produits/factures",
        permanent: true,
      },
      {
        source: "/signatures-email",
        destination: "/produits/signatures",
        permanent: true,
      },

      // Pages produits supprimées
      {
        source: "/produits/devis",
        destination: "/produits/factures",
        permanent: true,
      },
      {
        source: "/produits/transfer",
        destination: "/produits/transfers",
        permanent: true,
      },

      // Redirections des anciens outils/générateurs
      {
        source: "/outils",
        destination: "/produits/factures",
        permanent: true,
      },
      {
        source: "/generator-politique-confidentialite",
        destination: "/",
        permanent: true,
      },
      {
        source: "/generator-mentions-legales",
        destination: "/",
        permanent: true,
      },

      // Redirection de la page mot de passe oublié (si elle n'existe plus)
      {
        source: "/forgot-password",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
