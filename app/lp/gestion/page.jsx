// import {
//   InvoiceListVisual,
//   ReminderVisual,
//   ReceiptScanVisual,
//   BankMatchVisual,
//   TeamVisual,
// } from "../_components/LpVisuals";
import LpShell from "../_components/LpShell";
// import LpHero from "../_components/LpHero";
import HeroSection from "./section/hero-section";
// import LpTrustBar from "../_components/LpTrustBar";
import LpTrustFeatures from "../_components/LpTrustFeatures";
import {
  FileText,
  Landmark,
  Users,
  Star,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
// import LpBenefits from "../_components/LpBenefits";
import BenefitsBento from "./section/BenefitsBento";
import LpSteps from "../_components/LpSteps";
import LpTestimonials from "../_components/LpTestimonials";
import HomePricingSection from "@/app/(main)/new/lp-home/HomePricingSection";
import LpFaq, { buildFaqJsonLd } from "../_components/LpFaq";
import LpFinalCta from "../_components/LpFinalCta";
import { FacturationBanner } from "@/app/produits/factures/section/FacturationBanner";

// Landing page Google Ads — intention « logiciel de gestion / facturation pour
// indépendants et petites équipes ». noindex : réservée au trafic payant.
export const metadata = {
  title: {
    absolute: "Logiciel de gestion simple pour indépendants et TPE | Newbi",
  },
  description:
    "Devis, factures, clients, reçus et banque au même endroit. Newbi simplifie la gestion des indépendants et petites équipes. 30 jours gratuits, sans carte bancaire.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/" },
};

// Ancien bandeau 5 puces, remplacé par TRUST_FEATURES (même contenu, en
// colonnes icône / titre / phrase, comme sur /lp/facturation-electronique).
// const TRUST = [
//   "Devis & factures illimités",
//   "Banque connectée",
//   "Reçus scannés automatiquement",
//   "Accès comptable gratuit",
//   "Compatible facturation électronique 2026",
// ];

const TRUST_FEATURES = [
  {
    icon: <FileText size={26} strokeWidth={1.75} />,
    title: "Devis & factures illimités",
    desc: "Compatible facturation électronique 2026, inclus dans toutes les formules.",
  },
  {
    icon: <Landmark size={26} strokeWidth={1.75} />,
    title: "Banque connectée, reçus scannés",
    desc: "Chaque paiement trouve sa facture, chaque ticket devient une dépense classée.",
  },
  {
    icon: <Users size={26} strokeWidth={1.75} />,
    title: "Accès comptable gratuit",
    desc: "Ton expert-comptable retrouve tout, exportable. Tu n'envoies plus rien.",
  },
];

// Les 5 bénéfices, affichés dans BenefitsBento (les visuels y sont définis).
const BENEFITS = [
  {
    title: "Le devis part du téléphone, la facture arrive toute seule",
    desc: "Ton client signe en ligne, le devis accepté devient une facture numérotée, avec les bonnes mentions et la bonne TVA. Tu n'as rien ressaisi.",
  },
  {
    title: "Les retards se relancent sans toi",
    desc: "À J+3, J+10, J+20 : Newbi envoie tes relances avec tes mots. Toi, tu vois juste « payée » apparaître.",
  },
  {
    title: "Le ticket de caisse froissé devient une dépense propre",
    desc: "Une photo suffit : fournisseur, TTC et TVA sont lus et classés. Fini la boîte à chaussures de justificatifs.",
  },
  {
    title: "Le virement tombe, la facture se ferme",
    desc: "Ta banque est connectée : chaque paiement trouve sa facture tout seul, et ta trésorerie est juste, en temps réel.",
  },
  {
    title: "Ton comptable se sert, tu n'envoies plus rien",
    desc: "Un accès gratuit pour ton expert-comptable, des rôles pour ton équipe. Chacun voit ce qu'il doit voir, et rien d'autre.",
  },
];

const STEPS = [
  {
    when: "Lundi, 8h40",
    title: "Tu crées ton compte entre deux cafés",
    desc: "Email ou Google, pas de carte bancaire. Tu tapes ton SIRET, Newbi remplit le reste. Ton premier devis part avant la fin de la matinée.",
    aside: "Compte prêt en 2 minutes",
  },
  {
    when: "Mercredi, 14h15",
    title: "Ton client signe depuis son téléphone",
    desc: "Il reçoit le devis, le signe en ligne, et la facture est générée dans la foulée. Tu n'as ouvert ni Word ni Excel.",
    aside: "Devis signé, facture envoyée",
  },
  {
    when: "Vendredi, 11h",
    title: "Le virement arrive, tout se range",
    desc: "Newbi repère le paiement sur ta banque, ferme la facture, met ta trésorerie à jour. Ton comptable a déjà tout dans son accès.",
    aside: "Facture payée, compta à jour",
  },
];

// Cartes de réassurance sous les témoignages.
const PROOFS = [
  {
    avatar: "/lp/factures/41682668-4F07-4D9F-B672-DC469853793A.PNG",
    icon: <Star size={22} strokeWidth={1.75} />,
    title: "+ 140 indépendants",
    desc: "gèrent déjà devis, factures et banque avec Newbi, sans Excel.",
  },
  {
    avatar: "/lp/about/about-11.jpeg",
    icon: <MessageCircle size={22} strokeWidth={1.75} />,
    title: "Un humain sur WhatsApp",
    desc: "Une question ? L'équipe répond en langage normal, pas de robot.",
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
    id: "g-1",
    title: "Pour qui est fait Newbi ?",
    content:
      "Pour les indépendants, freelances, artisans et petites équipes (TPE, agences, associations) qui veulent un seul outil simple pour devis, factures, clients, dépenses et banque, sans empiler les logiciels ni vivre dans Excel.",
  },
  {
    id: "g-2",
    title: "Est-ce compliqué à prendre en main ?",
    content:
      "Non. Tu crées ton compte, tu ajoutes un client et tu envoies ton premier devis en quelques minutes. Pas de paramétrage lourd : numérotation, TVA et mentions légales sont gérées automatiquement. Et si tu bloques, l'équipe répond sur WhatsApp.",
  },
  {
    id: "g-3",
    title: "Comment fonctionne l'essai gratuit ?",
    content:
      "Tu as accès à toutes les fonctionnalités pendant 30 jours, sans carte bancaire. À la fin de l'essai, tu choisis ta formule. Si tu ne fais rien, rien n'est prélevé.",
  },
  {
    id: "g-4",
    title: "Newbi est-il compatible avec la facturation électronique ?",
    content:
      "Oui. La réforme est en vigueur depuis le 1er septembre 2026 et Newbi est prêt : réception et émission de factures électroniques au bon format, archivage légal inclus, sans surcoût dans toutes les formules.",
  },
  {
    id: "g-5",
    title: "Mon expert-comptable peut-il accéder à mes données ?",
    content:
      "Oui, gratuitement : chaque formule inclut au moins un accès comptable. Il retrouve tes factures, dépenses et justificatifs directement dans Newbi, et tu peux exporter en CSV, Excel ou FEC selon ta formule.",
  },
  {
    id: "g-6",
    title: "Puis-je résilier quand je veux ?",
    content:
      "Oui. Les formules sont sans engagement, en mensuel ou en annuel (10 % de réduction). Tu changes de formule ou tu résilies depuis tes paramètres, sans frais ni préavis.",
  },
];

export default function LpGestion() {
  return (
    <LpShell
      navbar="full"
      footer="full"
      flushTop
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
          href="/lp/facturation-electronique"
        />
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildFaqJsonLd(FAQ)),
        }}
      />
      {/* Ancien hero 2 colonnes (LpHero) remplacé par le hero centré avec
          cartes flottantes ; contenu conservé, H1 reformulé */}
      <HeroSection
        // eyebrow="Pour les indépendants et les petites équipes"
        title={
          <>
            Gère toute ton activité,
            <br className="hidden lg:block" /> sans jamais
            <br className="hidden lg:block" /> ouvrir Excel
          </>
        }
        subtitle={
          <>
            Devis, factures, clients, reçus et banque au même endroit.{" "}
            <strong className="font-medium text-gray-900">
              Tu factures plus vite, tu es payé plus tôt
            </strong>
            , et ta compta est prête pour ton expert-comptable.
          </>
        }
        proof={
          <>
            <span className="text-gray-900 font-medium">
              + 140 indépendants
            </span>
            <span className="mx-2 text-gray-300">·</span>+ 12 000 factures
            émises
          </>
        }
      />
      {/* <LpTrustBar items={TRUST} /> */}
      <LpTrustFeatures items={TRUST_FEATURES} />
      {/* <LpBenefits
        eyebrow="Au quotidien"
        title="Ce que tu ne feras plus jamais à la main"
        subtitle="Pas de service compta, pas d'assistant ? C'est pour ça que Newbi existe. Voilà ce qui se passe sans toi."
        items={BENEFITS}
      /> */}
      <BenefitsBento items={BENEFITS} />
      <LpSteps
        title="Une semaine type, sans Excel ouvert"
        intro="Ce n'est pas un tutoriel. C'est à quoi ressemble ta semaine une fois que la paperasse tourne toute seule."
        steps={STEPS}
        ctaLabel="Commencer ma semaine sans Excel"
      />
      <LpTestimonials proofs={PROOFS} />
      {/* Mêmes cartes de prix que la home */}
      <HomePricingSection />
      {/* Bannière CTA photo (même composant que sur la LP facturation
          électronique), placée entre le pricing et la FAQ */}
      <LpFinalCta
        title={
          <>
            Ferme ton Excel,
            <br className="hidden md:block" /> ouvre Newbi
          </>
        }
        subtitle="Crée ton compte et envoie ton premier devis aujourd'hui. 30 jours pour tester, sans carte bancaire."
        image="/lp/facturation-electronique/cta-laptop.jpg"
        imageAlt="Un indépendant gère ses factures dans Newbi sur son ordinateur portable"
      />
      <LpFaq items={FAQ} />
    </LpShell>
  );
}
