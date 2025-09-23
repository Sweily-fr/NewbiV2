/**
 * Configuration SEO centralisée pour toutes les pages du site
 * Contient les métadonnées, descriptions, mots-clés et données structurées
 */

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://newbi.fr";

// Configuration SEO par défaut
export const defaultSEO = {
  siteName: "Newbi - Solution de gestion pour entrepreneurs",
  author: "Newbi",
  language: "fr-FR",
  twitterHandle: "@newbi_fr",
  defaultImage: `${baseUrl}/og-image.jpg`,
};

// Données SEO pour chaque page
export const seoData = {
  // Page d'accueil
  home: {
    title: "Newbi - Solution de gestion complète pour entrepreneurs et freelances",
    description: "Simplifiez votre gestion d'entreprise avec Newbi : facturation, devis, signatures électroniques, kanban et transferts de fichiers. Essai gratuit sans engagement.",
    keywords: "gestion entreprise, facturation, devis, signature électronique, kanban, freelance, entrepreneur, comptabilité, CRM",
    openGraph: {
      title: "Newbi - La solution tout-en-un pour entrepreneurs",
      description: "Gérez votre entreprise efficacement : facturation, devis, signatures, organisation. Plus de 1000 entrepreneurs nous font confiance.",
      image: `${baseUrl}/og-home.jpg`,
    },
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Newbi",
      "url": baseUrl,
      "logo": `${baseUrl}/logo.png`,
      "description": "Solution de gestion complète pour entrepreneurs et freelances",
      "foundingDate": "2023",
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+33-1-23-45-67-89",
        "contactType": "customer service",
        "availableLanguage": "French"
      },
      "sameAs": [
        "https://twitter.com/newbi_fr",
        "https://linkedin.com/company/newbi"
      ]
    }
  },

  // Page Factures
  factures: {
    title: "Logiciel de Facturation Professionnel - Newbi",
    description: "Créez, envoyez et gérez vos factures professionnelles en quelques clics. Suivi des paiements, relances automatiques et conformité légale garantie.",
    keywords: "logiciel facturation, facture professionnelle, gestion factures, suivi paiements, relance automatique, TVA, comptabilité",
    openGraph: {
      title: "Facturation Professionnelle Simplifiée - Newbi",
      description: "Automatisez votre facturation et suivez vos paiements. Interface intuitive, conformité légale et gain de temps garanti.",
      image: `${baseUrl}/og-factures.jpg`,
    },
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Newbi Facturation",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "description": "Logiciel de facturation professionnel pour entrepreneurs et freelances",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EUR",
        "description": "Essai gratuit disponible"
      },
      "featureList": [
        "Création de factures professionnelles",
        "Suivi des paiements",
        "Relances automatiques",
        "Conformité légale française",
        "Export comptable"
      ]
    }
  },

  // Page Devis
  devis: {
    title: "Créateur de Devis Professionnel en Ligne - Newbi",
    description: "Créez des devis professionnels personnalisés en quelques minutes. Conversion automatique en facture, suivi client et taux de conversion optimisé.",
    keywords: "créateur devis, devis professionnel, estimation, proposition commerciale, conversion facture, suivi client",
    openGraph: {
      title: "Devis Professionnels en Ligne - Newbi",
      description: "Impressionnez vos clients avec des devis professionnels. Conversion facile en facture et suivi des acceptations.",
      image: `${baseUrl}/og-devis.jpg`,
    },
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Newbi Devis",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "description": "Créateur de devis professionnel pour entrepreneurs",
      "featureList": [
        "Création de devis personnalisés",
        "Templates professionnels",
        "Conversion automatique en facture",
        "Suivi des acceptations",
        "Signature électronique intégrée"
      ]
    }
  },

  // Page Signatures
  signatures: {
    title: "Signature Électronique Professionnelle - Newbi",
    description: "Créez et gérez vos signatures électroniques professionnelles. Conformité légale, templates personnalisables et intégration email simplifiée.",
    keywords: "signature électronique, signature email, signature professionnelle, template signature, email professionnel",
    openGraph: {
      title: "Signatures Électroniques Professionnelles - Newbi",
      description: "Créez des signatures email professionnelles en quelques clics. Templates personnalisables et conformité garantie.",
      image: `${baseUrl}/og-signatures.jpg`,
    },
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Newbi Signatures",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "description": "Générateur de signatures électroniques professionnelles",
      "featureList": [
        "Création de signatures email",
        "Templates personnalisables",
        "Conformité légale",
        "Intégration facile",
        "Design responsive"
      ]
    }
  },

  // Page Kanban
  kanban: {
    title: "Tableau Kanban - Gestion de Projets Agile - Newbi",
    description: "Organisez vos projets avec des tableaux Kanban intuitifs. Collaboration en équipe, suivi des tâches et productivité optimisée.",
    keywords: "kanban, gestion projet, organisation, productivité, collaboration équipe, suivi tâches, méthode agile",
    openGraph: {
      title: "Gestion de Projets Kanban - Newbi",
      description: "Boostez votre productivité avec nos tableaux Kanban. Organisation visuelle et collaboration simplifiée.",
      image: `${baseUrl}/og-kanban.jpg`,
    },
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Newbi Kanban",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "description": "Outil de gestion de projets avec tableaux Kanban",
      "featureList": [
        "Tableaux Kanban personnalisables",
        "Collaboration en temps réel",
        "Suivi des tâches",
        "Notifications automatiques",
        "Rapports de productivité"
      ]
    }
  },

  // Page Transferts
  transfers: {
    title: "Transfert de Fichiers Sécurisé - Partage Professionnel - Newbi",
    description: "Partagez vos fichiers volumineux en toute sécurité. Transferts cryptés, liens temporaires et suivi des téléchargements pour professionnels.",
    keywords: "transfert fichiers, partage sécurisé, envoi gros fichiers, partage professionnel, cryptage, sécurité données",
    openGraph: {
      title: "Transfert de Fichiers Sécurisé - Newbi",
      description: "Partagez vos fichiers professionnels en toute sécurité. Cryptage avancé et contrôle total sur vos partages.",
      image: `${baseUrl}/og-transfers.jpg`,
    },
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Newbi Transferts",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "description": "Solution de transfert de fichiers sécurisé pour professionnels",
      "featureList": [
        "Transferts cryptés",
        "Liens temporaires",
        "Suivi des téléchargements",
        "Contrôle d'accès",
        "Notifications en temps réel"
      ]
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
    openGraph: {
      title: "Politique de Confidentialité - Newbi",
      description: "Découvrez comment nous protégeons vos données personnelles et respectons votre vie privée.",
    },
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Politique de Confidentialité",
      "description": "Politique de confidentialité et protection des données personnelles de Newbi"
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
      ...defaultSEO,
      ...pageSEO.openGraph,
    },
    twitter: {
      site: defaultSEO.twitterHandle,
      creator: defaultSEO.twitterHandle,
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
