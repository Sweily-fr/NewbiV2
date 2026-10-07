import React from "react";
import { Poppins } from "next/font/google";
import { FileDown, FolderOpen, Percent, Timer, Users } from "lucide-react";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import { SHEET_ESSENTIEL } from "@/src/lib/lp-visuels";
import {
  VisuelListe,
  VisuelPhoto,
  VisuelRepartition,
} from "@/src/components/lp/visuels";
import TrustedBySection from "@/app/(main)/new/lp-home/TrustedBySection";
import HomePricingSection from "@/app/(main)/new/lp-home/HomePricingSection";
import LpEssentials from "@/app/lp/_components/LpEssentials";
import LpSteps from "@/app/lp/_components/LpSteps";
import LpFinalCta from "@/app/lp/_components/LpFinalCta";
import LpTestimonials from "@/app/lp/_components/LpTestimonials";
import { BlogFurtherReading } from "@/src/components/blog/blog-further-reading";
import { JsonLd } from "@/src/components/seo/json-ld";
// Hero commun aux pages « Pour qui » : il vit dans _statuts parce qu'il y a été
// écrit en premier, mais il n'a rien de propre aux statuts juridiques.
import StatutHero from "@/app/(main)/_statuts/StatutHero";
import ModesSection from "./section/ModesSection";
import DeboursSection from "./section/DeboursSection";
import FAQ from "./section/faq";
import { SITE_URL } from "@/src/lib/site";
import { PLANS_DISPLAY } from "@/src/lib/plans-display";

// Même configuration de police que les autres LP.
const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

const TITRE = "Logiciel de facturation pour avocats | Newbi";
const DESCRIPTION =
  "Facturez vos honoraires au temps passé, au forfait ou sur provision : TVA à 20 % et débours à 0 % sur le même document, chronomètre par dossier et champs personnalisés. 30 jours offerts.";

export const metadata = {
  title: { absolute: TITRE },
  description: DESCRIPTION,
  keywords:
    "logiciel facturation avocat, facture honoraires avocat, débours avocat TVA, provision honoraires, convention d'honoraires, suivi du temps par dossier, cabinet d'avocats",
  alternates: { canonical: "/avocats" },
  openGraph: {
    title: TITRE,
    description: DESCRIPTION,
    url: `${SITE_URL}/avocats`,
    siteName: "Newbi",
    type: "website",
    locale: "fr_FR",
    images: [
      { url: "/images/op-newbi.png", width: 1200, height: 630, alt: TITRE },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITRE,
    description: DESCRIPTION,
    images: ["/images/op-newbi.png"],
  },
};

const PRIX_ENTREE = PLANS_DISPLAY.find(
  (p) => p.key === "freelance",
).monthlyPrice;

// Mêmes partis pris que les autres pages : pas d'aggregateRating inventé, et
// le prix vient de plans-display.js. La liste ne contient que des
// fonctionnalités vérifiées dans le modèle de données.
const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Newbi pour les avocats",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, iOS, Android",
    inLanguage: "fr-FR",
    url: `${SITE_URL}/avocats`,
    description: DESCRIPTION,
    featureList: [
      "Factures d'honoraires détaillées par diligence",
      "Taux de TVA choisi ligne par ligne",
      "Débours à 0 % avec mention d'exonération exigée",
      "Factures d'acompte pour les provisions",
      "Chronomètre et taux horaire par tâche de dossier",
      "Champs personnalisés : dossier, convention, référence CARPA",
      "Modèles de documents réutilisables",
      "Accès expert-comptable gratuit",
    ],
    softwareHelp: "https://docs.newbi.fr/",
    publisher: { "@type": "Organization", name: "Newbi", url: SITE_URL },
    offers: {
      "@type": "Offer",
      price: PRIX_ENTREE.toFixed(2),
      priceCurrency: "EUR",
      url: `${SITE_URL}/tarifs`,
      availability: "https://schema.org/InStock",
      description: `Essai gratuit de 30 jours sans carte bancaire, puis abonnement à partir de ${PRIX_ENTREE.toFixed(2).replace(".", ",")} € TTC par mois.`,
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
        name: "Pour qui",
        item: `${SITE_URL}/avocats`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Avocats",
        item: `${SITE_URL}/avocats`,
      },
    ],
  },
];

const HERO = {
  titre: "Vos honoraires facturés comme vous les avez convenus",
  chapo: (
    <>
      Au temps passé, au forfait ou sur provision, avec{" "}
      <strong className="font-medium text-gray-900">
        les débours séparés des honoraires
      </strong>{" "}
      et la référence du dossier sur chaque document. Le reste du cabinet suit.
    </>
  ),
  image: "/lp/metiers/avocat-hero.jpg",
  imageAlt:
    "Deux professionnelles examinent et signent un dossier dans un cabinet",
  cartes: [
    {
      icon: Percent,
      titre: "Débours à part",
      texte: "Ligne à 0 %, mention exigée",
    },
    {
      icon: Timer,
      titre: "Temps par dossier",
      texte: "Chronomètre et taux horaire",
    },
    {
      icon: FolderOpen,
      titre: "Référence du dossier",
      texte: "Portée sur chaque document",
    },
  ],
};

const ETAPES = [
  {
    when: "À l'ouverture du dossier",
    title: "La provision est appelée avant les diligences",
    desc: "Une facture d'acompte sécurise la trésorerie du cabinet. Elle prend place dans votre numérotation continue et sert de point de départ au dossier.",
    aside: "Facture d'acompte émise",
  },
  {
    when: "Pendant la mission",
    title: "Le temps se compte là où il se passe",
    desc: "Chaque tâche du dossier porte son chronomètre, son historique de saisies et son taux horaire. Vous savez ce que la mission a coûté avant d'écrire la facture.",
    aside: "Diligences chronométrées",
  },
  {
    when: "À la facturation",
    title: "Honoraires et débours sur le même document",
    desc: "Les honoraires à 20 %, les frais avancés pour le compte du client sur une ligne à 0 % avec sa mention. Le client voit ce qu'il paie et à quel titre.",
    aside: "TVA réglée à la ligne",
  },
];

const ESSENTIELS = [
  {
    title: "Le détail qui évite la contestation",
    intro:
      "La nature, la date et la durée de chaque diligence sont ce qui tient devant une contestation d'honoraires. Mieux vaut que la facture les porte.",
    points: [
      "Description, quantité, unité et prix unitaire par ligne",
      "Référence de dossier et de convention en champs personnalisés",
      "Modèle enregistré une fois, repris sur les documents suivants",
    ],
    visual: (
      <VisuelListe
        className={SHEET_ESSENTIEL}
        titre="Ligne de diligence"
        lignes={[
          "Description, quantité, unité, prix",
          "Référence de dossier en champ personnalisé",
          "Modèle repris d'un dossier à l'autre",
        ]}
        chip="Honoraires détaillés"
      />
    ),
  },
  {
    title: "La trésorerie du cabinet",
    intro:
      "Entre la provision appelée, les factures émises et les règlements reçus, l'écart se creuse vite si rien n'est suivi.",
    points: [
      "Statut de chaque document : émis, envoyé, payé",
      "Relances automatiques sur les factures en retard",
      "Comptes bancaires du cabinet connectés et rapprochés",
    ],
    visual: (
      <VisuelRepartition
        className={SHEET_ESSENTIEL}
        titre="Facturation du cabinet"
        total="42 300,00 €"
        parts={[
          { label: "Payé", valeur: "31 700,00 €", part: 75 },
          { label: "Envoyé", valeur: "7 400,00 €", part: 17 },
          { label: "En retard", valeur: "3 200,00 €", part: 8 },
        ]}
      />
    ),
  },
  {
    title: "Votre comptable dans la boucle",
    intro:
      "Plutôt qu'un dossier reconstitué en fin d'exercice, il travaille sur des données déjà à jour, quand il en a besoin.",
    points: [
      "Accès gratuit, sans occuper de place d'utilisateur",
      "Export CSV, Excel ou FEC selon votre formule",
      "Factures, dépenses et justificatifs au même endroit",
    ],
    visual: (
      <VisuelPhoto
        src="/lp/metiers/avocat-essentiel.jpg"
        alt="Deux professionnels revoient un dossier chiffré sur un ordinateur"
        className={`${SHEET_ESSENTIEL} top-0`}
        placements={["left-3 top-4", "right-3 bottom-14"]}
        cartes={[
          {
            icon: Users,
            titre: "Accès comptable",
            texte: "Gratuit, sans place prise",
          },
          {
            icon: FileDown,
            titre: "CSV, Excel ou FEC",
            texte: "Selon votre formule",
          },
        ]}
      />
    ),
  },
];

export default function AvocatsPage() {
  return (
    <div className={`${poppins.variable} font-poppins`}>
      <JsonLd data={jsonLd} />
      <NewHeroNavbar />
      <StatutHero {...HERO} />
      <TrustedBySection variant="default" />
      <ModesSection />
      <DeboursSection />
      <LpSteps
        title="Un dossier, de la provision au solde"
        intro="Le même espace suit la mission de son ouverture à sa facturation."
        steps={ETAPES}
        variant="dark"
        maxWidth="max-w-7xl"
      />
      <LpEssentials
        title="Ce qui change quand on facture des honoraires"
        items={ESSENTIELS}
        maxWidth="max-w-7xl"
        visualMinHeight="min-h-[210px] md:min-h-[240px]"
      />
      <LpFinalCta
        title={
          <>
            Votre prochaine facture
            <br className="hidden md:block" /> d&apos;honoraires, au propre
          </>
        }
        subtitle="Créez votre compte, préparez votre modèle avec vos références de dossier et éditez votre première facture. 30 jours pour tester, sans carte bancaire."
        image="/lp/facturation-electronique/cta-laptop.jpg"
        imageAlt="Une avocate consulte ses factures d'honoraires dans Newbi sur son ordinateur portable"
        maxWidth="max-w-7xl"
        className="pt-10 md:pt-20 lg:pt-22 pb-0 md:pb-0"
      />
      <HomePricingSection
        maxWidth="max-w-7xl"
        className="pt-10 md:pt-20 lg:pt-22 pb-0"
      />
      <LpTestimonials
        maxWidth="max-w-7xl"
        className="mt-10 md:mt-20 lg:mt-22"
      />
      <FAQ />
      <BlogFurtherReading product="avocats" />
    </div>
  );
}
