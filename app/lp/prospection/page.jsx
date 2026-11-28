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
import { Building2, Mail, HeartHandshake } from "lucide-react";
import {
  HeroVisual,
  SearchVisual,
  MailboxVisual,
  RhythmVisual,
  FollowVisual,
  RespectVisual,
} from "./section/visuals";

// Landing page Google Ads — intention « trouver des clients / logiciel de
// prospection B2B pour TPE ». noindex : réservée au trafic payant.
export const metadata = {
  title: {
    absolute: "Trouver des clients pros : prospection simple pour TPE | Newbi",
  },
  description:
    "Trouve des entreprises par métier et par zone, puis écris-leur depuis ton Gmail ou Outlook, à un rythme humain. Prospection B2B incluse dans Newbi. 7 jours gratuits.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/" },
};

const TRUST_FEATURES = [
  {
    icon: <Building2 size={26} strokeWidth={1.75} />,
    title: "Des entreprises réelles",
    desc: "Les entreprises actives du registre public, filtrées par métier, zone et taille.",
  },
  {
    icon: <Mail size={26} strokeWidth={1.75} />,
    title: "Depuis ta propre boîte",
    desc: "Chaque message part de ton Gmail ou Outlook, à ton nom. Les réponses arrivent chez toi.",
  },
  {
    icon: <HeartHandshake size={26} strokeWidth={1.75} />,
    title: "Respectueux des prospects",
    desc: "Professionnels seulement, désinscription en un clic et aucun suivi d'ouverture.",
  },
];

const FEATURES = [
  {
    title: "Tes futurs clients, en une recherche",
    desc: "Un métier, une ville ou un département, une taille d'entreprise : Newbi te montre combien d'entreprises correspondent et les ajoute à une liste de ton CRM.",
    visual: <SearchVisual />,
  },
  {
    title: "Un vrai e-mail, pas une pub",
    desc: "Court et personnel, comme écrit à la main. Il part de ta boîte, avec ta signature.",
    visual: <MailboxVisual />,
  },
  {
    title: "Un rythme humain",
    desc: "Quelques dizaines d'e-mails par jour, espacés, aux heures de bureau et jamais un jour férié.",
    visual: <RhythmVisual />,
  },
  {
    title: "Tu sais qui a répondu",
    desc: "Messages partis, réponses notées, envois restants : tu suis chaque prospection sur une seule page.",
    visual: <FollowVisual />,
  },
  {
    title: "Ton adresse reste protégée",
    desc: "Les 14 premiers jours, la limite monte progressivement, et les envois se suspendent seuls si trop de gens se désinscrivent.",
    visual: <RespectVisual />,
  },
];

const STEPS = [
  {
    when: "Lundi, 8h30",
    title: "Tu cherches tes prospects",
    desc: "« Menuisier, Vienne, moins de 10 salariés » : 128 entreprises. Tu en ajoutes 25 à une liste « Menuisiers Vienne » dans ton CRM.",
    aside: "Liste prête en 2 minutes",
  },
  {
    when: "Lundi, 9h",
    title: "Tu écris un seul message",
    desc: "Tu connectes ton Gmail, tu écris quelques lignes simples et tu t'envoies un test. Newbi vérifie tout, tu lances.",
    aside: "Prospection lancée",
  },
  {
    when: "Jeudi, 11h",
    title: "Les premières réponses tombent",
    desc: "Elles arrivent dans ta boîte, comme d'habitude. Tu marques « A répondu », et tu transformes l'échange en devis dans Newbi.",
    aside: "Premier rendez-vous calé",
  },
];

const FAQ = [
  {
    id: "pr-1",
    title: "D'où viennent les entreprises proposées ?",
    content:
      "Du registre public des entreprises françaises : seules les entreprises actives sont proposées. Tu filtres par activité (n'importe quel code NAF), par ville, département ou région, par taille et par ancienneté.",
  },
  {
    id: "pr-2",
    title: "Comment fonctionnent les crédits ?",
    content:
      "Un crédit correspond à un prospect ajouté à tes clients ou à une page de 25 entreprises consultée. La formule Premium inclut 30 crédits par mois, Entreprise 100, avec des crédits supplémentaires en vente, sans expiration.",
  },
  {
    id: "pr-3",
    title: "Comment fonctionne l'essai gratuit ?",
    content:
      "Tu as accès à Newbi pendant 7 jours sans aucun prélèvement. Tu choisis ta formule et enregistres ta carte à l'inscription ; à la fin des 7 jours, la formule choisie est prélevée automatiquement. Si tu résilies avant, rien n'est prélevé.",
  },
  {
    id: "pr-4",
    title: "Est-ce que mes e-mails risquent de finir en spam ?",
    content:
      "Newbi envoie depuis ta vraie boîte Gmail ou Outlook, un message à la fois, aux heures de bureau, avec une limite quotidienne qui monte doucement les premiers jours. C'est le comportement d'une personne, pas d'un robot d'envoi.",
  },
  {
    id: "pr-5",
    title: "Est-ce légal ?",
    content:
      "La prospection par e-mail est autorisée entre professionnels quand le message concerne leur activité. Newbi te le fait attester avant chaque lancement, ajoute un lien de désinscription et ne suit pas les ouvertures.",
  },
  {
    id: "pr-6",
    title: "Puis-je résilier quand je veux ?",
    content:
      "Oui. Les formules sont sans engagement, en mensuel ou en annuel (10 % de réduction). Tu résilies depuis tes paramètres, sans frais ni préavis.",
  },
];

export default function LpProspection() {
  return (
    <LpShell navbar="full" footer="full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildFaqJsonLd(FAQ)),
        }}
      />
      <LpToolHero
        eyebrow="Nouveau · Prospection"
        title={
          <>
            Trouve tes prochains clients
            <br className="hidden sm:block" /> sans y passer tes soirées
          </>
        }
        subtitle="Cherche des entreprises par métier et par zone, puis écris-leur depuis ton Gmail ou Outlook, à un rythme humain. Tout se range dans ton CRM Newbi."
        secondary={{
          href: "#fonctionnalites",
          label: "Voir comment ça marche",
        }}
        visual={<HeroVisual />}
      />
      <LpTrustFeatures items={TRUST_FEATURES} />
      <LpToolBento
        id="fonctionnalites"
        title="De la liste de prospects au premier rendez-vous"
        items={FEATURES}
      />
      <LpSteps
        title="Une prospection lancée avant ton café"
        intro="Pas de fichier acheté, pas d'outil d'automatisation à configurer. Voilà comment ça se passe."
        steps={STEPS}
        ctaLabel="Essayer 7 jours gratuits"
      />
      <LpTestimonials proofs={TOOL_PROOFS} />
      <HomePricingSection />
      <LpFinalCta
        title={
          <>
            Tes prochains clients
            <br className="hidden md:block" /> sont à une recherche
          </>
        }
        subtitle="7 jours gratuits, aucun prélèvement pendant l'essai. Trouve, écris, suis : tout est dans Newbi."
        image="/lp/facturation-electronique/cta-laptop.jpg"
        imageAlt="Un indépendant prépare sa prospection dans Newbi sur son ordinateur portable"
      />
      <LpFaq items={FAQ} />
    </LpShell>
  );
}
