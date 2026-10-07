import React from "react";
import PublicFaq, { faqJsonLd } from "@/src/components/public-faq";
import {
  PLANS_DISPLAY,
  PRICE_QUALIFIER,
  formatPrice,
  getAnnualTotalAmount,
} from "@/src/lib/plans-display";

/* Les montants cités dans les réponses sont dérivés de plans-display.js, la
   source unique du site : une modification de grille se répercute ici sans
   qu'on ait à relire la FAQ. */
const [freelance, tpe, entreprise] = PLANS_DISPLAY;

const prixMensuels = PLANS_DISPLAY.map(
  (p) => `${p.displayName} à ${formatPrice(p.monthlyPrice)} par mois`,
).join(", ");

// Remise de l'engagement annuel, calculée plutôt qu'écrite en dur.
const remise = Math.round(
  (1 - freelance.annualMonthlyPrice / freelance.monthlyPrice) * 100,
);

const questions = [
  {
    id: "item-1",
    title: "Combien coûte Newbi ?",
    content: `Trois formules, toutes ${PRICE_QUALIFIER} : ${prixMensuels}. En réglant à l'année, le mois revient à ${formatPrice(freelance.annualMonthlyPrice)} en Freelance, ${formatPrice(tpe.annualMonthlyPrice)} en TPE et ${formatPrice(entreprise.annualMonthlyPrice)} en Entreprise, soit ${formatPrice(getAnnualTotalAmount(freelance))} pour une année complète en Freelance.`,
  },
  {
    id: "item-2",
    title: "L'essai de 30 jours est-il vraiment gratuit ?",
    content:
      "Oui. Vous créez votre espace sans carte bancaire et vous utilisez l'outil pendant 30 jours. À la fin de l'essai, aucun prélèvement n'est déclenché : c'est à vous de choisir une formule si vous souhaitez continuer. Il n'y a pas d'engagement de durée.",
  },
  {
    id: "item-3",
    title: "Les prix affichés sont-ils hors taxes ou toutes taxes comprises ?",
    content: `Tous les montants affichés sur cette page sont ${PRICE_QUALIFIER}. C'est le montant que vous réglez, sans TVA à ajouter au moment du paiement.`,
  },
  {
    id: "item-4",
    title: "Qu'est-ce que change le paiement à l'année ?",
    content: `Le tarif mensuel baisse d'environ ${remise} %. Le reste est identique : mêmes fonctionnalités, mêmes limites, même possibilité de résilier. Vous réglez une fois pour douze mois au lieu de douze fois.`,
  },
  {
    id: "item-5",
    title: "Puis-je changer de formule en cours d'abonnement ?",
    content:
      "Oui, depuis les paramètres de votre espace, à tout moment. Vous pouvez monter d'une formule quand votre équipe grandit, ou redescendre si vous n'avez plus besoin des places supplémentaires.",
  },
  {
    id: "item-6",
    title:
      "Que se passe-t-il si j'ajoute des collaborateurs au-delà de ma limite ?",
    content:
      "Chaque utilisateur supplémentaire est facturé 7,49 € par mois sur les formules Freelance et TPE, et 5,99 € par mois sur la formule Entreprise. Vous n'avez pas besoin de changer de formule pour ajouter une personne.",
  },
  {
    id: "item-7",
    title: "L'accès de mon comptable est-il facturé ?",
    content:
      "Non. Chaque formule comprend des accès comptables gratuits : un en Freelance, trois en TPE, cinq en Entreprise. Votre comptable consulte vos documents sans occuper une place d'utilisateur.",
  },
  {
    id: "item-8",
    title: "La facturation électronique est-elle comprise dans le prix ?",
    content:
      "Oui, sur les trois formules. L'émission et la réception au format conforme, ainsi que l'archivage légal, sont inclus dans l'abonnement : il n'y a pas d'option à ajouter pour être en règle avec la réforme.",
  },
  {
    id: "item-9",
    title: "Comment résilier mon abonnement ?",
    content:
      "En deux clics depuis les paramètres de votre espace, sans appel ni courrier. Vous conservez l'accès jusqu'à la fin de la période déjà réglée, et vos données restent exportables.",
  },
  {
    id: "item-10",
    title: "Quelle formule choisir pour commencer ?",
    content:
      "Si vous travaillez seul, Freelance couvre l'essentiel : devis, factures, clients, projets, trésorerie et un compte bancaire connecté. TPE s'adresse aux équipes jusqu'à dix personnes qui ont besoin de modèles et d'automatisations illimités. Entreprise ajoute les exports comptables tous formats, la signature électronique illimitée et jusqu'à vingt-cinq utilisateurs. Le tableau ci-dessus détaille ligne par ligne ce qui les sépare.",
  },
];

export default function FaqSection() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            faqJsonLd(
              questions.map((item) => ({
                question: item.title,
                answer: item.content,
              })),
            ),
          ),
        }}
      />
      <div className="mx-auto w-full max-w-3xl space-y-7 px-4 pt-10 pb-16 md:pt-20 lg:pt-22">
        <div className="space-y-2 text-center">
          <h2 className="text-balance text-4xl font-medium leading-tight tracking-tight text-gray-950 md:text-5xl lg:text-[3.5rem]">
            Questions fréquentes
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl">
            Tout ce qu&apos;il faut savoir avant de choisir une formule. Si vous
            ne trouvez pas votre réponse,{" "}
            <a href="/contact" className="underline underline-offset-4">
              écrivez-nous
            </a>
            .
          </p>
        </div>
        <PublicFaq
          items={questions.map((item) => ({
            question: item.title,
            answer: item.content,
          }))}
        />
      </div>
    </>
  );
}
