import { SITE_URL } from "@/src/lib/site";
import { PLANS_DISPLAY } from "@/src/lib/plans-display";

/**
 * Données structurées des pages produit (SoftwareApplication + BreadcrumbList).
 *
 * Contexte : `src/utils/seo-data.js` contenait déjà des blocs `jsonLd` pour
 * cinq produits, mais rien ne les rendait (`generateNextMetadata` ne les lit
 * pas et aucune page ne les affichait). Les pages produit ne servaient donc
 * aucune donnée structurée, constaté en production le 23/09/2026.
 *
 * Deux écarts volontaires avec ces anciens blocs :
 *
 * 1. PAS d'`aggregateRating`. Les blocs d'origine annonçaient des notes de 4,5
 *    à 4,9 sur 80 à 200 avis, qui n'existent nulle part dans le produit ni dans
 *    le code (seuls trois témoignages sont affichés). Publier une note inventée
 *    contrevient aux règles de Google sur les résultats enrichis et expose à
 *    une action manuelle. Le jour où une source d'avis réelle est branchée
 *    (Trustpilot, avis Google), on pourra l'ajouter ici à partir de ses
 *    chiffres, et à condition que les avis soient visibles sur la page.
 *
 * 2. Le prix vient de `plans-display.js` (source unique des tarifs) au lieu du
 *    « price: 0 » codé en dur. Newbi n'est pas gratuit : l'essai de 30 jours
 *    est décrit dans la description de l'offre, pas par un prix nul.
 */

const entryPlan = PLANS_DISPLAY.find((p) => p.key === "freelance");
const ENTRY_PRICE = entryPlan.monthlyPrice;

/** Catalogue des pages produit indexables, dans l'ordre du menu Produits. */
export const PRODUCT_JSONLD = {
  factures: {
    path: "/produits/factures",
    name: "Newbi Facturation",
    description:
      "Logiciel de facturation en ligne pour freelances et TPE : devis, factures et avoirs conformes, suivi des paiements et relances automatiques.",
    featureList: [
      "Création de devis, factures et avoirs conformes",
      "Suivi des paiements et relances automatiques",
      "Conversion d'un devis signé en facture",
      "Gestion de la TVA et de la franchise en base",
      "Numérotation continue et mentions obligatoires",
      "Export comptable et accès expert-comptable",
      "Facturation électronique incluse",
    ],
  },
  "facturation-electronique": {
    path: "/produits/facturation-electronique",
    name: "Newbi Facturation électronique",
    description:
      "Émission et réception de factures électroniques conformes à la réforme française : formats Factur-X, UBL et CII, transmission via plateforme agréée et archivage légal.",
    featureList: [
      "Émission au format Factur-X, UBL et CII",
      "Réception des factures fournisseurs",
      "Transmission via une plateforme agréée",
      "Suivi des statuts du cycle de vie",
      "Mentions obligatoires de la facture électronique",
      "e-reporting des transactions",
      "Archivage légal 10 ans",
    ],
  },
  tresorerie: {
    path: "/produits/tresorerie",
    name: "Newbi Trésorerie",
    description:
      "Suivi de trésorerie pour TPE et PME : synchronisation bancaire, catégorisation des transactions, prévisions et scénarios.",
    featureList: [
      "Synchronisation bancaire automatique",
      "Catégorisation des transactions",
      "Rapprochement des factures et des paiements",
      "Prévisions de trésorerie et scénarios",
      "Tableau de bord des encaissements et décaissements",
      "Suivi des impayés",
    ],
  },
  "gestion-des-achats": {
    path: "/produits/gestion-des-achats",
    name: "Newbi Achats et notes de frais",
    description:
      "Gestion des factures fournisseurs et des notes de frais : lecture automatique des justificatifs, catégorisation et rapprochement bancaire.",
    featureList: [
      "Lecture automatique des factures et des tickets (OCR)",
      "Extraction du montant, de la date et de la TVA",
      "Rapprochement avec les transactions bancaires",
      "Catégorisation des dépenses",
      "Justificatifs conservés et exportables",
      "Détection des doublons",
    ],
  },
  kanban: {
    path: "/produits/kanban",
    name: "Newbi Gestion de projet",
    description:
      "Gestion de projet pour freelances et petites équipes : tableaux kanban, tâches, échéances et collaboration en temps réel.",
    featureList: [
      "Tableaux kanban personnalisables",
      "Collaboration en temps réel",
      "Suivi des tâches et des échéances",
      "Tâches liées entre tableaux",
      "Vue Gantt et suivi du temps",
      "Interface glisser-déposer",
    ],
  },
  signatures: {
    path: "/produits/signatures",
    name: "Newbi Signatures de mail",
    description:
      "Générateur de signatures de mail professionnelles : modèles personnalisables, rendu responsive et export prêt à coller dans votre messagerie.",
    featureList: [
      "Modèles de signature personnalisables",
      "Rendu responsive sur mobile",
      "Logo et réseaux sociaux",
      "Prévisualisation en temps réel",
      "Export HTML prêt à coller",
      "Signatures harmonisées pour toute l'équipe",
    ],
  },
  transfers: {
    path: "/produits/transfers",
    name: "Newbi Transfert de fichiers",
    description:
      "Transfert de fichiers volumineux sécurisé : liens à durée limitée, suivi des téléchargements et contrôle d'accès.",
    featureList: [
      "Envoi de fichiers volumineux",
      "Liens à durée de vie limitée",
      "Suivi des téléchargements",
      "Protection par mot de passe",
      "Notifications à la réception",
      "Hébergement en Europe",
    ],
  },
};

/**
 * Renvoie le tableau JSON-LD d'une page produit : l'application elle-même et
 * son fil d'Ariane, pour que Google affiche le chemin sous le lien.
 */
export function productJsonLd(key) {
  const p = PRODUCT_JSONLD[key];
  if (!p) return null;
  const url = `${SITE_URL}${p.path}`;

  return [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: p.name,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web, iOS, Android",
      inLanguage: "fr-FR",
      url,
      description: p.description,
      featureList: p.featureList,
      softwareHelp: "https://docs.newbi.fr/",
      publisher: {
        "@type": "Organization",
        name: "Newbi",
        url: SITE_URL,
      },
      offers: {
        "@type": "Offer",
        price: ENTRY_PRICE.toFixed(2),
        priceCurrency: "EUR",
        url: `${SITE_URL}/tarifs`,
        availability: "https://schema.org/InStock",
        description: `Essai gratuit de 30 jours sans carte bancaire, puis abonnement à partir de ${ENTRY_PRICE.toFixed(2).replace(".", ",")} € TTC par mois.`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: p.name, item: url },
      ],
    },
  ];
}
