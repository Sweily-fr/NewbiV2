"use client";

import { usePathname } from "next/navigation";
import { getSEOData, generateBasicJsonLd, generateBreadcrumbsJsonLd } from "@/src/utils/seo-data";

/**
 * Hook personnalisé pour gérer le SEO des pages
 * @param {string} pageKey - Clé de la page dans seoData
 * @param {Object} customSEO - Données SEO personnalisées pour override
 * @param {Array} breadcrumbs - Breadcrumbs pour la page
 * @returns {Object} - Données SEO complètes prêtes à utiliser
 */
export function useSEO(pageKey, customSEO = {}, breadcrumbs = []) {
  const pathname = usePathname();
  const baseUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://newbi.fr";
  const currentUrl = `${baseUrl}${pathname}`;

  // Récupération des données SEO de base
  const baseSEO = getSEOData(pageKey);
  
  // Fusion avec les données personnalisées
  const seoData = {
    ...baseSEO,
    ...customSEO,
    canonical: customSEO.canonical || currentUrl,
    openGraph: {
      ...baseSEO.openGraph,
      ...customSEO.openGraph,
      url: customSEO.canonical || currentUrl,
    },
    twitter: {
      ...baseSEO.twitter,
      ...customSEO.twitter,
    }
  };

  // Génération du JSON-LD de base si pas fourni
  if (!seoData.jsonLd && pageKey) {
    seoData.jsonLd = generateBasicJsonLd(
      seoData.title,
      seoData.description,
      currentUrl
    );
  }

  // Ajout des breadcrumbs JSON-LD si fournis
  if (breadcrumbs.length > 0) {
    const breadcrumbsJsonLd = generateBreadcrumbsJsonLd(breadcrumbs);
    
    // Si on a déjà du JSON-LD, on crée un tableau
    if (seoData.jsonLd) {
      seoData.jsonLd = [seoData.jsonLd, breadcrumbsJsonLd];
    } else {
      seoData.jsonLd = breadcrumbsJsonLd;
    }
  }

  return seoData;
}

/**
 * Hook spécialisé pour les pages produits
 * @param {string} productName - Nom du produit (factures, devis, etc.)
 * @param {Object} customSEO - Données SEO personnalisées
 * @returns {Object} - Données SEO avec breadcrumbs produit
 */
export function useProductSEO(productName, customSEO = {}) {
  const breadcrumbs = [
    { name: "Accueil", url: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://newbi.fr" },
    { name: "Produits", url: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://newbi.fr"}/produits` },
    { name: productName, url: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://newbi.fr"}/produits/${productName.toLowerCase()}` }
  ];

  return useSEO(productName.toLowerCase(), customSEO, breadcrumbs);
}

/**
 * Hook pour les pages d'authentification
 * @param {string} authType - Type d'auth (login, signup)
 * @param {Object} customSEO - Données SEO personnalisées
 * @returns {Object} - Données SEO pour les pages d'auth
 */
export function useAuthSEO(authType, customSEO = {}) {
  const breadcrumbs = [
    { name: "Accueil", url: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://newbi.fr" },
    { name: authType === "login" ? "Connexion" : "Inscription", url: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://newbi.fr"}/auth/${authType}` }
  ];

  return useSEO(authType, customSEO, breadcrumbs);
}

/**
 * Hook pour les pages légales
 * @param {string} legalType - Type de page légale (mentions-legales, politique-confidentialite)
 * @param {Object} customSEO - Données SEO personnalisées
 * @returns {Object} - Données SEO pour les pages légales
 */
export function useLegalSEO(legalType, customSEO = {}) {
  const pageNames = {
    "mentions-legales": "Mentions Légales",
    "politique-de-confidentialite": "Politique de Confidentialité"
  };

  const breadcrumbs = [
    { name: "Accueil", url: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://newbi.fr" },
    { name: pageNames[legalType], url: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://newbi.fr"}/${legalType}` }
  ];

  const pageKey = legalType === "mentions-legales" ? "mentionsLegales" : "politiqueConfidentialite";
  
  return useSEO(pageKey, customSEO, breadcrumbs);
}
