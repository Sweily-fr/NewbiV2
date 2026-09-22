import LpShell from "../_components/LpShell";
// Sections copiées depuis /lp/facturation-electronique et adaptées au thème
// auto-entrepreneur (hero, simulateur « es-tu concerné ? », animations des
// cartes « l'essentiel », bento).
import HeroSection from "./section/hero-section";
import ConcernedChecker from "./section/ConcernedChecker";
import {
  LawVisual,
  AutomationVisual,
  StartVisual,
} from "./section/EssentialsVisuals";
import FeatureBento from "./section/FeatureBento";
import LpTrustFeatures from "../_components/LpTrustFeatures";
import {
  BadgePercent,
  Gift,
  Star,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import LpEssentials from "../_components/LpEssentials";
import LpSteps from "../_components/LpSteps";
import LpTestimonials from "../_components/LpTestimonials";
import HomePricingSection from "@/app/(main)/new/lp-home/HomePricingSection";
import LpFaq, { buildFaqJsonLd } from "../_components/LpFaq";
import LpFinalCta from "../_components/LpFinalCta";
import { FacturationBanner } from "@/app/produits/factures/section/FacturationBanner";

// Landing page Google Ads — intention « logiciel de facturation
// auto-entrepreneur / micro-entreprise ». Copie conforme de
// /lp/facturation-electronique, angle : conformité 2026, mention TVA non
// applicable automatique, 30 jours offerts sans carte bancaire.
// noindex : page réservée au trafic payant.
export const metadata = {
  title: {
    absolute: "Logiciel de facturation pour auto-entrepreneurs | Newbi",
  },
  description:
    "Devis et factures conformes pour auto-entrepreneurs : mention TVA non applicable ajoutée automatiquement, compatible facturation électronique 2026. 30 jours offerts, sans carte bancaire.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/produits/factures" },
};

// 3 arguments clés sous le hero : mention TVA, conformité 2026, essai offert.
const TRUST_FEATURES = [
  {
    icon: <BadgePercent size={26} strokeWidth={1.75} />,
    title: "TVA non applicable, automatique",
    desc: "En franchise en base, la mention légale est ajoutée sur chaque facture. Rien à retenir.",
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
    title: "Conforme 2026",
    desc: "Formats Factur-X, UBL, CII et transmission via plateforme agréée, inclus sans surcoût.",
  },
  {
    icon: <Gift size={26} strokeWidth={1.75} />,
    title: "30 jours offerts",
    desc: "Sans carte bancaire. Toutes les fonctionnalités dès le premier jour.",
  },
];

// Section « l'essentiel » : ce que la loi demande à un auto-entrepreneur,
// ce que Newbi fait à sa place, par où commencer.
const ESSENTIALS = [
  {
    title: "Ce qu'une facture d'auto-entrepreneur doit contenir",
    intro:
      "Ton nom, ton SIRET, un numéro qui se suit, et si tu es en franchise en base, la mention « TVA non applicable ». Et dès le 1er septembre 2026, elle doit passer par une plateforme agréée.",
    points: [
      "Réception électronique : tous les auto-entrepreneurs dès 2026",
      "Émission électronique : micro-entreprises en 2027",
      "Conservation des factures pendant 10 ans",
    ],
    visual: <LawVisual />,
  },
  {
    title: "Ce que Newbi remplit pour toi",
    intro:
      "Tu indiques le client, la prestation et le montant. Newbi s'occupe des mentions, du numéro, du format électronique et de l'envoi.",
    points: [
      "Mention « TVA non applicable » ajoutée automatiquement",
      "Numérotation continue, sans trou ni doublon",
      "Facture transmise au bon format, statut en direct",
    ],
    visual: <AutomationVisual />,
  },
  {
    title: "Comment démarrer en micro-entreprise ?",
    intro:
      "Tu entres ton SIRET : Newbi détecte ton statut de micro-entrepreneur et prépare tes modèles. Ta première facture conforme part dans la matinée.",
    points: [
      "30 jours offerts, sans carte bancaire",
      "Aucun réglage de TVA à faire",
      "Une question ? Un humain répond sur WhatsApp",
    ],
    visual: <StartVisual />,
  },
];

const STEPS = [
  {
    when: "Aujourd'hui, 9h",
    title: "Tu crées ton compte, ton SIRET fait le reste",
    desc: "Email ou Google, sans carte bancaire. Les informations légales de ta micro-entreprise sont pré-remplies, tes modèles de devis et de facture sont prêts.",
    aside: "Compte prêt en 2 minutes",
  },
  {
    when: "9h12",
    title: "Ta première facture est partie, avec les bonnes mentions",
    desc: "Client, prestation, montant. La mention « TVA non applicable » est déjà en pied de page, le numéro suit la séquence, et Newbi transmet au format électronique.",
    aside: "Statut : Transmise",
  },
  {
    when: "Chaque mois, ensuite",
    title: "Tes factures payées, prêtes pour ta déclaration",
    desc: "Factures émises, factures encaissées, justificatifs : tu retrouves tout au même endroit pour déclarer ton chiffre d'affaires. Ton comptable, si tu en as un, y accède gratuitement.",
    aside: "Archivé 10 ans, automatiquement",
  },
];

// Cartes de réassurance sous les témoignages.
const PROOFS = [
  {
    avatar: "/lp/factures/41682668-4F07-4D9F-B672-DC469853793A.PNG",
    icon: <Star size={22} strokeWidth={1.75} />,
    title: "+ 140 indépendants",
    desc: "facturent déjà avec Newbi, auto-entrepreneurs compris, prêts pour 2026.",
  },
  {
    avatar: "/lp/about/about-11.jpeg",
    icon: <MessageCircle size={22} strokeWidth={1.75} />,
    title: "Un humain sur WhatsApp",
    desc: "Une question sur la TVA ou la réforme ? L'équipe répond en langage normal, pas de robot.",
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
    id: "ae-1",
    title: "Newbi est-il adapté aux auto-entrepreneurs ?",
    content:
      "Oui. Tu indiques ton statut de micro-entrepreneur à la création du compte : tes devis, factures et avoirs portent automatiquement les mentions obligatoires (nom, SIRET, numérotation continue, mention TVA non applicable en franchise en base). Tu n'as pas à configurer de taux de TVA ni à retenir de formule légale.",
  },
  {
    id: "ae-2",
    title:
      "La mention « TVA non applicable » est-elle ajoutée automatiquement ?",
    content:
      "Oui. Si tu es en franchise en base de TVA, la mention « TVA non applicable, art. L. 223-3 du CIBS » (ex-art. 293 B du CGI) est ajoutée en pied de page de chaque facture, et tes montants sont affichés sans TVA. Le jour où tu deviens redevable de la TVA, tu l'actives dans tes réglages : les prochaines factures l'incluent, les anciennes restent inchangées.",
  },
  {
    id: "ae-3",
    title:
      "Suis-je concerné par la facturation électronique 2026 en tant qu'auto-entrepreneur ?",
    content:
      "Oui, même en franchise en base de TVA. Depuis le 1er septembre 2026, tous les auto-entrepreneurs doivent pouvoir recevoir des factures électroniques via une plateforme agréée. L'obligation d'émettre tes propres factures au format électronique s'applique aux micro-entreprises à partir du 1er septembre 2027. Avec Newbi, les deux sont inclus, sans surcoût.",
  },
  {
    id: "ae-4",
    title: "Que se passe-t-il pendant les 30 jours offerts ?",
    content:
      "Tu as accès à toutes les fonctionnalités pendant 30 jours, sans carte bancaire. Tu peux émettre de vraies factures dès le premier jour. À la fin de l'essai, tu choisis ta formule ; si tu ne fais rien, rien n'est prélevé.",
  },
  {
    id: "ae-5",
    title: "Puis-je suivre mon chiffre d'affaires pour ma déclaration URSSAF ?",
    content:
      "Oui. Chaque facture a un statut (émise, envoyée, payée) : tu retrouves en un coup d'œil ce que tu as encaissé sur la période. Si tu as un expert-comptable, son accès est inclus gratuitement et il peut exporter en CSV, Excel ou FEC selon ta formule.",
  },
  {
    id: "ae-6",
    title: "Et si j'ai déjà des factures faites sur Word ou Excel ?",
    content:
      "Tu repars sur Newbi pour les nouvelles factures en reprenant ta numérotation là où tu en étais, et tu importes tes clients. L'équipe t'accompagne sur WhatsApp si tu veux un coup de main pour la transition.",
  },
];

export default function LpFacturationAutoEntrepreneur() {
  return (
    <LpShell
      navbar="full"
      footer="full"
      banner={
        <FacturationBanner
          text={
            <>
              Auto-entrepreneur ? Facture en conformité 2026 avec Newbi :{" "}
              <span className="font-medium text-[#5A50FF] underline decoration-[#5A50FF] decoration-1 underline-offset-4">
                30 jours offerts, sans carte bancaire
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
      <HeroSection
        title="Logiciel de facturation pour auto-entrepreneurs, conforme 2026."
        subtitle={
          <>
            Crée tes devis et factures en 2 minutes, avec la mention{" "}
            <strong className="font-medium text-gray-900">
              « TVA non applicable » ajoutée automatiquement
            </strong>
            . Compatible facturation électronique 2026, inclus sans surcoût.
          </>
        }
      />
      <LpTrustFeatures items={TRUST_FEATURES} />
      <LpEssentials
        title="Facturer en micro-entreprise, en clair"
        items={ESSENTIALS}
      />
      <ConcernedChecker />
      <LpSteps
        title="Ta première facture d'auto-entrepreneur, ce matin"
        intro="Pas de modèle Word à bricoler, pas de formation. Voilà comment ça se passe vraiment."
        steps={STEPS}
        ctaLabel="Essayer gratuitement"
      />
      <FeatureBento />
      <LpTestimonials
        title="Ils facturent l'esprit tranquille"
        proofs={PROOFS}
      />
      {/* Mêmes cartes de prix que la home */}
      <HomePricingSection />
      <LpFinalCta
        title={
          <>
            Facture comme un pro,
            <br className="hidden md:block" /> même en micro-entreprise
          </>
        }
        subtitle="Crée ton compte, envoie ta première facture conforme aujourd'hui. Tu as 30 jours pour tester, sans carte bancaire."
        image="/lp/facturation-electronique/cta-laptop.jpg"
        imageAlt="Un auto-entrepreneur consulte ses factures clients dans Newbi sur son ordinateur portable"
      />
      <LpFaq items={FAQ} />
    </LpShell>
  );
}
