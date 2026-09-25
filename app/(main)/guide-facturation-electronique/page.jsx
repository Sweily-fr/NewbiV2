import GuideFacturationElectroniquePage from "./guide-content";
import { getAllPosts } from "@/src/lib/blog";
import { JsonLd } from "@/src/components/seo/json-ld";
import { SITE_URL } from "@/src/lib/site";

// Articles du cluster « facturation électronique » reliés au guide (page
// pilier) : seuls ceux déjà publiés sont rendus.
const GUIDE_CLUSTER = [
  "facturation-electronique-obligatoire-2026",
  "facture-electronique-reception-1er-septembre-2026",
  "facture-electronique-auto-entrepreneur-2027",
  "obligations-facture-electronique-pme",
  "quest-ce-que-pdp-plateforme-dematerialisation",
  "comment-choisir-sa-pdp-plateforme-dematerialisation",
  "quest-ce-que-ppf-portail-public-facturation",
  "od-vs-pdp-operateur-dematerialisation-difference",
  "facturx-format-facture-electronique",
  "formats-ubl-cii-facturx-comparatif",
  "e-reporting-definition-obligations-calendrier",
  "nouvelles-mentions-obligatoires-facture-electronique",
  "statuts-cycle-de-vie-facture-electronique",
  "facture-electronique-sanctions-amendes",
  "facture-electronique-b2c-particuliers-concerne",
  "combien-coute-facturation-electronique",
  "facture-pdf-email-jusqu-a-quand",
  "facture-electronique-checklist-tpe-12-points",
];

export const metadata = {
  // `absolute` : le titre porte déjà la marque (sinon « … | Newbi | Newbi »).
  title: {
    absolute:
      "Guide facturation électronique 2026-2027 : obligations et checklist | Newbi",
  },
  description:
    "Téléchargez gratuitement le guide complet sur la facturation électronique obligatoire en 2026. Calendrier de la réforme, formats acceptés (Factur-X, UBL, CII), obligations par statut, PPF, PDP et checklist pratique pour votre entreprise.",
  keywords: [
    "facturation électronique",
    "facturation électronique obligatoire 2026",
    "réforme facturation électronique",
    "Factur-X",
    "e-invoicing France",
    "PPF",
    "PDP",
    "dématérialisation factures",
    "guide facturation électronique",
    "obligation facturation électronique",
  ],
  authors: [{ name: "Newbi" }],
  alternates: {
    canonical: "/guide-facturation-electronique",
  },
  openGraph: {
    title:
      "Guide Facturation Électronique 2026 - Tout comprendre sur la réforme",
    description:
      "Guide gratuit de 20 pages : calendrier, obligations par statut, formats acceptés, PPF vs PDP, et checklist pratique pour préparer votre entreprise à la facturation électronique obligatoire.",
    url: "/guide-facturation-electronique",
    siteName: "Newbi",
    type: "website",
    locale: "fr_FR",
    images: [
      {
        url: "/og/guide-facturation-electronique.png",
        width: 1200,
        height: 630,
        alt: "Guide Facturation Électronique 2026 - Newbi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Guide Facturation Électronique 2026 - Obligations, Calendrier & Checklist",
    description:
      "Téléchargez gratuitement le guide complet sur la facturation électronique obligatoire en 2026. Calendrier, formats, checklist pratique.",
    images: ["/og/guide-facturation-electronique.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Page() {
  const bySlug = new Map(getAllPosts().map((p) => [p.slug, p]));
  const related = GUIDE_CLUSTER.map((slug) => bySlug.get(slug))
    .filter(Boolean)
    .map((p) => ({ slug: p.slug, title: p.title, description: p.description }));

  // Page pilier du cluster e-invoicing : c'était la seule page importante du
  // site sans aucune donnée structurée. L'ItemList reprend les articles
  // réellement rendus par la page, pas une liste théorique.
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Guide de la facturation électronique",
      url: `${SITE_URL}/guide-facturation-electronique`,
      description: metadata.description,
      inLanguage: "fr-FR",
      isPartOf: { "@type": "WebSite", name: "Newbi", url: SITE_URL },
      about: {
        "@type": "Thing",
        name: "Facturation électronique obligatoire en France",
      },
      publisher: {
        "@type": "Organization",
        name: "Newbi",
        url: SITE_URL,
        logo: `${SITE_URL}/images/op-newbi.png`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: "Guide de la facturation électronique",
          item: `${SITE_URL}/guide-facturation-electronique`,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Le dossier facturation électronique",
      itemListElement: related.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: p.title,
        url: `${SITE_URL}/blog/${p.slug}`,
      })),
    },
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <GuideFacturationElectroniquePage related={related} />
    </>
  );
}
