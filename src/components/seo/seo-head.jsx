"use client";

import Head from "next/head";
import { usePathname } from "next/navigation";

/**
 * Composant SEOHead réutilisable pour optimiser le référencement
 * @param {Object} props - Les propriétés SEO
 * @param {string} props.title - Titre de la page
 * @param {string} props.description - Description meta de la page
 * @param {string} props.keywords - Mots-clés séparés par des virgules
 * @param {string} props.canonical - URL canonique (optionnel)
 * @param {Object} props.openGraph - Données Open Graph pour les réseaux sociaux
 * @param {Object} props.twitter - Données Twitter Card
 * @param {Object} props.jsonLd - Données JSON-LD pour le référencement structuré
 * @param {string} props.robots - Instructions pour les robots (default: "index,follow")
 * @param {string} props.author - Auteur du contenu
 * @param {string} props.language - Langue du contenu (default: "fr-FR")
 */
export default function SEOHead({
  title,
  description,
  keywords,
  canonical,
  openGraph = {},
  twitter = {},
  jsonLd,
  robots = "index,follow",
  author = "Newbi",
  language = "fr-FR",
}) {
  const pathname = usePathname();
  const baseUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://newbi.fr";
  
  // Construction de l'URL canonique
  const canonicalUrl = canonical || `${baseUrl}${pathname}`;
  
  // Configuration Open Graph par défaut
  const defaultOpenGraph = {
    type: "website",
    locale: "fr_FR",
    url: canonicalUrl,
    siteName: "Newbi - Solution de gestion pour entrepreneurs",
    title: title,
    description: description,
    image: `${baseUrl}/NewbiLogo.svg`,
    imageWidth: 1200,
    imageHeight: 630,
    ...openGraph,
  };

  // Configuration Twitter Card par défaut
  const defaultTwitter = {
    card: "summary_large_image",
    site: "@newbi_fr",
    creator: "@newbi_fr",
    title: title,
    description: description,
    image: `${baseUrl}/NewbiLogo.svg`,
    ...twitter,
  };

  return (
    <Head>
      {/* Meta tags de base */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content={author} />
      <meta name="robots" content={robots} />
      <meta name="language" content={language} />
      
      {/* URL canonique */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Meta tags pour les langues */}
      <meta httpEquiv="content-language" content="fr" />
      <meta name="geo.region" content="FR" />
      <meta name="geo.country" content="France" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={defaultOpenGraph.type} />
      <meta property="og:locale" content={defaultOpenGraph.locale} />
      <meta property="og:url" content={defaultOpenGraph.url} />
      <meta property="og:site_name" content={defaultOpenGraph.siteName} />
      <meta property="og:title" content={defaultOpenGraph.title} />
      <meta property="og:description" content={defaultOpenGraph.description} />
      <meta property="og:image" content={defaultOpenGraph.image} />
      <meta property="og:image:width" content={defaultOpenGraph.imageWidth} />
      <meta property="og:image:height" content={defaultOpenGraph.imageHeight} />
      <meta property="og:image:alt" content={defaultOpenGraph.title} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content={defaultTwitter.card} />
      <meta name="twitter:site" content={defaultTwitter.site} />
      <meta name="twitter:creator" content={defaultTwitter.creator} />
      <meta name="twitter:title" content={defaultTwitter.title} />
      <meta name="twitter:description" content={defaultTwitter.description} />
      <meta name="twitter:image" content={defaultTwitter.image} />
      
      {/* Meta tags pour mobile */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="format-detection" content="telephone=no" />
      
      {/* Meta tags pour les moteurs de recherche */}
      <meta name="revisit-after" content="7 days" />
      <meta name="rating" content="general" />
      
      {/* Favicon et icônes */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      
      {/* JSON-LD pour le référencement structuré */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />
      )}
      
      {/* Preconnect pour améliorer les performances */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    </Head>
  );
}
