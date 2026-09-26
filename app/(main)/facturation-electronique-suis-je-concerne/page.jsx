import ConcernePage from "./content";
import { FAQ } from "./faq";
import { JsonLd } from "@/src/components/seo/json-ld";
import { SITE_URL } from "@/src/lib/site";

const PATH = "/facturation-electronique-suis-je-concerne";

export const metadata = {
  // `absolute` : le titre porte déjà la marque (sinon « … | Newbi | Newbi »).
  title: {
    absolute:
      "Facturation électronique : suis-je concerné ? Simulateur gratuit par SIREN | Newbi",
  },
  description:
    "Simulateur gratuit : vérifie en 10 secondes si ton entreprise est concernée par la facturation électronique obligatoire et à quelle date. Réception au 1er septembre 2026 pour toutes les entreprises, émission en 2026 ou 2027 selon la taille. Recherche par nom ou SIREN.",
  keywords: [
    "suis-je concerné facturation électronique",
    "simulateur facturation électronique",
    "test facturation électronique entreprise",
    "vérifier si je suis concerné facturation électronique",
    "qui est concerné par la facturation électronique",
    "facturation électronique obligatoire 2026",
    "facturation électronique 2027",
    "facture électronique auto-entrepreneur",
    "date facturation électronique entreprise",
    "réforme facturation électronique",
    "plateforme agréée PDP",
    "e-reporting",
  ],
  authors: [{ name: "Newbi" }],
  alternates: { canonical: PATH },
  openGraph: {
    title: "Facturation électronique : es-tu concerné, et à quelle date ?",
    description:
      "Simulateur gratuit : tape le nom ou le SIREN de ton entreprise et obtiens tes échéances — réception des factures électroniques, émission, inscription à une plateforme agréée.",
    url: PATH,
    siteName: "Newbi",
    type: "website",
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Facturation électronique : es-tu concerné ?",
    description:
      "Simulateur gratuit par nom ou SIREN : tes dates d'obligation en 10 secondes.",
  },
};

// FAQPage construite depuis les questions réellement affichées sur la page
// (le balisage doit refléter le contenu visible).
const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  },
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Facturation électronique : suis-je concerné ?",
    url: `${SITE_URL}${PATH}`,
    inLanguage: "fr-FR",
    description:
      "Vérifier si son entreprise est concernée par la facturation électronique obligatoire et connaître ses dates d'obligation.",
    isPartOf: {
      "@type": "WebSite",
      name: "Newbi",
      url: SITE_URL,
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Accueil",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Facturation électronique : suis-je concerné ?",
        item: `${SITE_URL}${PATH}`,
      },
    ],
  },
];

export default function Page() {
  return (
    <>
      <JsonLd data={jsonLd} />
      <ConcernePage />
    </>
  );
}
