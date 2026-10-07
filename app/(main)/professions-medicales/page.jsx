import React from "react";
import { Poppins } from "next/font/google";
import { BadgePercent, Clock3, FileDown, FileText, Users } from "lucide-react";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import { SHEET_ESSENTIEL } from "@/src/lib/lp-visuels";
import {
  VisuelFiche,
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
import SpecialitesSection from "./section/SpecialitesSection";
import ExonerationSection from "./section/ExonerationSection";
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

const TITRE = "Logiciel de facturation profession médicale | Newbi";
const DESCRIPTION =
  "Facturez vos consultations avec la mention d'exonération de TVA portée à la ligne, suivez vos encaissements et les dépenses du cabinet, et donnez l'accès à votre comptable. 30 jours offerts.";

export const metadata = {
  title: { absolute: TITRE },
  description: DESCRIPTION,
  keywords:
    "logiciel facturation profession médicale, facturation cabinet libéral, exonération TVA 261-4-1, facturation kinésithérapeute, facturation ostéopathe, infirmier libéral, e-reporting professions libérales",
  alternates: { canonical: "/professions-medicales" },
  openGraph: {
    title: TITRE,
    description: DESCRIPTION,
    url: `${SITE_URL}/professions-medicales`,
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
// le prix vient de plans-display.js.
const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Newbi pour les professions médicales",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, iOS, Android",
    inLanguage: "fr-FR",
    url: `${SITE_URL}/professions-medicales`,
    description: DESCRIPTION,
    featureList: [
      "Taux de TVA choisi ligne par ligne",
      "Mention d'exonération obligatoire dès qu'une ligne est à 0 %",
      "Modèles de documents réutilisables",
      "Numérotation continue des factures",
      "Suivi du statut de règlement par période",
      "Dépenses du cabinet et justificatifs rattachés",
      "Accès expert-comptable gratuit",
      "Réception des factures fournisseurs au format électronique",
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
        item: `${SITE_URL}/professions-medicales`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Professions médicales",
        item: `${SITE_URL}/professions-medicales`,
      },
    ],
  },
];

const HERO = {
  titre: "La facturation de votre cabinet, entre deux patients",
  chapo: (
    <>
      Factures de consultation, encaissements et dépenses du cabinet au même
      endroit, avec{" "}
      <strong className="font-medium text-gray-900">
        la mention d&apos;exonération portée à la ligne
      </strong>
      . Pour que l&apos;administratif ne déborde pas sur vos patients.
    </>
  ),
  image: "/lp/metiers/med-hero.jpg",
  imageAlt:
    "Une praticienne libérale reçoit un patient dans son cabinet de consultation",
  cartes: [
    {
      icon: BadgePercent,
      titre: "TVA exonérée",
      texte: "Mention obligatoire dès 0 % sur la ligne",
    },
    {
      icon: FileText,
      titre: "Numérotation continue",
      texte: "Un numéro par document, sans trou",
    },
    {
      icon: Clock3,
      titre: "Dépenses du cabinet",
      texte: "Un justificatif photographié, classé",
    },
  ],
};

const ETAPES = [
  {
    when: "Après la séance",
    title: "La facture part avant le patient suivant",
    desc: "Vous sélectionnez le patient et l'acte depuis votre modèle : la ligne est à 0 %, la mention d'exonération suit et le numéro s'incrémente. Le document est envoyé dans la foulée.",
    aside: "Document émis à chaque séance",
  },
  {
    when: "Au fil du mois",
    title: "Les dépenses du cabinet rentrent toutes seules",
    desc: "Loyer professionnel, matériel, abonnements : vous photographiez le justificatif, il est lu, classé et rapproché de votre compte bancaire.",
    aside: "Justificatifs rattachés",
  },
  {
    when: "À l'échéance",
    title: "Vos chiffres sont prêts sans reprise",
    desc: "Encaissements de la période, dépenses rangées, export au format attendu par votre comptable — qui y accède directement, sans que vous ayez à lui envoyer quoi que ce soit.",
    aside: "Export comptable inclus",
  },
];

const ESSENTIELS = [
  {
    title: "Patients ou entreprises : deux régimes",
    intro:
      "La réforme ne regarde pas votre régime de TVA mais la nature de votre client. Beaucoup de praticiens relèvent des deux selon les cas.",
    points: [
      "Patients particuliers : e-reporting des transactions",
      "Clinique, laboratoire, confrère : facture électronique B2B",
      "Réception des factures fournisseurs, obligatoire pour tous",
    ],
    visual: (
      <VisuelFiche
        className={SHEET_ESSENTIEL}
        titre="Selon la nature du client"
        lignes={[
          { cle: "Patient particulier", valeur: "E-reporting" },
          { cle: "Clinique, confrère", valeur: "Facture B2B" },
          { cle: "Vos fournisseurs", valeur: "Réception" },
        ]}
        chip="Réception obligatoire pour tous"
      />
    ),
  },
  {
    title: "Les dépenses du cabinet",
    intro:
      "Matériel, loyer professionnel, formation continue, déplacements : ce qui n'est pas rattaché le jour même finit par se perdre.",
    points: [
      "Lecture automatique des justificatifs photographiés",
      "Rapprochement avec le compte du cabinet",
      "Pièces conservées dix ans, consultables à tout moment",
    ],
    visual: (
      <VisuelRepartition
        className={SHEET_ESSENTIEL}
        titre="Dépenses du cabinet"
        total="2 480,00 €"
        parts={[
          { label: "Matériel", valeur: "1 240,00 €", part: 50 },
          { label: "Loyer professionnel", valeur: "850,00 €", part: 34 },
          { label: "Formation continue", valeur: "390,00 €", part: 16 },
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
        src="/lp/metiers/med-essentiel.jpg"
        alt="Un praticien revoit ses chiffres avec son expert-comptable"
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

export default function ProfessionsMedicalesPage() {
  return (
    <div className={`${poppins.variable} font-poppins`}>
      <JsonLd data={jsonLd} />
      <NewHeroNavbar />
      <StatutHero {...HERO} />
      <TrustedBySection variant="default" />
      <SpecialitesSection />
      <ExonerationSection />
      <LpSteps
        title="Une journée de consultations, sans soirée de paperasse"
        intro="Le même dossier suit votre activité de la séance à la déclaration."
        steps={ETAPES}
        variant="dark"
        maxWidth="max-w-7xl"
      />
      <LpEssentials
        title="Ce qui change quand on facture des soins"
        items={ESSENTIELS}
        maxWidth="max-w-7xl"
        visualMinHeight="min-h-[210px] md:min-h-[240px]"
      />
      <LpFinalCta
        title={
          <>
            Votre prochaine facture
            <br className="hidden md:block" /> part après la séance
          </>
        }
        subtitle="Créez votre compte, enregistrez votre mention d'exonération dans votre modèle et éditez votre première facture. 30 jours pour tester, sans carte bancaire."
        image="/lp/facturation-electronique/cta-laptop.jpg"
        imageAlt="Une praticienne consulte ses factures dans Newbi sur son ordinateur portable"
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
      <BlogFurtherReading product="professions-medicales" />
    </div>
  );
}
