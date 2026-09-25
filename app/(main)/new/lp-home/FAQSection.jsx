import React from "react";
import PublicFaq from "@/src/components/public-faq";
import { PLANS_DISPLAY, getPlanPricingStrings } from "@/src/lib/plans-display";

// Génère dynamiquement la description tarifaire pour la FAQ.
// Avant : valeurs HARDCODÉES et FAUSSES pour Freelance (14,59€ HT au lieu
// de 17,99€ TTC). Source unique : plans-display.js. Toujours TTC.
function buildPricingFaqContent() {
  // "Jusqu'à X utilisateurs" — propre au plan (1 / 10 / 25)
  const usersByPlan = {
    freelance: "1 utilisateur",
    pme: "10 utilisateurs",
    entreprise: "25 utilisateurs",
  };
  const planLines = PLANS_DISPLAY.map((p) => {
    const s = getPlanPricingStrings(p.key, { includeTtc: false });
    return [
      `• ${s.displayName} (${usersByPlan[p.key]}) :`,
      `- Mensuel : ${s.monthly} TTC`,
      `- Annuel : ${s.annualPerMonth} TTC (soit ${s.annualTotal} TTC, 10% de réduction)`,
    ].join("\n");
  }).join("\n\n");
  return (
    "Tu profites de 30 jours gratuits à l'inscription, sans carte bancaire et sans engagement.\n\n" +
    "Ensuite, Newbi propose 3 formules :\n\n" +
    planLines +
    "\n\nTu peux changer de formule ou résilier à tout moment, sans conditions."
  );
}

export const HOME_FAQ = [
  {
    id: "item-1",
    title: "Qu'est-ce que Newbi ?",
    content:
      "Newbi est une plateforme tout-en-un pour gérer ton entreprise au quotidien : devis, factures, clients, reçus et dépenses, connexion bancaire, trésorerie et facturation électronique. Tu y trouves aussi des outils du quotidien comme les signatures de mail, le transfert de fichiers et la gestion de projets. L'objectif : que tu passes moins de temps sur l'administratif et plus sur ton activité.",
  },
  {
    id: "item-2",
    title: "À qui s'adresse Newbi ?",
    content:
      "Aux indépendants, freelances et petites équipes (TPE, agences, associations) qui veulent un seul outil simple pour tout centraliser, sans passer par Excel ou empiler les logiciels. Newbi fonctionne aussi bien seul qu'à plusieurs, avec des accès pour tes collaborateurs et ton expert-comptable.",
  },
  {
    id: "item-3",
    title: "Newbi est-il conforme à la facturation électronique ?",
    content:
      "Oui. La facturation électronique est en vigueur depuis le 1er septembre 2026 et Newbi est prêt : tu peux recevoir et émettre des factures électroniques au bon format, avec l'archivage légal inclus. Tu n'as rien à configurer de compliqué, tout est intégré dans ton espace habituel.",
  },
  {
    id: "item-4",
    title: "Comment fonctionne l'essai gratuit ?",
    content:
      "Tu crées ton compte en quelques secondes, sans carte bancaire, et tu as accès à toutes les fonctionnalités pendant 30 jours. À la fin de l'essai, tu choisis la formule qui te convient. Si tu ne fais rien, ton compte n'est pas facturé.",
  },
  {
    id: "item-5",
    title: "Quelles formules et quels prix propose Newbi ?",
    content: buildPricingFaqContent(),
  },
  {
    id: "item-6",
    title: "Puis-je connecter ma banque et scanner mes reçus ?",
    content:
      "Oui. Tu connectes ton compte bancaire pour synchroniser tes transactions, suivre ta trésorerie et rapprocher automatiquement tes paiements avec tes factures. Pour les dépenses, tu prends ton reçu en photo ou tu déposes le justificatif : Newbi le lit (OCR), extrait les montants et la TVA, et le classe pour toi.",
  },
  {
    id: "item-7",
    title: "Mon expert-comptable peut-il accéder à Newbi ?",
    content:
      "Oui, et c'est gratuit : chaque formule inclut au moins un accès comptable. Ton expert-comptable retrouve tes factures, tes dépenses et tes justificatifs directement dans Newbi, et tu peux exporter ta comptabilité dans les formats habituels.",
  },
  {
    id: "item-8",
    title: "Newbi est-il disponible sur mobile ?",
    content:
      "Oui. L'application Newbi est disponible sur iPhone (App Store) et Android (Google Play). Tu retrouves ton espace avec le même compte : consulter et créer tes factures, suivre tes paiements, photographier un reçu pour l'ajouter en dépense. Le site web reste conseillé pour les tâches plus lourdes comme le paramétrage ou les exports comptables.",
  },
  {
    id: "item-9",
    title: "Comment payer mon abonnement et comment résilier ?",
    content:
      "L'abonnement se règle par carte bancaire, en mensuel ou en annuel (10 % de réduction). Tu changes de formule ou tu résilies quand tu veux depuis tes paramètres, sans frais ni préavis.",
  },
  {
    id: "item-10",
    title: "Qui contacter si j'ai une question ?",
    content:
      "L'équipe Newbi est disponible directement sur WhatsApp : tu poses ta question et un conseiller te répond. Tu peux aussi passer par la page contact du site.",
  },
];

// Schéma FAQPage généré depuis les questions réellement affichées, pour
// que le balisage reste synchronisé avec le contenu visible (exigence Google).
export function buildHomeFaqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: HOME_FAQ.map((q) => ({
      "@type": "Question",
      name: q.title,
      acceptedAnswer: { "@type": "Answer", text: q.content },
    })),
  };
}

export default function FAQSection() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-7 px-4 pt-16 pb-16">
      <div className="space-y-2 text-center">
        <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-balance text-gray-950 dark:text-gray-50 mb-4">
          Questions fréquentes
        </h2>
        <p className="text-md font-normal tracking-tight text-gray-600 dark:text-gray-300 mx-auto mb-8 max-w-2xl">
          On est là pour répondre à toutes tes questions. Si tu ne trouves pas
          l'information recherchée, n'hésite pas à{" "}
          <a href="/contact" className="underline underline-offset-4">
            nous contacter
          </a>
          .
        </p>
      </div>
      <PublicFaq
        items={HOME_FAQ.map((item) => ({
          question: item.title,
          answer: item.content,
        }))}
      />
      <p className="text-muted-foreground">
        Tu ne trouves pas ce que tu cherches ? Contacte notre{" "}
        <a
          href="/contact"
          className="text-primary underline underline-offset-4"
        >
          équipe support
        </a>
      </p>
    </div>
  );
}
