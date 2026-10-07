import { SITE_URL } from "@/src/lib/site";
import { PLANS_DISPLAY } from "@/src/lib/plans-display";

/**
 * Données structurées des pages « Pour qui » (SoftwareApplication +
 * BreadcrumbList), sur le modèle de src/lib/product-jsonld.js.
 *
 * Mêmes partis pris que pour les pages produit :
 *  - pas d'`aggregateRating` : aucune source d'avis réelle n'est branchée,
 *    et publier une note inventée expose à une action manuelle de Google ;
 *  - le prix vient de plans-display.js, source unique des tarifs.
 *
 * Le fil d'Ariane compte trois niveaux (Accueil › Pour qui › le statut) pour
 * refléter l'entrée de menu qui mène à ces pages.
 */
const entryPlan = PLANS_DISPLAY.find((p) => p.key === "freelance");
const ENTRY_PRICE = entryPlan.monthlyPrice;

export function statutJsonLd({ slug, nom, description, fonctionnalites }) {
  const url = `${SITE_URL}/${slug}`;

  return [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: `Newbi pour ${nom}`,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web, iOS, Android",
      inLanguage: "fr-FR",
      url,
      description,
      featureList: fonctionnalites,
      softwareHelp: "https://docs.newbi.fr/",
      publisher: { "@type": "Organization", name: "Newbi", url: SITE_URL },
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
        { "@type": "ListItem", position: 2, name: "Pour qui", item: url },
        { "@type": "ListItem", position: 3, name: nom, item: url },
      ],
    },
  ];
}
