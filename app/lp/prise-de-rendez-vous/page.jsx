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
import { Link2, CalendarCheck, Wallet } from "lucide-react";
import {
  HeroVisual,
  TypesVisual,
  AgendaVisual,
  PaymentVisual,
  BookingsVisual,
  TicketVisual,
} from "./section/visuals";

// Landing page Google Ads — intention « logiciel de prise de rendez-vous en
// ligne / billetterie d'événements pour indépendants ». noindex : réservée
// au trafic payant.
export const metadata = {
  title: {
    absolute: "Prise de rendez-vous en ligne pour indépendants | Newbi",
  },
  description:
    "Ta page de réservation en ligne : tes clients choisissent un créneau libre, paient un acompte s'il le faut, et tout arrive dans ton agenda. Billetterie incluse. 7 jours gratuits.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/" },
};

const TRUST_FEATURES = [
  {
    icon: <Link2 size={26} strokeWidth={1.75} />,
    title: "Un lien à partager",
    desc: "Dans ta signature, sur ton site ou en message : tes clients réservent seuls.",
  },
  {
    icon: <CalendarCheck size={26} strokeWidth={1.75} />,
    title: "Synchronisé avec ton agenda",
    desc: "Google Agenda, Outlook ou Apple Calendrier : jamais deux rendez-vous en même temps.",
  },
  {
    icon: <Wallet size={26} strokeWidth={1.75} />,
    title: "Payé à la réservation",
    desc: "Paiement complet, acompte ou sur place, encaissé sur ton compte sans commission Newbi.",
  },
];

const FEATURES = [
  {
    title: "Un type de rendez-vous pour chaque service",
    desc: "Appel découverte gratuit, rendez-vous projet de 45 minutes, atelier de deux heures : chacun a sa durée, son prix, son lieu ou son lien de visio.",
    visual: <TypesVisual />,
  },
  {
    title: "Tes agendas restent maîtres",
    desc: "Tes événements occupent les créneaux, et chaque rendez-vous réservé s'ajoute à ton agenda, avec un lien Meet ou Teams si besoin.",
    visual: <AgendaVisual />,
  },
  {
    title: "Fini les rendez-vous non honorés",
    desc: "Fais payer en ligne, demande un acompte ou laisse régler sur place. Stripe, PayPal, SumUp ou virement.",
    visual: <PaymentVisual />,
  },
  {
    title: "Tout ton planning d'un coup d'œil",
    desc: "Qui vient, quand, et s'il a payé. Ton client peut reprogrammer ou annuler seul depuis son e-mail.",
    visual: <BookingsVisual />,
  },
  {
    title: "Et tes événements avec billetterie",
    desc: "Soirée, atelier, formation : nombre de places, prix par place, billet avec QR code, et contrôle à l'entrée depuis ton téléphone.",
    visual: <TicketVisual />,
  },
];

const STEPS = [
  {
    when: "Lundi, 9h",
    title: "Tu crées ta page de réservation",
    desc: "Ta photo, tes types de rendez-vous et tes horaires de la semaine. Tu connectes ton agenda Google pour que les créneaux occupés disparaissent.",
    aside: "Page en ligne en 10 minutes",
  },
  {
    when: "Lundi, 9h15",
    title: "Tu partages ton lien",
    desc: "Dans ta signature de mail, sur ton site et sur Instagram. Tu n'échanges plus cinq messages pour trouver une date.",
    aside: "Lien partagé",
  },
  {
    when: "Mardi, 22h40",
    title: "Un client réserve pendant que tu dors",
    desc: "Il choisit son créneau, paie son acompte et reçoit sa confirmation. Le rendez-vous est déjà dans ton agenda le lendemain matin.",
    aside: "Rendez-vous réservé et payé",
  },
];

const FAQ = [
  {
    id: "rdv-1",
    title: "Mes clients doivent-ils créer un compte ?",
    content:
      "Non. Ils ouvrent ton lien, choisissent un créneau libre, laissent leurs coordonnées et paient si tu l'as demandé. Ils reçoivent un e-mail de confirmation avec un lien pour reprogrammer ou annuler.",
  },
  {
    id: "rdv-2",
    title: "Comment fonctionne l'essai gratuit ?",
    content:
      "Tu as accès à Newbi pendant 7 jours sans aucun prélèvement. Tu choisis ta formule et enregistres ta carte à l'inscription ; à la fin des 7 jours, la formule choisie est prélevée automatiquement. Si tu résilies avant, rien n'est prélevé.",
  },
  {
    id: "rdv-3",
    title: "Comment je suis payé ?",
    content:
      "Tu connectes Stripe, PayPal ou SumUp depuis tes paramètres, ou tu renseignes ton IBAN pour un virement. L'argent arrive directement sur ton compte, Newbi ne prend aucune commission.",
  },
  {
    id: "rdv-4",
    title: "Puis-je l'intégrer à mon site ?",
    content:
      "Oui. Newbi te donne un code à coller dans une page de ton site : le calendrier s'affiche sans que ton client quitte ton site.",
  },
  {
    id: "rdv-5",
    title: "Comment marche la billetterie ?",
    content:
      "Tu crées un événement avec sa date, son adresse, son nombre de places et son prix. Chaque inscrit reçoit un billet avec QR code, que tu scannes à l'entrée depuis ton téléphone.",
  },
  {
    id: "rdv-6",
    title: "Puis-je résilier quand je veux ?",
    content:
      "Oui. Les formules sont sans engagement, en mensuel ou en annuel (10 % de réduction). Tu résilies depuis tes paramètres, sans frais ni préavis.",
  },
];

export default function LpPriseDeRendezVous() {
  return (
    <LpShell navbar="full" footer="full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildFaqJsonLd(FAQ)),
        }}
      />
      <LpToolHero
        eyebrow="Nouveau · Prise de rendez-vous"
        title={
          <>
            Tes clients réservent seuls,
            <br className="hidden sm:block" /> ton agenda se remplit
          </>
        }
        subtitle="Une page de réservation à ton nom, synchronisée avec ton agenda, avec paiement ou acompte en ligne. Et une billetterie pour tes événements."
        secondary={{
          href: "#fonctionnalites",
          label: "Voir comment ça marche",
        }}
        visual={<HeroVisual />}
      />
      <LpTrustFeatures items={TRUST_FEATURES} />
      <LpToolBento
        id="fonctionnalites"
        title="Fini les allers-retours pour caler un rendez-vous"
        items={FEATURES}
      />
      <LpSteps
        title="Ton agenda se remplit sans toi"
        intro="Pas de secrétariat, pas de messages à rallonge. Voilà ce qui se passe une fois ta page en ligne."
        steps={STEPS}
        ctaLabel="Essayer 7 jours gratuits"
      />
      <LpTestimonials proofs={TOOL_PROOFS} />
      <HomePricingSection />
      <LpFinalCta
        title={
          <>
            Ton premier rendez-vous
            <br className="hidden md:block" /> réservé en ligne cette semaine
          </>
        }
        subtitle="7 jours gratuits, aucun prélèvement pendant l'essai. Ta page de réservation est prête en dix minutes."
        image="/lp/facturation-electronique/cta-laptop.jpg"
        imageAlt="Une indépendante consulte ses rendez-vous dans Newbi sur son ordinateur portable"
      />
      <LpFaq items={FAQ} />
    </LpShell>
  );
}
