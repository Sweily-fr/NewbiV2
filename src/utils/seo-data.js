/**
 * Configuration SEO centralisée pour toutes les pages du site
 * Contient les métadonnées, descriptions, mots-clés et données structurées
 */

const baseUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://newbi.fr";

// Configuration SEO par défaut
export const defaultSEO = {
  siteName: "Newbi - Solution de gestion pour entrepreneurs",
  author: "Newbi",
  language: "fr-FR",
  locale: "fr_FR",
  defaultImage: `${baseUrl}/NewbiV2/public/Logo + texte.svg`,
  favicon: `${baseUrl}/NewbiV2/public/newbi.svg`,
  themeColor: "#3B82F6",
  // Informations de contact et localisation
  contact: {
    email: "contact@newbi.fr",
    supportEmail: "contact@newbi.fr",
    country: "France",
    region: "Europe"
  },
  // Configuration des réseaux sociaux
  social: {
    instagram: "https://www.instagram.com/newbi_fr?igsh=dnVwZ3NndTU3bWw5"
  }
};

// Données SEO pour chaque page
export const seoData = {
  // Page d'accueil
  home: {
    title: "Newbi - Solution de gestion complète pour entrepreneurs et freelances",
    description: "Simplifiez votre gestion d'entreprise avec Newbi : facturation, devis, signatures de mail, kanban, transferts de fichiers, gestion de trésorerie. Essai gratuit de 14 jours sans engagement.",
    keywords: "gestion entreprise, facturation, devis, signature de mail, kanban, freelance, entrepreneur, comptabilité, CRM, logiciel gestion, auto-entrepreneur, TPE, PME",
    canonical: `${baseUrl}`,
    alternates: {
      canonical: `${baseUrl}`,
    },
    openGraph: {
      title: "Newbi - La solution tout-en-un pour entrepreneurs",
      description: "Gérez votre entreprise efficacement : facturation, devis, signatures, organisation. Plus de 200 entrepreneurs nous font confiance.",
      image: `${baseUrl}/NewbiV2/public/Logo + texte.svg`,
      type: "website",
      locale: "fr_FR",
      siteName: "Newbi",
    },
    twitter: {
      card: "summary_large_image",
      title: "Newbi - La solution tout-en-un pour entrepreneurs",
      description: "Gérez votre entreprise efficacement : facturation, devis, signatures, organisation.",
      image: `${baseUrl}/NewbiV2/public/Logo + texte.svg`,
    },
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Newbi",
      "url": baseUrl,
      "logo": `${baseUrl}/NewbiV2/public/Logo + texte.svg`,
      "description": "Solution de gestion complète pour entrepreneurs et freelances",
      "foundingDate": "2023",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "FR",
        "addressRegion": "France"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "email": "contact@newbi.fr",
        "contactType": "customer service",
        "availableLanguage": ["French", "fr"]
      },
      "sameAs": [
        "https://www.instagram.com/newbi_fr?igsh=dnVwZ3NndTU3bWw5"
      ],
      "offers": {
        "@type": "Offer",
        "description": "Essai gratuit de 14 jours",
        "price": "0",
        "priceCurrency": "EUR"
      },
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web Browser"
    }
  },

  // Page Factures
  factures: {
    title: "Logiciel de Facturation Professionnel - Newbi",
    description: "Créez, envoyez et gérez vos factures professionnelles en quelques clics. Suivi des paiements, relances automatiques et conformité légale garantie.",
    keywords: "logiciel facturation, facture professionnelle, gestion factures, suivi paiements, relance automatique, TVA, comptabilité, facturation en ligne, auto-entrepreneur",
    canonical: `${baseUrl}/produits/factures`,
    openGraph: {
      title: "Facturation Professionnelle Simplifiée - Newbi",
      description: "Automatisez votre facturation et suivez vos paiements. Interface intuitive, conformité légale et gain de temps garanti.",
      image: `${baseUrl}/NewbiV2/public/Logo + texte.svg`,
      type: "website",
      locale: "fr_FR",
    },
    twitter: {
      card: "summary_large_image",
      title: "Facturation Professionnelle Simplifiée - Newbi",
      description: "Automatisez votre facturation et suivez vos paiements.",
      image: `${baseUrl}/NewbiV2/public/Logo + texte.svg`,
    },
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Newbi Facturation",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "description": "Logiciel de facturation professionnel pour entrepreneurs et freelances",
      "url": `${baseUrl}/produits/factures`,
      "publisher": {
        "@type": "Organization",
        "name": "Newbi"
      },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EUR",
        "description": "Essai gratuit de 14 jours"
      },
      "featureList": [
        "Création de factures professionnelles",
        "Suivi des paiements",
        "Relances automatiques",
        "Conformité légale française",
        "Export comptable",
        "Gestion de la TVA",
        "Templates personnalisables"
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "150"
      }
    }
  },

  // Page Devis
  devis: {
    title: "Créateur de Devis Professionnel en Ligne - Newbi",
    description: "Créez des devis professionnels personnalisés en quelques minutes. Conversion automatique en facture, suivi client et taux de conversion optimisé.",
    keywords: "créateur devis, devis professionnel, estimation, proposition commerciale, conversion facture, suivi client, devis en ligne, auto-entrepreneur",
    canonical: `${baseUrl}/produits/devis`,
    openGraph: {
      title: "Devis Professionnels en Ligne - Newbi",
      description: "Impressionnez vos clients avec des devis professionnels. Conversion facile en facture et suivi des acceptations.",
      image: `${baseUrl}/NewbiV2/public/Logo + texte.svg`,
      type: "website",
      locale: "fr_FR",
    },
    twitter: {
      card: "summary_large_image",
      title: "Devis Professionnels en Ligne - Newbi",
      description: "Impressionnez vos clients avec des devis professionnels.",
      image: `${baseUrl}/NewbiV2/public/Logo + texte.svg`,
    },
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Newbi Devis",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "description": "Créateur de devis professionnel pour entrepreneurs",
      "url": `${baseUrl}/produits/devis`,
      "publisher": {
        "@type": "Organization",
        "name": "Newbi"
      },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EUR",
        "description": "Essai gratuit de 14 jours"
      },
      "featureList": [
        "Création de devis personnalisés",
        "Templates professionnels",
        "Conversion automatique en facture",
        "Suivi des acceptations",
        "Signature électronique intégrée",
        "Recherche d'entreprises françaises",
        "Calcul automatique de TVA"
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.7",
        "reviewCount": "120"
      }
    }
  },

  // Page Signatures
  signatures: {
    title: "Signature Électronique Professionnelle - Newbi",
    description: "Créez et gérez vos signatures électroniques professionnelles. Conformité légale, templates personnalisables et intégration email simplifiée. Outil gratuit.",
    keywords: "signature électronique, signature email, signature professionnelle, template signature, email professionnel, générateur signature, outil gratuit",
    canonical: `${baseUrl}/dashboard/outils/signatures-de-mail`,
    openGraph: {
      title: "Signatures Électroniques Professionnelles - Newbi",
      description: "Créez des signatures email professionnelles en quelques clics. Templates personnalisables et conformité garantie.",
      image: `${baseUrl}/NewbiV2/public/Logo + texte.svg`,
      type: "website",
      locale: "fr_FR",
    },
    twitter: {
      card: "summary_large_image",
      title: "Signatures Électroniques Professionnelles - Newbi",
      description: "Créez des signatures email professionnelles en quelques clics.",
      image: `${baseUrl}/NewbiV2/public/Logo + texte.svg`,
    },
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Newbi Signatures",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "description": "Générateur de signatures électroniques professionnelles",
      "url": `${baseUrl}/dashboard/outils/signatures-de-mail`,
      "publisher": {
        "@type": "Organization",
        "name": "Newbi"
      },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EUR",
        "description": "Outil entièrement gratuit"
      },
      "featureList": [
        "Création de signatures email",
        "Templates personnalisables",
        "Conformité légale",
        "Intégration facile",
        "Design responsive",
        "Export HTML/CSS",
        "Prévisualisation en temps réel"
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "200"
      }
    }
  },

  // Page Kanban
  kanban: {
    title: "Tableau Kanban - Gestion de Projets Agile - Newbi",
    description: "Organisez vos projets avec des tableaux Kanban intuitifs. Collaboration en équipe, suivi des tâches et productivité optimisée. Outil gratuit.",
    keywords: "kanban, gestion projet, organisation, productivité, collaboration équipe, suivi tâches, méthode agile, tableau kanban, outil gratuit",
    canonical: `${baseUrl}/dashboard/outils/kanban`,
    openGraph: {
      title: "Gestion de Projets Kanban - Newbi",
      description: "Boostez votre productivité avec nos tableaux Kanban. Organisation visuelle et collaboration simplifiée.",
      image: `${baseUrl}/NewbiV2/public/Logo + texte.svg`,
      type: "website",
      locale: "fr_FR",
    },
    twitter: {
      card: "summary_large_image",
      title: "Gestion de Projets Kanban - Newbi",
      description: "Boostez votre productivité avec nos tableaux Kanban.",
      image: `${baseUrl}/NewbiV2/public/Logo + texte.svg`,
    },
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Newbi Kanban",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "description": "Outil de gestion de projets avec tableaux Kanban",
      "url": `${baseUrl}/dashboard/outils/kanban`,
      "publisher": {
        "@type": "Organization",
        "name": "Newbi"
      },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EUR",
        "description": "Outil entièrement gratuit"
      },
      "featureList": [
        "Tableaux Kanban personnalisables",
        "Collaboration en temps réel",
        "Suivi des tâches",
        "Notifications automatiques",
        "Rapports de productivité",
        "Interface drag & drop",
        "Organisation par colonnes"
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.6",
        "reviewCount": "95"
      }
    }
  },

  // Page Transferts
  transfers: {
    title: "Transfert de Fichiers Sécurisé - Partage Professionnel - Newbi",
    description: "Partagez vos fichiers volumineux en toute sécurité. Transferts cryptés, liens temporaires et suivi des téléchargements pour professionnels.",
    keywords: "transfert fichiers, partage sécurisé, envoi gros fichiers, partage professionnel, cryptage, sécurité données, wetransfer alternatif",
    canonical: `${baseUrl}/dashboard/outils/transferts`,
    openGraph: {
      title: "Transfert de Fichiers Sécurisé - Newbi",
      description: "Partagez vos fichiers professionnels en toute sécurité. Cryptage avancé et contrôle total sur vos partages.",
      image: `${baseUrl}/NewbiV2/public/Logo + texte.svg`,
      type: "website",
      locale: "fr_FR",
    },
    twitter: {
      card: "summary_large_image",
      title: "Transfert de Fichiers Sécurisé - Newbi",
      description: "Partagez vos fichiers professionnels en toute sécurité.",
      image: `${baseUrl}/NewbiV2/public/Logo + texte.svg`,
    },
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Newbi Transferts",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "description": "Solution de transfert de fichiers sécurisé pour professionnels",
      "url": `${baseUrl}/dashboard/outils/transferts`,
      "publisher": {
        "@type": "Organization",
        "name": "Newbi"
      },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EUR",
        "description": "Essai gratuit de 14 jours"
      },
      "featureList": [
        "Transferts cryptés",
        "Liens temporaires",
        "Suivi des téléchargements",
        "Contrôle d'accès",
        "Notifications en temps réel",
        "Stockage cloud sécurisé",
        "Interface drag & drop"
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.5",
        "reviewCount": "80"
      }
    }
  },

  // Page Connexion
  login: {
    title: "Connexion - Accédez à votre espace Newbi",
    description: "Connectez-vous à votre compte Newbi pour accéder à tous vos outils de gestion d'entreprise : facturation, devis, signatures et plus.",
    keywords: "connexion newbi, login, espace client, compte utilisateur, authentification",
    robots: "noindex,nofollow",
    openGraph: {
      title: "Connexion à votre espace Newbi",
      description: "Accédez à votre tableau de bord et gérez votre entreprise efficacement.",
    }
  },

  // Page Inscription
  signup: {
    title: "Inscription Gratuite - Créez votre compte Newbi",
    description: "Créez votre compte Newbi gratuitement et accédez à tous nos outils de gestion d'entreprise. Essai gratuit sans engagement, activation immédiate.",
    keywords: "inscription newbi, créer compte, essai gratuit, registration, nouveau compte",
    openGraph: {
      title: "Créez votre compte Newbi gratuitement",
      description: "Rejoignez plus de 1000 entrepreneurs qui font confiance à Newbi. Inscription gratuite et activation immédiate.",
    },
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Inscription Newbi",
      "description": "Page d'inscription pour créer un compte Newbi gratuit",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EUR",
        "description": "Compte gratuit avec accès aux fonctionnalités de base"
      }
    }
  },

  // Page Mentions Légales
  mentionsLegales: {
    title: "Mentions Légales - Newbi",
    description: "Mentions légales, informations sur l'éditeur, hébergement et conditions d'utilisation de la plateforme Newbi.",
    keywords: "mentions légales, éditeur, hébergement, conditions utilisation, RGPD, données personnelles",
    robots: "index,nofollow",
    openGraph: {
      title: "Mentions Légales - Newbi",
      description: "Informations légales et réglementaires concernant l'utilisation de Newbi.",
    }
  },

  // Page Politique de Confidentialité
  politiqueConfidentialite: {
    title: "Politique de Confidentialité - Protection des Données - Newbi",
    description: "Notre politique de confidentialité détaille comment nous collectons, utilisons et protégeons vos données personnelles conformément au RGPD.",
    keywords: "politique confidentialité, protection données, RGPD, vie privée, cookies, données personnelles",
    robots: "index,nofollow",
    canonical: `${baseUrl}/politique-confidentialite`,
    openGraph: {
      title: "Politique de Confidentialité - Newbi",
      description: "Découvrez comment nous protégeons vos données personnelles et respectons votre vie privée.",
      type: "website",
      locale: "fr_FR",
    },
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Politique de Confidentialité",
      "description": "Politique de confidentialité et protection des données personnelles de Newbi",
      "url": `${baseUrl}/politique-confidentialite`
    }
  },

  // Page Tarifs
  pricing: {
    title: "Tarifs et Abonnements - Plans Newbi pour Entrepreneurs",
    description: "Découvrez nos tarifs transparents pour votre gestion d'entreprise. Essai gratuit de 14 jours, puis abonnement flexible. Fonctionnalités complètes incluses.",
    keywords: "tarifs newbi, prix abonnement, plan entrepreneur, facturation prix, devis tarif, essai gratuit, abonnement mensuel",
    canonical: `${baseUrl}/pricing`,
    openGraph: {
      title: "Tarifs Newbi - Plans pour Entrepreneurs",
      description: "Plans flexibles pour votre gestion d'entreprise. Essai gratuit de 14 jours inclus.",
      image: `${baseUrl}/NewbiV2/public/Logo + texte.svg`,
      type: "website",
      locale: "fr_FR",
    },
    twitter: {
      card: "summary_large_image",
      title: "Tarifs Newbi - Plans pour Entrepreneurs",
      description: "Plans flexibles pour votre gestion d'entreprise.",
      image: `${baseUrl}/NewbiV2/public/Logo + texte.svg`,
    },
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "Newbi - Solution de gestion d'entreprise",
      "description": "Solution complète de gestion pour entrepreneurs et freelances",
      "url": `${baseUrl}/pricing`,
      "brand": {
        "@type": "Brand",
        "name": "Newbi"
      },
      "offers": [
        {
          "@type": "Offer",
          "name": "Essai Gratuit",
          "price": "0",
          "priceCurrency": "EUR",
          "description": "Essai gratuit de 14 jours - Toutes fonctionnalités incluses",
          "availability": "https://schema.org/InStock"
        },
        {
          "@type": "Offer",
          "name": "Plan Professionnel",
          "price": "29",
          "priceCurrency": "EUR",
          "description": "Abonnement mensuel - Accès complet",
          "availability": "https://schema.org/InStock"
        }
      ]
    }
  },

  // Page Système de Parrainage
  referral: {
    title: "Programme de Parrainage Newbi - Gagnez 50€ par Filleul",
    description: "Parrainez vos contacts et gagnez 50€ pour chaque abonnement annuel souscrit. Programme de parrainage simple et rémunérateur pour entrepreneurs.",
    keywords: "parrainage newbi, gagner argent, recommandation, 50 euros, filleul, programme parrainage, commission",
    canonical: `${baseUrl}/parrainage`,
    openGraph: {
      title: "Programme de Parrainage Newbi - 50€ par Filleul",
      description: "Parrainez et gagnez 50€ pour chaque abonnement annuel souscrit par vos filleuls.",
      image: `${baseUrl}/NewbiV2/public/Logo + texte.svg`,
      type: "website",
      locale: "fr_FR",
    },
    twitter: {
      card: "summary_large_image",
      title: "Programme de Parrainage Newbi - 50€ par Filleul",
      description: "Parrainez et gagnez 50€ pour chaque abonnement annuel souscrit.",
      image: `${baseUrl}/NewbiV2/public/Logo + texte.svg`,
    },
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Programme de Parrainage Newbi",
      "description": "Programme de parrainage rémunérateur - 50€ par filleul",
      "url": `${baseUrl}/parrainage`,
      "offers": {
        "@type": "Offer",
        "description": "50€ de commission par filleul",
        "price": "50",
        "priceCurrency": "EUR"
      }
    }
  },

  // Page FAQ
  faq: {
    title: "FAQ - Questions Fréquentes sur Newbi",
    description: "Trouvez rapidement les réponses à vos questions sur Newbi : facturation, devis, signatures, tarifs, fonctionnalités. Support et aide complète.",
    keywords: "faq newbi, questions fréquentes, aide newbi, support client, guide utilisation, facturation aide, devis questions, tarifs newbi",
    canonical: `${baseUrl}/faq`,
    robots: "index,follow",
    openGraph: {
      title: "FAQ - Toutes vos questions sur Newbi",
      description: "Découvrez les réponses aux questions les plus fréquentes sur Newbi. Support complet et aide détaillée.",
      image: `${baseUrl}/NewbiV2/public/Logo + texte.svg`,
      type: "website",
      locale: "fr_FR",
    },
    twitter: {
      card: "summary_large_image",
      title: "FAQ - Toutes vos questions sur Newbi",
      description: "Découvrez les réponses aux questions les plus fréquentes sur Newbi.",
      image: `${baseUrl}/NewbiV2/public/Logo + texte.svg`,
    },
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "name": "FAQ Newbi",
      "description": "Questions fréquentes et réponses sur l'utilisation de Newbi",
      "url": `${baseUrl}/faq`,
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Qu'est-ce que Newbi ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Newbi est une plateforme tout-en-un pour gérer simplement et efficacement votre activité: devis, factures, signature de mail, gestion de tâches en Kanban et transfert de fichiers sécurisé."
          }
        },
        {
          "@type": "Question",
          "name": "À qui s'adresse Newbi ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Newbi est une plateforme pensée pour les indépendants, TPE/PME, agences et associations qui veulent centraliser leurs outils commerciaux et administratifs, sans complexité."
          }
        },
        {
          "@type": "Question",
          "name": "Y a-t-il un essai gratuit ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Oui, vous bénéficiez de 14 jours gratuits à l'inscription, durant lesquels vous pouvez résilier votre abonnement à tout moment."
          }
        }
      ]
    }
  },

  // Page CGV
  cgv: {
    title: "Conditions Générales de Vente - CGV Newbi",
    description: "Consultez les conditions générales de vente de Newbi : modalités d'abonnement, facturation, résiliation, garanties et conditions d'utilisation.",
    keywords: "cgv newbi, conditions générales vente, modalités abonnement, facturation, résiliation, garanties, conditions utilisation",
    canonical: `${baseUrl}/cgv`,
    robots: "index,nofollow",
    openGraph: {
      title: "Conditions Générales de Vente - Newbi",
      description: "Découvrez les conditions générales de vente et d'utilisation de la plateforme Newbi.",
      image: `${baseUrl}/NewbiV2/public/Logo + texte.svg`,
      type: "website",
      locale: "fr_FR",
    },
    twitter: {
      card: "summary_large_image",
      title: "Conditions Générales de Vente - Newbi",
      description: "Conditions générales de vente et d'utilisation de Newbi.",
      image: `${baseUrl}/NewbiV2/public/Logo + texte.svg`,
    },
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Conditions Générales de Vente",
      "description": "Conditions générales de vente et d'utilisation de la plateforme Newbi",
      "url": `${baseUrl}/cgv`,
      "isPartOf": {
        "@type": "WebSite",
        "name": "Newbi",
        "url": baseUrl
      },
      "inLanguage": "fr-FR",
      "dateModified": "2024-01-01",
      "publisher": {
        "@type": "Organization",
        "name": "Newbi",
        "url": baseUrl
      }
    }
  }
};

/**
 * Fonction utilitaire pour récupérer les données SEO d'une page
 * @param {string} pageKey - Clé de la page dans seoData
 * @returns {Object} - Données SEO de la page avec les valeurs par défaut
 */
export function getSEOData(pageKey) {
  const pageSEO = seoData[pageKey] || {};
  
  return {
    ...defaultSEO,
    ...pageSEO,
    openGraph: {
      siteName: defaultSEO.siteName,
      locale: defaultSEO.locale,
      type: "website",
      ...pageSEO.openGraph,
    },
    twitter: {
      card: "summary_large_image",
      site: "@newbi_fr",
      creator: "@newbi_fr",
      ...pageSEO.twitter,
    }
  };
}

/**
 * Fonction pour générer des données JSON-LD de base pour une page
 * @param {string} title - Titre de la page
 * @param {string} description - Description de la page
 * @param {string} url - URL de la page
 * @returns {Object} - Données JSON-LD de base
 */
export function generateBasicJsonLd(title, description, url) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": title,
    "description": description,
    "url": url,
    "isPartOf": {
      "@type": "WebSite",
      "name": defaultSEO.siteName,
      "url": baseUrl
    },
    "inLanguage": "fr-FR",
    "potentialAction": {
      "@type": "ReadAction",
      "target": url
    }
  };
}

/**
 * Fonction pour générer des breadcrumbs JSON-LD
 * @param {Array} breadcrumbs - Tableau des breadcrumbs [{name, url}, ...]
 * @returns {Object} - Données JSON-LD pour les breadcrumbs
 */
export function generateBreadcrumbsJsonLd(breadcrumbs) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

/**
 * Fonction pour générer un sitemap XML basique
 * @returns {string} - Contenu XML du sitemap
 */
export function generateSitemap() {
  const pages = Object.keys(seoData).filter(key => 
    !seoData[key].robots?.includes('noindex')
  );
  
  const urls = pages.map(pageKey => {
    const page = seoData[pageKey];
    const url = page.canonical || `${baseUrl}/${pageKey}`;
    const priority = pageKey === 'home' ? '1.0' : '0.8';
    const changefreq = pageKey === 'home' ? 'weekly' : 'monthly';
    
    return `
    <url>
      <loc>${url}</loc>
      <changefreq>${changefreq}</changefreq>
      <priority>${priority}</priority>
      <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    </url>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls}
</urlset>`;
}

/**
 * Fonction pour générer les meta tags HTML
 * @param {string} pageKey - Clé de la page
 * @param {string} currentUrl - URL actuelle de la page
 * @returns {Object} - Meta tags formatés pour Next.js
 */
export function generateMetaTags(pageKey, currentUrl = '') {
  const seo = getSEOData(pageKey);
  
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    canonical: seo.canonical || currentUrl,
    robots: seo.robots || 'index,follow',
    
    // Open Graph
    openGraph: {
      title: seo.openGraph?.title || seo.title,
      description: seo.openGraph?.description || seo.description,
      url: currentUrl,
      siteName: seo.openGraph?.siteName || defaultSEO.siteName,
      images: [
        {
          url: seo.openGraph?.image || defaultSEO.defaultImage,
          width: 1200,
          height: 630,
          alt: seo.openGraph?.title || seo.title,
        }
      ],
      locale: seo.openGraph?.locale || defaultSEO.locale,
      type: seo.openGraph?.type || 'website',
    },
    
    // Twitter
    twitter: {
      card: seo.twitter?.card || 'summary_large_image',
      site: seo.twitter?.site || '@newbi_fr',
      creator: seo.twitter?.creator || '@newbi_fr',
      title: seo.twitter?.title || seo.title,
      description: seo.twitter?.description || seo.description,
      images: [seo.twitter?.image || seo.openGraph?.image || defaultSEO.defaultImage],
    },
    
    // Autres meta tags
    other: {
      'theme-color': defaultSEO.themeColor,
      'application-name': 'Newbi',
      'apple-mobile-web-app-title': 'Newbi',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
      'format-detection': 'telephone=no',
      'mobile-web-app-capable': 'yes',
      'msapplication-config': `${baseUrl}/browserconfig.xml`,
      'msapplication-TileColor': defaultSEO.themeColor,
    }
  };
}

/**
 * Fonction pour générer les données structurées FAQ
 * @param {Array} faqs - Tableau des FAQ [{question, answer}, ...]
 * @returns {Object} - Données JSON-LD pour les FAQ
 */
export function generateFAQJsonLd(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

/**
 * Fonction pour générer les données structurées d'avis clients
 * @param {Array} reviews - Tableau des avis [{author, rating, text, date}, ...]
 * @returns {Object} - Données JSON-LD pour les avis
 */
export function generateReviewsJsonLd(reviews) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Newbi - Solution de gestion d'entreprise",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length,
      "reviewCount": reviews.length,
      "bestRating": 5,
      "worstRating": 1
    },
    "review": reviews.map(review => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": review.author
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.rating,
        "bestRating": 5,
        "worstRating": 1
      },
      "reviewBody": review.text,
      "datePublished": review.date
    }))
  };
}

/**
 * Fonction pour valider les données SEO
 * @param {string} pageKey - Clé de la page à valider
 * @returns {Object} - Résultat de la validation avec erreurs/avertissements
 */
export function validateSEOData(pageKey) {
  const seo = seoData[pageKey];
  const errors = [];
  const warnings = [];
  
  if (!seo) {
    errors.push(`Page "${pageKey}" non trouvée dans seoData`);
    return { valid: false, errors, warnings };
  }
  
  // Validation du titre
  if (!seo.title) {
    errors.push('Titre manquant');
  } else if (seo.title.length > 60) {
    warnings.push(`Titre trop long (${seo.title.length} caractères, recommandé: <60)`);
  } else if (seo.title.length < 30) {
    warnings.push(`Titre court (${seo.title.length} caractères, recommandé: 30-60)`);
  }
  
  // Validation de la description
  if (!seo.description) {
    errors.push('Description manquante');
  } else if (seo.description.length > 160) {
    warnings.push(`Description trop longue (${seo.description.length} caractères, recommandé: <160)`);
  } else if (seo.description.length < 120) {
    warnings.push(`Description courte (${seo.description.length} caractères, recommandé: 120-160)`);
  }
  
  // Validation des mots-clés
  if (!seo.keywords) {
    warnings.push('Mots-clés manquants');
  } else {
    const keywordCount = seo.keywords.split(',').length;
    if (keywordCount > 10) {
      warnings.push(`Trop de mots-clés (${keywordCount}, recommandé: <10)`);
    }
  }
  
  // Validation Open Graph
  if (!seo.openGraph?.title) {
    warnings.push('Titre Open Graph manquant');
  }
  if (!seo.openGraph?.description) {
    warnings.push('Description Open Graph manquante');
  }
  if (!seo.openGraph?.image) {
    warnings.push('Image Open Graph manquante');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    score: Math.max(0, 100 - (errors.length * 20) - (warnings.length * 5))
  };
}
