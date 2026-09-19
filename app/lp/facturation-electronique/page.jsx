import {
  InvoiceListVisual,
  FormatVisual,
  LifecycleVisual,
  InboxVisual,
  ArchiveVisual,
  WhatsappVisual,
} from "../_components/LpVisuals";
import LpShell from "../_components/LpShell";
import LpHero from "../_components/LpHero";
import LpTrustBar from "../_components/LpTrustBar";
import LpBenefits from "../_components/LpBenefits";
import LpSteps from "../_components/LpSteps";
import LpTestimonials from "../_components/LpTestimonials";
import HomePricingSection from "@/app/(main)/new/lp-home/HomePricingSection";
import LpFaq, { buildFaqJsonLd } from "../_components/LpFaq";
import LpFinalCta from "../_components/LpFinalCta";

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

const TRUST = [
  "Formats Factur-X, UBL, CII",
  "Archivage légal 10 ans inclus",
  "Transmission via plateforme agréée",
  "Sans surcoût, dans toutes les formules",
  "Support humain sur WhatsApp",
];

const BENEFITS = [
  {
    title: "Tu factures comme avant. Le format, c'est notre affaire.",
    desc: "Même écran, mêmes clients, même bouton « Nouvelle facture ». Derrière, Newbi produit le fichier structuré et le transmet à la bonne plateforme.",
    visual: <InvoiceListVisual einvoicing />,
    wide: true,
  },
  {
    title: "Factur-X, UBL, CII : tu n'as pas à choisir",
    desc: "Newbi génère le format attendu par la plateforme de ton client. Tu n'entendras plus jamais parler de ces sigles.",
    visual: <FormatVisual />,
  },
  {
    title: "Tu sais où en est chaque facture, sans appeler",
    desc: "Déposée, transmise, reçue, acceptée, payée : le statut avance sous tes yeux. Plus de « vous l'avez bien reçue ? ».",
    visual: <LifecycleVisual />,
    wide: true,
  },
  {
    title: "Les factures de tes fournisseurs se rangent seules",
    desc: "Elles arrivent directement dans Newbi, classées en dépenses, prêtes pour ta TVA et ton comptable.",
    visual: <InboxVisual />,
  },
  {
    title: "Dix ans d'archives, zéro classeur",
    desc: "Chaque facture est conservée pendant la durée légale, avec sa traçabilité. Si le fisc demande, tu exportes.",
    visual: <ArchiveVisual />,
  },
  {
    title: "Une question ? Un humain répond, sur WhatsApp",
    desc: "Pas de ticket, pas de robot. L'équipe Newbi t'explique un statut ou une règle de la réforme en langage normal.",
    visual: <WhatsappVisual />,
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
    <LpShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildFaqJsonLd(FAQ)),
        }}
      />
      <LpHero
        eyebrow="Compatible avec la réforme 2026"
        title="Logiciel de facturation électronique,"
        accent="prêt pour la réforme"
        titleEnd="."
        subtitle="Émets, reçois et archive tes factures électroniques au bon format, sans changer ta façon de travailler. Inclus dans Newbi, sans surcoût."
        proof={
          <>
            <span className="text-gray-900 font-medium">
              + 140 indépendants
            </span>
            <span className="mx-2 text-gray-300">·</span>+ 12 000 factures
            émises
          </>
        }
        image="/lp/factures/facture1.png"
        mobileImage="/mockup-iphone-factures-clients.png"
        mobileImageAlt="Application mobile Newbi : factures et clients"
        imageAlt="Interface Newbi : liste de factures avec statuts de facturation électronique"
        badge={
          <img
            src="/logo_Compatible_Facturation_electronique-footer.png"
            alt="Compatible facturation électronique 2026"
            className="h-12 w-auto object-contain"
          />
        }
      />
      <LpTrustBar items={TRUST} />
      <LpBenefits
        eyebrow="Facturation électronique"
        title="Ce que la réforme te demande. Ce que Newbi fait à ta place."
        subtitle="Pas de module à acheter, pas de prestataire en plus. L'émission, la réception, le suivi et l'archivage sont déjà dans ton outil de facturation."
        items={BENEFITS}
      />
      <LpSteps
        title="Ta première facture électronique, ce matin"
        intro="Pas de migration, pas de formation. Voilà comment ça se passe vraiment."
        steps={STEPS}
        ctaLabel="Envoyer ma première facture électronique"
      />
      <LpTestimonials title="Ils facturent déjà avec Newbi" />
      {/* Mêmes cartes de prix que la home */}
      <HomePricingSection />
      <LpFaq items={FAQ} />
      <LpFinalCta
        title="Passe à la facturation électronique sans stress"
        subtitle="Crée ton compte, envoie ta première facture électronique aujourd'hui. Tu as 30 jours pour tester, sans carte bancaire."
      />
    </LpShell>
  );
}
