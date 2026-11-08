import React from "react";
import { Poppins } from "next/font/google";
import { FolderOpen, Receipt, UserPlus } from "lucide-react";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import { SHEET_ESSENTIEL } from "@/src/lib/lp-visuels";
import { VisuelFiche, VisuelListe } from "@/src/components/lp/visuels";
import HomePricingSection from "@/app/(main)/new/lp-home/HomePricingSection";
import LpEssentials from "@/app/lp/_components/LpEssentials";
import LpSteps from "@/app/lp/_components/LpSteps";
import LpFinalCta from "@/app/lp/_components/LpFinalCta";
import { BlogFurtherReading } from "@/src/components/blog/blog-further-reading";
import { JsonLd } from "@/src/components/seo/json-ld";
import StatutHero from "@/app/(main)/_statuts/StatutHero";
import FAQ from "./section/faq";
import { SITE_URL } from "@/src/lib/site";

// Même configuration de police que les autres LP.
const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

const TITRE =
  "Newbi pour les experts-comptables | Suivez la facturation de vos clients";
const DESCRIPTION =
  "Un espace cabinet qui réunit les factures, devis et bons de commande de tous vos clients, retards compris. Vous créez leurs comptes, ils facturent, vous suivez.";

export const metadata = {
  title: { absolute: TITRE },
  description: DESCRIPTION,
  keywords:
    "logiciel expert-comptable, logiciel cabinet comptable, outil collaboratif expert-comptable, facturation clients cabinet comptable, espace cabinet, portefeuille clients",
  alternates: { canonical: "/experts-comptables" },
  openGraph: {
    title: TITRE,
    description: DESCRIPTION,
    url: `${SITE_URL}/experts-comptables`,
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

// L'espace cabinet s'ouvre sur demande : Newbi le rattache au compte du
// cabinet. Tous les boutons de la page mènent donc au formulaire de contact,
// sujet prérempli, et non à l'inscription.
const CTA_CABINET = {
  href: "/contact?sujet=espace-cabinet",
  label: "Demander un espace cabinet",
};

// Pas de prix ni d'offre dans les données structurées : l'espace cabinet n'a
// pas de tarif public. La liste ne reprend que ce que fait l'espace
// gestionnaire en prod (app/dashboard/gestionnaire).
const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Newbi pour les experts-comptables",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: "fr-FR",
    url: `${SITE_URL}/experts-comptables`,
    description: DESCRIPTION,
    featureList: [
      "Espace cabinet qui réunit les documents de tous les clients suivis",
      "Factures, devis, bons de commande, bons de livraison et avoirs par client",
      "Factures en retard repérées d'un coup d'œil",
      "Création des comptes clients par le cabinet, SIRET vérifié",
      "Invitation d'un client déjà inscrit sur Newbi",
      "Abonnement payé par le client ou pris en charge par le cabinet",
      "Cabinet membre de l'espace client sans place d'utilisateur facturée",
    ],
    softwareHelp: "https://docs.newbi.fr/",
    publisher: { "@type": "Organization", name: "Newbi", url: SITE_URL },
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
        item: `${SITE_URL}/experts-comptables`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Experts-comptables",
        item: `${SITE_URL}/experts-comptables`,
      },
    ],
  },
];

const HERO = {
  titre: "La facturation de vos clients, suivie depuis le cabinet",
  chapo: (
    <>
      Vos clients éditent leurs factures et leurs devis dans Newbi.{" "}
      <strong className="font-medium text-gray-900">
        Vous retrouvez tous leurs documents dans un seul espace
      </strong>
      , sans attendre qu'on vous les envoie en fin de mois.
    </>
  ),
  image: "/lp/metiers/avocat-essentiel.jpg",
  imageAlt: "Deux professionnels revoient un dossier chiffré sur un ordinateur",
  cartes: [
    {
      icon: FolderOpen,
      titre: "Tous vos dossiers",
      texte: "Un seul espace cabinet",
    },
    {
      icon: Receipt,
      titre: "Retards repérés",
      texte: "Échéance dépassée, signalée",
    },
    {
      icon: UserPlus,
      titre: "Comptes créés par vous",
      texte: "SIRET vérifié à la création",
    },
  ],
  cta: CTA_CABINET,
};

const ETAPES = [
  {
    when: "Au démarrage",
    title: "Nous ouvrons votre espace cabinet",
    desc: "Vous créez votre compte Newbi, puis vous nous écrivez : nous y rattachons l'espace cabinet. Il s'ajoute à votre compte, sans nouvel identifiant.",
    aside: "Espace cabinet ouvert",
  },
  {
    when: "Pour chaque client",
    title: "Vous créez son compte, ou vous l'invitez",
    desc: "Un nouveau client se crée avec son SIRET, vérifié au passage, et reçoit un e-mail pour choisir son mot de passe. Un client déjà sur Newbi reçoit une invitation et choisit les espaces que vous suivrez.",
    aside: "Client rattaché au cabinet",
  },
  {
    when: "Au quotidien",
    title: "Vous suivez tout depuis un seul endroit",
    desc: "Factures, devis, bons de commande, bons de livraison et avoirs de chaque client, avec les factures en retard mises en évidence. Un clic ouvre le document dans l'espace du client.",
    aside: "Documents à jour",
  },
];

const ESSENTIELS = [
  {
    title: "Un seul espace pour tout le portefeuille",
    intro:
      "Plus besoin de passer d'un dossier à l'autre pour savoir où en est un client : ses documents vous attendent, classés par type.",
    points: [
      "Factures, devis, bons de commande, bons de livraison et avoirs",
      "Factures en retard : en attente avec une échéance dépassée",
      "Ouverture du document dans l'espace du client, en un clic",
    ],
    visual: (
      <VisuelListe
        className={SHEET_ESSENTIEL}
        titre="Espace cabinet"
        lignes={[
          "Factures clients de tous les dossiers",
          "Devis et bons de commande",
          "Bons de livraison et avoirs",
        ]}
        chip="Retards mis en évidence"
      />
    ),
  },
  {
    title: "Qui paie l'abonnement : à vous de choisir",
    intro:
      "Chaque client démarre avec 30 jours d'essai. Ensuite, l'abonnement est réglé par le client, ou par le cabinet s'il préfère l'inclure dans sa mission.",
    points: [
      "Par défaut, chaque client paie son propre abonnement",
      "Abonnement pris en charge par le cabinet, espace par espace",
      "Prise en charge possible en cours de route, client prévenu",
    ],
    visual: (
      <VisuelFiche
        className={SHEET_ESSENTIEL}
        titre="Abonnement d'un espace client"
        lignes={[
          { cle: "Essai", valeur: "30 jours" },
          { cle: "Payeur par défaut", valeur: "Le client" },
          { cle: "Option", valeur: "Le cabinet" },
        ]}
        chip="Choix espace par espace"
      />
    ),
  },
  {
    title: "Le client garde la main sur son espace",
    intro:
      "Le cabinet rejoint l'espace du client avec le rôle comptable. Le client reste propriétaire de ses données et de ses réglages.",
    points: [
      "Rôle comptable dans chaque espace suivi",
      "Le cabinet n'occupe pas de place d'utilisateur facturée",
      "Exports CSV, Excel ou FEC selon la formule du client",
    ],
    visual: (
      <VisuelListe
        className={SHEET_ESSENTIEL}
        titre="Espace du client"
        lignes={[
          "Propriétaire : le client",
          "Cabinet : rôle comptable",
          "Exports pour la tenue comptable",
        ]}
        chip="Données du client"
      />
    ),
  },
];

export default function ExpertsComptablesPage() {
  return (
    <div className={`${poppins.variable} font-poppins`}>
      <JsonLd data={jsonLd} />
      <NewHeroNavbar />
      <StatutHero {...HERO} />
      <LpSteps
        title="Votre portefeuille dans Newbi, en trois temps"
        intro="L'espace cabinet s'ajoute à votre compte. Vos clients gardent le leur."
        steps={ETAPES}
        variant="dark"
        maxWidth="max-w-7xl"
      />
      <LpEssentials
        title="Ce que l'espace cabinet change pour vous"
        items={ESSENTIELS}
        maxWidth="max-w-7xl"
        visualMinHeight="min-h-[210px] md:min-h-[240px]"
      />
      <LpFinalCta
        title={
          <>
            Vos clients facturent,
            <br className="hidden md:block" /> vous suivez
          </>
        }
        subtitle="Écrivez-nous depuis le formulaire de contact : nous ouvrons votre espace cabinet sur votre compte Newbi et vous pouvez créer vos premiers clients dans la foulée."
        image="/lp/facturation-electronique/cta-laptop.jpg"
        imageAlt="Une professionnelle consulte des factures sur son ordinateur portable"
        maxWidth="max-w-7xl"
        className="pt-10 md:pt-20 lg:pt-22 pb-0 md:pb-0"
        cta={{
          ...CTA_CABINET,
          note: "Réponse par e-mail · vos clients démarrent avec 30 jours d'essai",
        }}
      />
      <HomePricingSection
        maxWidth="max-w-7xl"
        className="pt-10 md:pt-20 lg:pt-22 pb-0"
      />
      <FAQ />
      <BlogFurtherReading product="experts-comptables" />
    </div>
  );
}
