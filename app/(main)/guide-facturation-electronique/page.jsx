import GuideFacturationElectroniquePage from "./guide-content";

export const metadata = {
  title:
    "Guide Facturation Électronique 2026 - Obligations, Calendrier & Checklist | Newbi",
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
    canonical: "https://newbi.fr/guide-facturation-electronique",
  },
  openGraph: {
    title:
      "Guide Facturation Électronique 2026 - Tout comprendre sur la réforme",
    description:
      "Guide gratuit de 20 pages : calendrier, obligations par statut, formats acceptés, PPF vs PDP, et checklist pratique pour préparer votre entreprise à la facturation électronique obligatoire.",
    url: "https://newbi.fr/guide-facturation-electronique",
    siteName: "Newbi",
    type: "website",
    locale: "fr_FR",
    images: [
      {
        url: "https://newbi.fr/og/guide-facturation-electronique.png",
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
    images: ["https://newbi.fr/og/guide-facturation-electronique.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Page() {
  return <GuideFacturationElectroniquePage />;
}
