import LpShell from "../_components/LpShell";
import LpToolHero from "../_components/LpToolHero";
import LpTrustFeatures from "../_components/LpTrustFeatures";
import LpToolBento from "../_components/LpToolBento";
import LpSteps from "../_components/LpSteps";
import LpTestimonials from "../_components/LpTestimonials";
import HomePricingSection from "@/app/(main)/new/lp-home/HomePricingSection";
import LpFinalCta from "../_components/LpFinalCta";
import LpFaq, { buildFaqJsonLd } from "../_components/LpFaq";
import { TOOL_PROOFS } from "../_components/tool-proofs";
import { Users, AtSign, ShieldCheck } from "lucide-react";
import {
  HeroVisual,
  EditorVisual,
  AudienceVisual,
  ScheduleVisual,
  ReportVisual,
  DomainVisual,
} from "./section/visuals";

// Landing page Google Ads — intention « logiciel d'e-mailing / campagnes
// e-mail pour TPE ». noindex : réservée au trafic payant.
export const metadata = {
  title: {
    absolute: "Campagnes e-mail simples pour indépendants et TPE | Newbi",
  },
  description:
    "Écris ta newsletter avec un éditeur par blocs, envoie-la à tes clients depuis ton propre domaine et suis les résultats. Inclus dans Newbi. 7 jours gratuits.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/" },
};

const TRUST_FEATURES = [
  {
    icon: <Users size={26} strokeWidth={1.75} />,
    title: "Tes contacts sont déjà là",
    desc: "Tes clients et tes listes Newbi servent directement de destinataires, sans import.",
  },
  {
    icon: <AtSign size={26} strokeWidth={1.75} />,
    title: "Envoyé depuis ton domaine",
    desc: "contact@ton-entreprise.fr, pas une adresse générique : tu inspires confiance.",
  },
  {
    icon: <ShieldCheck size={26} strokeWidth={1.75} />,
    title: "Respectueux de la CNIL",
    desc: "Désinscription en un clic, suivi coupé par défaut, accords tracés contact par contact.",
  },
];

const FEATURES = [
  {
    title: "Une belle newsletter, sans graphiste",
    desc: "Titre, texte, image, bouton, ta signature de mail : tu assembles des blocs, Newbi s'occupe du rendu sur ordinateur comme sur téléphone.",
    visual: <EditorVisual />,
  },
  {
    title: "Tes listes clients, en un clic",
    desc: "Coche une ou plusieurs listes de ton CRM : les doublons et les désinscrits sont retirés d'office.",
    visual: <AudienceVisual />,
  },
  {
    title: "Programmée pour le bon moment",
    desc: "Choisis le jour et l'heure, Newbi envoie. Tu peux mettre en pause ou annuler tant que ce n'est pas parti.",
    visual: <ScheduleVisual />,
  },
  {
    title: "Tu vois ce qui a marché",
    desc: "E-mails traités, clics, désinscriptions : un rapport clair, limité aux contacts qui ont accepté d'être suivis.",
    visual: <ReportVisual />,
  },
  {
    title: "Ton adresse, ta réputation",
    desc: "Tu valides ton domaine en copiant quelques lignes chez ton hébergeur, et Newbi vérifie tout avant chaque envoi.",
    visual: <DomainVisual />,
  },
];

const STEPS = [
  {
    when: "Lundi, 9h",
    title: "Tu choisis un modèle de départ",
    desc: "Tu changes le titre, glisses une photo de tes nouveautés et ajoutes un bouton vers ton site. Ta signature de mail se place en bas.",
    aside: "Newsletter prête en 15 minutes",
  },
  {
    when: "Lundi, 9h20",
    title: "Tu coches tes listes et tu programmes",
    desc: "Clients actifs et Newsletter : 412 destinataires. Newbi vérifie l'adresse d'envoi et le contenu, puis tu programmes mardi 10h.",
    aside: "Envoi programmé",
  },
  {
    when: "Mercredi, 14h",
    title: "Les réponses arrivent dans ta boîte",
    desc: "Tes clients répondent directement à ton adresse. Le rapport te montre les clics et les désinscriptions, sans tableur.",
    aside: "Campagne envoyée, rapport prêt",
  },
];

const FAQ = [
  {
    id: "ce-1",
    title: "Combien d'e-mails puis-je envoyer ?",
    content:
      "Les campagnes e-mail sont incluses dans toutes les formules : 500 e-mails par mois avec Standard, 2 500 avec Premium et 10 000 avec Entreprise. Le quota restant s'affiche avant chaque envoi.",
  },
  {
    id: "ce-2",
    title: "Comment fonctionne l'essai gratuit ?",
    content:
      "Tu as accès à Newbi pendant 7 jours sans aucun prélèvement. Tu choisis ta formule et enregistres ta carte à l'inscription ; à la fin des 7 jours, la formule choisie est prélevée automatiquement. Si tu résilies avant, rien n'est prélevé.",
  },
  {
    id: "ce-3",
    title: "Est-ce que je dois importer mes contacts ?",
    content:
      "Non si tes clients sont déjà dans Newbi : tes listes de contacts servent de destinataires. Sinon, tu les ajoutes à ton CRM Newbi une fois, et ils servent pour tes devis, tes factures et tes campagnes.",
  },
  {
    id: "ce-4",
    title: "Mes e-mails partent-ils de ma propre adresse ?",
    content:
      "Oui. Tu indiques l'adresse d'envoi de ton domaine (par exemple contact@ton-entreprise.fr) et tu ajoutes les lignes indiquées chez ton hébergeur. Les réponses de tes contacts arrivent sur l'adresse de réponse que tu choisis.",
  },
  {
    id: "ce-5",
    title: "Est-ce conforme au RGPD ?",
    content:
      "Chaque e-mail contient un lien de désinscription, les désinscrits ne reçoivent plus rien, et le suivi des ouvertures et des clics est coupé par défaut. Tu l'actives seulement pour les contacts qui l'ont accepté.",
  },
  {
    id: "ce-6",
    title: "Puis-je résilier quand je veux ?",
    content:
      "Oui. Les formules sont sans engagement, en mensuel ou en annuel (10 % de réduction). Tu résilies depuis tes paramètres, sans frais ni préavis.",
  },
];

export default function LpCampagnesEmail() {
  return (
    <LpShell navbar="full" footer="full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildFaqJsonLd(FAQ)),
        }}
      />
      <LpToolHero
        eyebrow="Nouveau · Campagnes e-mail"
        title={
          <>
            Tes newsletters,
            <br className="hidden sm:block" /> envoyées depuis Newbi
          </>
        }
        subtitle="Écris ta campagne avec des blocs, choisis tes listes clients et programme l'envoi depuis ton propre domaine. Sans outil en plus à payer."
        secondary={{
          href: "#fonctionnalites",
          label: "Voir comment ça marche",
        }}
        visual={<HeroVisual />}
      />
      <LpTrustFeatures items={TRUST_FEATURES} />
      <LpToolBento
        id="fonctionnalites"
        title="Une campagne pro, en un quart d'heure"
        items={FEATURES}
      />
      <LpSteps
        title="De l'idée à la boîte de réception"
        intro="Pas besoin d'être marketeur. Voilà comment part une newsletter avec Newbi."
        steps={STEPS}
        ctaLabel="Essayer 7 jours gratuits"
      />
      <LpTestimonials proofs={TOOL_PROOFS} />
      <HomePricingSection />
      <LpFinalCta
        title={
          <>
            Ta prochaine newsletter
            <br className="hidden md:block" /> part cette semaine
          </>
        }
        subtitle="7 jours gratuits, aucun prélèvement pendant l'essai. Tes clients, tes listes et ton éditeur t'attendent."
        image="/lp/facturation-electronique/cta-laptop.jpg"
        imageAlt="Une gérante prépare sa newsletter dans Newbi sur son ordinateur portable"
      />
      <LpFaq items={FAQ} />
    </LpShell>
  );
}
