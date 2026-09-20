import {} from // InvoiceListVisual,
// FormatVisual,
// LifecycleVisual,
// InboxVisual,
// ArchiveVisual,
// WhatsappVisual,
"../_components/LpVisuals";
import LpShell from "../_components/LpShell";
// import LpHero from "../_components/LpHero";
import HeroSection from "./section/hero-section";
import FeatureBento from "./section/FeatureBento";
import ConcernedChecker from "./section/ConcernedChecker";
// import LpTrustBar from "../_components/LpTrustBar";
import LpTrustFeatures from "../_components/LpTrustFeatures";
import { Euro, Archive, Star, MessageCircle, ShieldCheck } from "lucide-react";
// import LpBenefits from "../_components/LpBenefits";
import LpEssentials from "../_components/LpEssentials";
import {
  LawVisual,
  AutomationVisual,
  StartVisual,
} from "./section/EssentialsVisuals";
import LpSteps from "../_components/LpSteps";
import LpTestimonials from "../_components/LpTestimonials";
import HomePricingSection from "@/app/(main)/new/lp-home/HomePricingSection";
import LpFaq, { buildFaqJsonLd } from "../_components/LpFaq";
import LpFinalCta from "../_components/LpFinalCta";
import { FacturationBanner } from "@/app/produits/factures/section/FacturationBanner";

// Landing page Google Ads — intention « facturation électronique / réforme 2026 ».
// noindex : page réservée au trafic payant, pour ne pas concurrencer
// /produits/facturation-electronique dans l'index.
export const metadata = {
  title: {
    absolute: "Logiciel de facturation électronique compatible 2026 | Newbi",
  },
  description:
    "Émets, reçois et archive tes factures électroniques au format Factur-X, UBL ou CII. Compatible avec la réforme 2026, inclus sans surcoût. 30 jours gratuits, sans carte bancaire.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/produits/facturation-electronique" },
};

// Ancien bandeau de réassurance (5 points), remplacé par TRUST_FEATURES.
// const TRUST = [
//   "Formats Factur-X, UBL, CII",
//   "Archivage légal 10 ans inclus",
//   "Transmission via plateforme agréée",
//   "Sans surcoût, dans toutes les formules",
//   "Support humain sur WhatsApp",
// ];

// 3 arguments clés sous le hero : prix, conformité, archivage.
const TRUST_FEATURES = [
  {
    icon: <Euro size={26} strokeWidth={1.75} />,
    title: "Inclus, sans surcoût",
    desc: "Dans toutes les formules Newbi, sans frais par facture.",
  },
  {
    icon: (
      <img
        src="/logo_Compatible_Facturation_electronique-footer.png"
        alt="Solution compatible facturation électronique"
        className="h-16 w-auto object-contain"
      />
    ),
    plain: true,
    title: "100 % conforme",
    desc: "Formats Factur-X, UBL, CII et transmission via plateforme agréée.",
  },
  {
    icon: <Archive size={26} strokeWidth={1.75} />,
    title: "Archivage légal 10 ans",
    desc: "Chaque facture est conservée et traçable pendant la durée légale.",
  },
];

// Ancien bento de 6 bénéfices, remplacé par ESSENTIALS (même contenu, 3 cartes).
// const BENEFITS = [
//   {
//     title: "Tu factures comme avant. Le format, c'est notre affaire.",
//     desc: "Même écran, mêmes clients, même bouton « Nouvelle facture ». Derrière, Newbi produit le fichier structuré et le transmet à la bonne plateforme.",
//     visual: <InvoiceListVisual einvoicing />,
//     wide: true,
//   },
//   {
//     title: "Factur-X, UBL, CII : tu n'as pas à choisir",
//     desc: "Newbi génère le format attendu par la plateforme de ton client. Tu n'entendras plus jamais parler de ces sigles.",
//     visual: <FormatVisual />,
//   },
//   {
//     title: "Tu sais où en est chaque facture, sans appeler",
//     desc: "Déposée, transmise, reçue, acceptée, payée : le statut avance sous tes yeux. Plus de « vous l'avez bien reçue ? ».",
//     visual: <LifecycleVisual />,
//     wide: true,
//   },
//   {
//     title: "Les factures de tes fournisseurs se rangent seules",
//     desc: "Elles arrivent directement dans Newbi, classées en dépenses, prêtes pour ta TVA et ton comptable.",
//     visual: <InboxVisual />,
//   },
//   {
//     title: "Dix ans d'archives, zéro classeur",
//     desc: "Chaque facture est conservée pendant la durée légale, avec sa traçabilité. Si le fisc demande, tu exportes.",
//     visual: <ArchiveVisual />,
//   },
//   {
//     title: "Une question ? Un humain répond, sur WhatsApp",
//     desc: "Pas de ticket, pas de robot. L'équipe Newbi t'explique un statut ou une règle de la réforme en langage normal.",
//     visual: <WhatsappVisual />,
//   },
// ];

// Section « l'essentiel » : 3 cartes qui reprennent tout le contenu de
// l'ancien bento (formats, statuts, réception fournisseurs, archivage,
// support), réorganisé en « ce qui change / ce que Newbi fait / comment
// te préparer ».
const ESSENTIALS = [
  {
    title: "Ce que la loi te demande",
    intro:
      "Dès le 1er septembre 2026, tes factures passent par une plateforme agréée par l'État, dans un format structuré (Factur-X, UBL, CII), avec suivi et archivage 10 ans.",
    points: [
      "Réception : toutes les entreprises dès 2026",
      "Émission : TPE, PME et micro-entreprises en 2027",
    ],
    visual: <LawVisual />,
  },
  {
    title: "Ce que Newbi fait à ta place",
    intro:
      "Tu factures comme avant. Newbi génère le bon format, le transmet et gère le reste.",
    points: [
      "Statut de chaque facture en direct",
      "Factures fournisseurs classées en dépenses",
      "Archivage légal 10 ans, exportable",
    ],
    visual: <AutomationVisual />,
  },
  {
    title: "Par où commencer ?",
    intro:
      "Crée ton compte, ton SIRET pré-remplit le reste : première facture électronique dans la matinée.",
    points: [
      "Inclus dans toutes les formules, sans surcoût",
      "30 jours offerts, sans carte bancaire",
      "Un humain répond sur WhatsApp",
    ],
    visual: <StartVisual />,
  },
];

const STEPS = [
  {
    when: "Aujourd'hui, 9h",
    title: "Tu crées ton compte, ton SIRET fait le reste",
    desc: "Email ou Google, sans carte bancaire. Les informations légales de ton entreprise sont pré-remplies, tes modèles de facture sont prêts.",
    aside: "Compte prêt en 2 minutes",
  },
  {
    when: "9h12",
    title: "Ta première facture électronique est partie",
    desc: "Tu la crées comme d'habitude. Newbi génère le format, la transmet et te montre son statut en direct. C'était ça, la réforme.",
    aside: "Statut : Transmise",
  },
  {
    when: "Chaque mois, ensuite",
    title: "Ton comptable retrouve tout, déjà archivé",
    desc: "Factures émises, factures reçues, justificatifs : dans son accès gratuit, exportables. Toi, tu n'as rien envoyé.",
    aside: "Archivé 10 ans, automatiquement",
  },
];

// Cartes de réassurance sous les témoignages.
const PROOFS = [
  {
    avatar: "/lp/factures/41682668-4F07-4D9F-B672-DC469853793A.PNG",
    icon: <Star size={22} strokeWidth={1.75} />,
    title: "+ 140 indépendants",
    desc: "facturent déjà avec Newbi, prêts pour la facturation électronique.",
  },
  {
    avatar: "/lp/about/about-11.jpeg",
    icon: <MessageCircle size={22} strokeWidth={1.75} />,
    title: "Un humain sur WhatsApp",
    desc: "Une question sur la réforme ? L'équipe répond en langage normal, pas de robot.",
  },
  {
    avatar: "/lp/about/about-4.jpeg",
    icon: <ShieldCheck size={22} strokeWidth={1.75} />,
    title: "Tes données protégées",
    desc: "Hébergées en Europe, jamais revendues ni partagées. Archivées 10 ans.",
  },
];

const FAQ = [
  {
    id: "fe-1",
    title: "Suis-je vraiment concerné par la facturation électronique ?",
    content:
      "Oui, dès que tu es assujetti à la TVA en France (même en franchise). Depuis le 1er septembre 2026, toutes les entreprises doivent pouvoir recevoir des factures électroniques. L'obligation d'émission s'applique aux grandes entreprises et ETI depuis cette date, et s'étend aux PME, TPE et micro-entreprises au 1er septembre 2027.",
  },
  {
    id: "fe-2",
    title: "Qu'est-ce qui change concrètement par rapport à un PDF ?",
    content:
      "Une facture électronique n'est pas un simple PDF envoyé par email : c'est un fichier structuré (Factur-X, UBL ou CII) transmis via une plateforme agréée, avec un suivi de statuts. Avec Newbi, tu continues à créer tes factures normalement ; le format et la transmission sont gérés automatiquement.",
  },
  {
    id: "fe-3",
    title: "Dois-je changer de logiciel ou ajouter un module payant ?",
    content:
      "Non. La facturation électronique est incluse dans toutes les formules Newbi, sans frais par facture. Tu crées tes devis, factures et avoirs au même endroit, et l'archivage légal est compris.",
  },
  {
    id: "fe-4",
    title: "Que se passe-t-il pendant l'essai gratuit ?",
    content:
      "Tu as accès à toutes les fonctionnalités pendant 30 jours, sans carte bancaire. Tu peux émettre de vraies factures électroniques dès le premier jour. À la fin de l'essai, tu choisis ta formule ; si tu ne fais rien, rien n'est prélevé.",
  },
  {
    id: "fe-5",
    title: "Mon expert-comptable peut-il récupérer mes factures ?",
    content:
      "Oui, gratuitement : chaque formule inclut au moins un accès comptable. Ton expert-comptable retrouve factures, dépenses et justificatifs dans Newbi, et tu peux exporter en CSV, Excel ou FEC selon ta formule.",
  },
  {
    id: "fe-6",
    title: "Et si j'ai déjà des factures dans un autre outil ?",
    content:
      "Tu importes tes clients et ton catalogue, puis tu repars sur Newbi pour les nouvelles factures. L'équipe t'accompagne sur WhatsApp si tu veux un coup de main pour la transition.",
  },
];

export default function LpFacturationElectronique() {
  return (
    <LpShell
      navbar="full"
      footer="full"
      banner={
        <FacturationBanner
          text={
            <>
              Passez à la facturation électronique avec Newbi :{" "}
              <span className="font-medium text-[#5A50FF] underline decoration-[#5A50FF] decoration-1 underline-offset-4">
                c’est simple et gratuit
              </span>
            </>
          }
          ctaHref={null}
          centered
        />
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildFaqJsonLd(FAQ)),
        }}
      />
      {/* Hero en refonte : seul le H1 est affiché, le reste des props est
          conservé pour réactiver les blocs dans section/hero-section.jsx */}
      <HeroSection
        // eyebrow="Compatible avec la réforme 2026"
        title="Logiciel de facturation électronique, prêt pour la réforme."
        // accent="prêt pour la réforme"
        // titleEnd="."
        subtitle={
          <>
            Émets, reçois et archive tes factures électroniques au bon format,{" "}
            <strong className="font-medium text-gray-900">
              sans changer ta façon de travailler
            </strong>
            . Inclus dans Newbi, sans surcoût.
          </>
        }
        // proof={
        //   <>
        //     <span className="text-gray-900 font-medium">
        //       + 140 indépendants
        //     </span>
        //     <span className="mx-2 text-gray-300">·</span>+ 12 000 factures
        //     émises
        //   </>
        // }
        // image="/lp/factures/facture1.png"
        // mobileImage="/mockup-iphone-factures-clients.png"
        // mobileImageAlt="Application mobile Newbi : factures et clients"
        // imageAlt="Interface Newbi : liste de factures avec statuts de facturation électronique"
        // badge={
        //   <img
        //     src="/logo_Compatible_Facturation_electronique-footer.png"
        //     alt="Compatible facturation électronique 2026"
        //     className="h-12 w-auto object-contain"
        //   />
        // }
      />
      {/* <LpTrustBar items={TRUST} /> */}
      <LpTrustFeatures items={TRUST_FEATURES} />
      {/* <LpBenefits
        eyebrow="Facturation électronique"
        title="Ce que la réforme te demande. Ce que Newbi fait à ta place."
        subtitle="Pas de module à acheter, pas de prestataire en plus. L'émission, la réception, le suivi et l'archivage sont déjà dans ton outil de facturation."
        items={BENEFITS}
      /> */}
      <LpEssentials title="La réforme 2026, en clair" items={ESSENTIALS} />
      <ConcernedChecker />
      <LpSteps
        title="Ta première facture électronique, ce matin"
        intro="Pas de migration, pas de formation. Voilà comment ça se passe vraiment."
        steps={STEPS}
        ctaLabel="Essayer gratuitement"
      />
      <FeatureBento />
      <LpTestimonials
        title="Ils ont passé le cap, sans stress"
        proofs={PROOFS}
      />
      {/* Mêmes cartes de prix que la home */}
      <HomePricingSection />
      <LpFinalCta
        title={
          <>
            Passe à la facturation
            <br className="hidden md:block" /> électronique sans stress
          </>
        }
        subtitle="Crée ton compte, envoie ta première facture électronique aujourd'hui. Tu as 30 jours pour tester, sans carte bancaire."
        image="/lp/facturation-electronique/cta-laptop.jpg"
        imageAlt="Un indépendant consulte ses factures clients dans Newbi sur son ordinateur portable"
      />
      <LpFaq items={FAQ} />
    </LpShell>
  );
}
