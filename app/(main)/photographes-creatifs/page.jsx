import React from "react";
import { Poppins } from "next/font/google";
import {
  CreditCard,
  Droplets,
  FileSignature,
  Percent,
  ScanLine,
} from "lucide-react";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import { SHEET_ESSENTIEL } from "@/src/lib/lp-visuels";
import {
  VisuelFiche,
  VisuelListe,
  VisuelPhoto,
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
import MetiersSection from "./section/MetiersSection";
import LivraisonSection from "./section/LivraisonSection";
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

const TITRE = "Logiciel de facturation pour photographes | Newbi";
const DESCRIPTION =
  "Prestation à 20 % et cession de droits à 10 % sur la même facture, et livraison des fichiers par lien avec filigrane, paiement avant téléchargement et expiration. 30 jours offerts.";

export const metadata = {
  title: { absolute: TITRE },
  description: DESCRIPTION,
  keywords:
    "logiciel facturation photographe, cession de droits d'auteur TVA 10, facture graphiste freelance, transfert de fichiers filigrane, paiement avant téléchargement, livraison client vidéaste",
  alternates: { canonical: "/photographes-creatifs" },
  openGraph: {
    title: TITRE,
    description: DESCRIPTION,
    url: `${SITE_URL}/photographes-creatifs`,
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

// Mêmes partis pris que les autres pages : pas d'aggregateRating inventé, le
// prix vient de plans-display.js, et la liste ne contient que des
// fonctionnalités vérifiées dans le modèle de données.
const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Newbi pour les photographes et les créatifs",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, iOS, Android",
    inLanguage: "fr-FR",
    url: `${SITE_URL}/photographes-creatifs`,
    description: DESCRIPTION,
    featureList: [
      "Taux de TVA choisi ligne par ligne, prestation et cession de droits",
      "Mention d'exonération exigée dès qu'une ligne est à 0 %",
      "Factures d'acompte avant la prestation",
      "Transfert de fichiers jusqu'à 50 Go selon la formule",
      "Filigrane sur les images, téléchargement bloqué",
      "Paiement exigé avant le téléchargement",
      "Lien protégé par mot de passe et daté d'expiration",
      "Rappel automatique avant l'expiration du lien",
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
        item: `${SITE_URL}/photographes-creatifs`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Photographes et créatifs",
        item: `${SITE_URL}/photographes-creatifs`,
      },
    ],
  },
];

const HERO = {
  titre: "Livrez vos fichiers, encaissez à la livraison",
  chapo: (
    <>
      Les épreuves partent en filigrane, les originaux{" "}
      <strong className="font-medium text-gray-900">
        ne se téléchargent qu&apos;une fois le règlement effectué
      </strong>
      . Et sur la facture, la prestation et la cession de droits restent deux
      lignes distinctes.
    </>
  ),
  image: "/lp/metiers/creatif-hero.jpg",
  imageAlt:
    "Le bureau d'un créatif avec son appareil photo, ses objectifs et ses écrans",
  cartes: [
    {
      icon: Droplets,
      titre: "Filigrane",
      texte: "Le client voit, il ne télécharge pas",
    },
    {
      icon: CreditCard,
      titre: "Paiement d'abord",
      texte: "Le lien s'ouvre une fois réglé",
    },
    {
      icon: Percent,
      titre: "20 % et 10 %",
      texte: "Prestation et cession sur deux lignes",
    },
  ],
};

const ETAPES = [
  {
    when: "Avant la prestation",
    title: "L'acompte sécurise la date",
    desc: "Une facture d'acompte prend sa place dans votre numérotation continue. Le reste du devis attend la livraison.",
    aside: "Facture d'acompte émise",
  },
  {
    when: "À la sélection",
    title: "Les épreuves partent en filigrane",
    desc: "Le client reçoit un lien, parcourt la sélection, choisit — mais ne repart avec rien. Le transfert expire à la date que vous avez fixée.",
    aside: "Téléchargement bloqué",
  },
  {
    when: "À la livraison",
    title: "Le règlement ouvre les fichiers",
    desc: "Vous fixez le montant sur le transfert des originaux : le lien ne libère les fichiers qu'une fois payé. La facture finale sépare la prise de vue de la cession de droits.",
    aside: "Paiement avant téléchargement",
  },
];

const ESSENTIELS = [
  {
    title: "Deux lignes, deux taux",
    intro:
      "La prise de vue est une prestation de service, la cession de droits d'auteur relève du taux réduit. Les confondre sur une ligne unique vous expose.",
    points: [
      "Prestation à 20 %, cession à 10 % sur le même document",
      "Durée, territoire, supports et exclusivité dans la description",
      "Mention d'exonération exigée si une ligne passe à 0 %",
    ],
    visual: (
      <VisuelFiche
        className={SHEET_ESSENTIEL}
        titre="Facture F-2026-0142"
        lignes={[
          { cle: "Prise de vue", valeur: "TVA 20 %" },
          { cle: "Cession de droits", valeur: "TVA 10 %" },
        ]}
        chip="Deux taux, un seul document"
      />
    ),
  },
  {
    title: "Des fichiers qui ne vous échappent pas",
    intro:
      "Un lien WeTransfer qui traîne, c'est un reportage qui circule. Le transfert de Newbi vous laisse la main sur ce qui sort du studio.",
    points: [
      "Jusqu'à 50 Go par transfert selon votre formule",
      "Mot de passe, destinataire nommé et date d'expiration",
      "Rappel automatique avant que le lien ne se ferme",
    ],
    visual: (
      <VisuelListe
        className={SHEET_ESSENTIEL}
        titre="Transfert protégé"
        lignes={["Mot de passe", "Destinataire nommé", "Date d'expiration"]}
        chip="Jusqu'à 50 Go selon la formule"
      />
    ),
  },
  {
    title: "Le reste de l'activité suit",
    intro:
      "Les devis, les relances et les dépenses de matériel vivent au même endroit que vos livraisons.",
    points: [
      "Devis signés en ligne, convertis en facture",
      "Relances automatiques sur les factures en retard",
      "Justificatifs d'achat photographiés et rattachés",
    ],
    visual: (
      <VisuelPhoto
        src="/lp/metiers/creatif-essentiel.jpg"
        alt="Une série photo en cours de sélection sur un ordinateur portable"
        className={`${SHEET_ESSENTIEL} top-0`}
        placements={["left-3 top-4", "right-3 bottom-14"]}
        cartes={[
          {
            icon: FileSignature,
            titre: "Devis signé en ligne",
            texte: "Converti en facture",
          },
          {
            icon: ScanLine,
            titre: "Justificatif photographié",
            texte: "Rattaché à la dépense",
          },
        ]}
      />
    ),
  },
];

export default function PhotographesCreatifsPage() {
  return (
    <div className={`${poppins.variable} font-poppins`}>
      <JsonLd data={jsonLd} />
      <NewHeroNavbar />
      <StatutHero {...HERO} />
      <TrustedBySection variant="default" />
      <MetiersSection />
      <LivraisonSection />
      <LpSteps
        title="D'un acompte à la livraison des originaux"
        intro="Le même espace suit la commande de la réservation au règlement final."
        steps={ETAPES}
        variant="dark"
        maxWidth="max-w-7xl"
      />
      <LpEssentials
        title="Ce qui change quand on vend des images"
        items={ESSENTIELS}
        maxWidth="max-w-7xl"
        visualMinHeight="min-h-[210px] md:min-h-[240px]"
      />
      <LpFinalCta
        title={
          <>
            Votre prochaine livraison
            <br className="hidden md:block" /> payée avant d&apos;être ouverte
          </>
        }
        subtitle="Créez votre compte, préparez votre premier transfert avec filigrane et fixez son montant. 30 jours pour tester, sans carte bancaire."
        image="/lp/facturation-electronique/cta-laptop.jpg"
        imageAlt="Un photographe consulte ses transferts dans Newbi sur son ordinateur portable"
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
      <BlogFurtherReading product="photographes-creatifs" />
    </div>
  );
}
