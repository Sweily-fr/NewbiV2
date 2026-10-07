import React from "react";
import { Poppins } from "next/font/google";
import {
  FileSignature,
  Landmark,
  Layers,
  ScanLine,
  ShieldCheck,
} from "lucide-react";
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
// Hero commun aux pages « Pour qui » : il vit dans _statuts parce qu'il y a
// été écrit en premier, mais il n'a rien de propre aux statuts juridiques.
import StatutHero from "@/app/(main)/_statuts/StatutHero";
import CorpsDeMetierSection from "./section/CorpsDeMetierSection";
import SituationSection from "./section/SituationSection";
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

const TITRE = "Logiciel de devis et facture bâtiment | Newbi";
const DESCRIPTION =
  "Logiciel de devis et factures pour artisans du bâtiment : factures d'acompte et de situation, avancement global ou ligne par ligne, retenue de garantie et TVA choisie à la ligne. 30 jours offerts.";

export const metadata = {
  title: { absolute: TITRE },
  description: DESCRIPTION,
  keywords:
    "logiciel devis facture bâtiment, logiciel artisan, devis travaux BTP, facture de situation, retenue de garantie, assurance décennale mention, autoliquidation sous-traitance",
  alternates: { canonical: "/btp-artisans" },
  openGraph: {
    title: TITRE,
    description: DESCRIPTION,
    url: `${SITE_URL}/btp-artisans`,
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
    name: "Newbi pour les artisans du bâtiment",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, iOS, Android",
    inLanguage: "fr-FR",
    url: `${SITE_URL}/btp-artisans`,
    description: DESCRIPTION,
    featureList: [
      "Devis de chantier détaillés, convertibles en facture",
      "Factures d'acompte et factures de situation",
      "Avancement global ou ligne par ligne",
      "Retenue de garantie appliquée en pourcentage",
      "Taux de TVA choisi ligne par ligne",
      "Champs personnalisés pour vos mentions de chantier",
      "Signature électronique des devis",
      "Facturation électronique incluse",
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
        item: `${SITE_URL}/btp-artisans`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "BTP et artisans",
        item: `${SITE_URL}/btp-artisans`,
      },
    ],
  },
];

// Contenu du hero. Les trois cartes posées sur la photo remplacent le bandeau
// d'arguments qui suivait : il aurait répété la même chose juste en dessous.
const HERO = {
  titre: "Du devis de chantier à la dernière situation",
  chapo: (
    <>
      Devis, acomptes, factures de situation et retenue de garantie :{" "}
      <strong className="font-medium text-gray-900">
        trois types de document pour un seul marché
      </strong>
      , avec la numérotation qui suit. Depuis le camion comme depuis le bureau.
    </>
  ),
  image: "/lp/metiers/btp-hero.jpg",
  imageAlt: "Un artisan découpe un carreau sur un chantier de rénovation",
  cartes: [
    {
      icon: FileSignature,
      titre: "Devis signé en ligne",
      texte: "Converti en facture sans ressaisie",
    },
    {
      icon: Layers,
      titre: "Factures de situation",
      texte: "Avancement global ou ligne par ligne",
    },
    {
      icon: ShieldCheck,
      titre: "Retenue de garantie",
      texte: "Le pourcentage retranché du net à payer",
    },
  ],
};

// Trois cartes hautes, sur le composant des LP Ads.
const ESSENTIELS = [
  {
    title: "Le devis, là où se joue le chantier",
    intro:
      "Un devis de travaux engage sur le détail : postes, quantités, prix unitaires et conditions. C'est aussi le document que votre client compare.",
    points: [
      "Lignes détaillées, quantités et prix unitaires",
      "Vos mentions d'assurance et l'adresse du chantier en champs personnalisés",
      "Signature électronique, puis conversion en facture",
    ],
    visual: (
      <VisuelListe
        className={SHEET_ESSENTIEL}
        titre="Devis de travaux"
        lignes={[
          "Lignes, quantités et prix unitaires",
          "Adresse du chantier en champ personnalisé",
          "Signature électronique",
        ]}
        chip="Converti en facture"
      />
    ),
  },
  {
    title: "L'acompte, puis le solde",
    intro:
      "Un acompte à la commande sécurise l'achat des matériaux, le solde se facture à la réception. Entre les deux, les situations prennent le relais.",
    points: [
      "Facture d'acompte, montant fixé à la commande",
      "Numérotation continue, un numéro par document",
      "Solde émis une fois le chantier réceptionné",
    ],
    visual: (
      <VisuelRepartition
        className={SHEET_ESSENTIEL}
        titre="Chantier Dupont"
        total="18 400,00 €"
        parts={[
          { label: "Acompte", valeur: "5 520,00 €", part: 30 },
          { label: "Situations", valeur: "9 200,00 €", part: 50 },
          { label: "Solde", valeur: "3 680,00 €", part: 20 },
        ]}
      />
    ),
  },
  {
    title: "Vos achats de matériaux, rangés",
    intro:
      "Les tickets de fournitures s'accumulent dans le camion. Photographiez-les : ils sont lus, classés et rattachés à leur dépense.",
    points: [
      "Lecture automatique des factures d'achat",
      "Rapprochement avec votre compte bancaire",
      "Justificatifs conservés dix ans, accès comptable inclus",
    ],
    visual: (
      <VisuelPhoto
        src="/lp/metiers/btp-essentiel.jpg"
        alt="Un artisan choisit ses fournitures chez son marchand de matériaux"
        className={`${SHEET_ESSENTIEL} top-0`}
        placements={["left-3 top-4", "right-3 bottom-14"]}
        cartes={[
          {
            icon: ScanLine,
            titre: "Ticket photographié",
            texte: "Lu et classé",
          },
          {
            icon: Landmark,
            titre: "Rapproché en banque",
            texte: "Sur la bonne ligne",
          },
        ]}
      />
    ),
  },
];

const ETAPES = [
  {
    when: "Sur le chantier",
    title: "Vous chiffrez pendant la visite",
    desc: "Postes, quantités, prix unitaires : le devis se rédige depuis le téléphone, sur votre modèle et vos champs personnalisés. Le client le signe avant que vous ne soyez reparti.",
    aside: "Devis signé en ligne",
  },
  {
    when: "Pendant les travaux",
    title: "Vous facturez l'avancement",
    desc: "Une facture d'acompte à la commande, puis une facture de situation à chaque étape : vous entrez l'avancement, Newbi en déduit le montant de la période. La retenue de garantie est retranchée du net à payer.",
    aside: "Situations et retenue suivies",
  },
  {
    when: "À la réception",
    title: "Vous soldez et vous archivez",
    desc: "Solde facturé, retenue encore immobilisée identifiée, pièces du chantier rangées au même endroit. Votre comptable y accède sans que vous ayez à lui envoyer quoi que ce soit.",
    aside: "Dossier de chantier complet",
  },
];

export default function BtpArtisansPage() {
  return (
    <div className={`${poppins.variable} font-poppins`}>
      <JsonLd data={jsonLd} />
      <NewHeroNavbar />
      <StatutHero {...HERO} />
      <TrustedBySection variant="default" />
      <CorpsDeMetierSection />
      <SituationSection />
      <LpSteps
        title="Un chantier, de la visite à la réception"
        intro="Le même dossier suit le chantier du premier métré au décompte définitif."
        steps={ETAPES}
        variant="dark"
        maxWidth="max-w-7xl"
      />
      <LpEssentials
        title="Ce qui change quand on facture des travaux"
        items={ESSENTIELS}
        maxWidth="max-w-7xl"
        visualMinHeight="min-h-[210px] md:min-h-[240px]"
      />
      <LpFinalCta
        title={
          <>
            Votre prochain devis
            <br className="hidden md:block" /> part du chantier
          </>
        }
        subtitle="Créez votre compte, renseignez votre assurance décennale et chiffrez votre première visite. 30 jours pour tester, sans carte bancaire."
        image="/lp/facturation-electronique/cta-laptop.jpg"
        imageAlt="Un artisan consulte ses devis dans Newbi sur son ordinateur portable"
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
      <BlogFurtherReading product="btp-artisans" />
    </div>
  );
}
