/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@marsidev/react-turnstile"],
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

  // Redirections permanentes (301) pour les pages supprimées
  async redirects() {
    return [
      // Redirections des anciens articles de blog vers la page d'accueil
      {
        source: "/blog/envoyer-fichiers-contre-paiement",
        destination: "/",
        permanent: true,
      },
      {
        source: "/blog/meilleurs-outils-gratuits-gestion-entreprise",
        destination: "/",
        permanent: true,
      },
      {
        source: "/blog/compte-bancaire-particulier-ou-professionnel-freelance",
        destination: "/",
        permanent: true,
      },
      {
        source: "/blog/transferer-fichiers-graphistes-2025",
        destination: "/",
        permanent: true,
      },
      {
        source:
          "/blog/comparatif-outils-gestion-projet-clickup-monday-trello-newbi",
        destination: "/",
        permanent: true,
      },
      {
        source: "/blog/optimiser-referencement-google-article-seo",
        destination: "/",
        permanent: true,
      },
      {
        source: "/blog/alternative-gratuite-wetransfer-newbi",
        destination: "/",
        permanent: true,
      },
      {
        source: "/blog/apparaitre-premier-google-articles-optimises",
        destination: "/",
        permanent: true,
      },
      {
        source: "/blog/odoo-vs-newbi-comparatif",
        destination: "/",
        permanent: true,
      },
      {
        source: "/blog/gestion-agence-architecture-interieur",
        destination: "/",
        permanent: true,
      },
      {
        source: "/blog/calendrier-impots-2025-independants",
        destination: "/",
        permanent: true,
      },
      {
        source: "/blog/creer-factures-professionnelles-en-ligne",
        destination: "/",
        permanent: true,
      },
      {
        source: "/blog/importance-signature-mail-professionnelle",
        destination: "/",
        permanent: true,
      },
      {
        source: "/blog/facture-numerique-facturation-electronique-obligatoire",
        destination: "/",
        permanent: true,
      },
      {
        source: "/blog/creer-devis-professionnel-conversion",
        destination: "/",
        permanent: true,
      },
      {
        source: "/blog/modeles-factures-professionnelles-auto-entrepreneurs",
        destination: "/",
        permanent: true,
      },
      {
        source: "/blog/signature-mail-professionnelle-conversion",
        destination: "/",
        permanent: true,
      },
      {
        source: "/blog/generateur-mentions-legales-site-web",
        destination: "/",
        permanent: true,
      },
      {
        source: "/blog/outils-essentiels-gestion-entreprise",
        destination: "/",
        permanent: true,
      },
      {
        source: "/blog/devis-excel-limites-alternatives",
        destination: "/",
        permanent: true,
      },
      {
        source: "/blog/gestion-tresorerie-independant",
        destination: "/",
        permanent: true,
      },
      {
        source: "/blog/gestion-tresorerie-freelance",
        destination: "/",
        permanent: true,
      },
      {
        source: "/blog/modifier-code-ape-independant",
        destination: "/",
        permanent: true,
      },
      {
        source: "/blog/difference-devis-bon-commande",
        destination: "/",
        permanent: true,
      },
      {
        source: "/blog/temps-pour-faire-un-devis",
        destination: "/",
        permanent: true,
      },
      {
        source: "/blog/gestion-activite-independant",
        destination: "/",
        permanent: true,
      },
      {
        source: "/blog/clickup-vs-monday-comparatif",
        destination: "/",
        permanent: true,
      },
      {
        source: "/blog/cest-quoi-un-erp",
        destination: "/",
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
        destination: "/produits/devis",
        permanent: true,
      },
      {
        source: "/signatures-email",
        destination: "/produits/signatures",
        permanent: true,
      },

      // Redirections des anciens outils/générateurs
      {
        source: "/outils",
        destination: "/",
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
