"use client";

/**
 * Composant SEO moderne utilisant les métadonnées Next.js 13+
 * Alternative au composant SEOHead pour les pages qui utilisent le nouveau système de métadonnées
 */

/**
 * Génère les métadonnées pour Next.js 13+ App Router
 * @param {Object} seoData - Données SEO complètes
 * @returns {Object} - Objet metadata compatible Next.js 13+
 */
export function generateMetadata(seoData) {
  const {
    title,
    description,
    keywords,
    canonical,
    openGraph = {},
    twitter = {},
    robots = "index,follow",
    author = "Newbi",
    language = "fr-FR"
  } = seoData;

  const baseUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://newbi.fr";

  return {
    title,
    description,
    keywords: keywords?.split(", "),
    authors: [{ name: author }],
    robots,
    alternates: {
      canonical: canonical || `${baseUrl}${window?.location?.pathname || ""}`,
      languages: {
        "fr-FR": canonical || `${baseUrl}${window?.location?.pathname || ""}`,
      },
    },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      url: canonical || `${baseUrl}${window?.location?.pathname || ""}`,
      siteName: "Newbi - Solution de gestion pour entrepreneurs",
      title: openGraph.title || title,
      description: openGraph.description || description,
      images: [
        {
          url: openGraph.image || "https://pub-866a54f5560d449cb224411e60410621.r2.dev/Logo_Texte_Purple.png",
          width: openGraph.imageWidth || 1200,
          height: openGraph.imageHeight || 1200,
          alt: openGraph.title || title,
        },
      ],
      ...openGraph,
    },
    twitter: {
      card: "summary_large_image",
      site: "@newbi_fr",
      creator: "@newbi_fr",
      title: twitter.title || title,
      description: twitter.description || description,
      images: [twitter.image || "https://pub-866a54f5560d449cb224411e60410621.r2.dev/Logo_Texte_Purple.png"],
      ...twitter,
    },
    other: {
      "geo.region": "FR",
      "geo.country": "France",
      "language": language,
      "revisit-after": "7 days",
      "rating": "general",
    },
  };
}

/**
 * Composant pour injecter le JSON-LD dans le head
 * @param {Object|Array} jsonLd - Données JSON-LD
 */
export function JsonLd({ jsonLd }) {
  if (!jsonLd) return null;

  // Si c'est un tableau de JSON-LD, on les rend tous
  if (Array.isArray(jsonLd)) {
    return (
      <>
        {jsonLd.map((data, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(data),
            }}
          />
        ))}
      </>
    );
  }

  // Sinon, on rend un seul JSON-LD
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd),
      }}
    />
  );
}

/**
 * Composant pour les favicons et icônes
 */
export function Favicons() {
  return (
    <>
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />
      <meta name="theme-color" content="#5B4FFF" />
      <meta name="msapplication-TileColor" content="#5B4FFF" />
    </>
  );
}

/**
 * Composant pour les preconnects et optimisations de performance
 */
export function PerformanceOptimizations() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://api.newbi.fr" />
      <link rel="dns-prefetch" href="https://cdn.newbi.fr" />
    </>
  );
}

/**
 * Composant SEO complet pour Next.js 13+ avec App Router
 * À utiliser dans les layouts ou pages
 */
export function SEOProvider({ children, jsonLd }) {
  return (
    <>
      <Favicons />
      <PerformanceOptimizations />
      {jsonLd && <JsonLd jsonLd={jsonLd} />}
      {children}
    </>
  );
}
