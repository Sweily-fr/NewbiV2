import React from "react";
import PublicFaq, { faqJsonLd } from "@/src/components/public-faq";

/* Les réponses reprennent ce qui est déjà publié sur le blog : mentions
   propres au BTP (assurance décennale, adresse du chantier), taux de TVA à 20,
   10 ou 5,5 %, retenue de garantie de 5 % libérée après un an, factures de
   situation et décompte général définitif, autoliquidation en sous-traitance,
   et calendrier de la facturation électronique. Aucun montant de prime ni
   condition d'éligibilité à un taux réduit n'est avancé ici : cela dépend du
   chantier, et les articles du blog le détaillent. */
const questions = [
  {
    title: "Newbi est-il adapté à un artisan du bâtiment ?",
    content:
      "Oui. Newbi distingue trois types de document — facture standard, facture d'acompte et facture de situation — avec un montant de marché, un pourcentage d'avancement et une retenue de garantie. Vous choisissez le taux de TVA ligne par ligne, et vos mentions propres au chantier (assurance, adresse des travaux) tiennent dans les champs personnalisés de vos modèles.",
  },
  {
    title: "Puis-je faire des factures de situation ?",
    content:
      "Oui, c'est un type de document à part entière. Vous indiquez le montant du marché et le pourcentage d'avancement — globalement ou poste par poste —, et Newbi en déduit le montant de la période. Chaque situation porte son numéro de situation en plus de son numéro de facture, et peut être rattachée à une référence de chantier.",
  },
  {
    title: "Comment gérer la retenue de garantie de 5 % ?",
    content:
      "Vous saisissez le pourcentage convenu au marché sur la facture : il est retranché du net à payer. Dans le BTP il est le plus souvent de 5 %, libérés un an après la réception sauf caution bancaire de remplacement, mais c'est vous qui fixez le taux document par document.",
  },
  {
    title: "Quels taux de TVA puis-je appliquer sur mes travaux ?",
    content:
      "Selon la nature des travaux et le logement concerné, le taux applicable est de 20 %, 10 % ou 5,5 %. Newbi vous laisse choisir le taux ligne par ligne sur un même devis, ce qui est courant quand un chantier mélange rénovation énergétique et travaux classiques. Le choix du taux et l'attestation à faire signer au client restent à votre charge.",
  },
  {
    title: "Et l'autoliquidation quand je travaille en sous-traitance ?",
    content:
      "Newbi n'a pas de réglage dédié à l'autoliquidation. En pratique vous passez les lignes concernées à 0 % de TVA : la mention d'exonération devient alors obligatoire sur la ligne, et c'est là que vous portez la mention d'autoliquidation. Les autres documents ne changent pas.",
  },
  {
    title: "Mes devis peuvent-ils être signés en ligne ?",
    content:
      "Oui. Vous envoyez le devis par e-mail, le client le signe électroniquement, et le devis signé se convertit en facture sans ressaisie. Le nombre de signatures électroniques dépend de votre formule.",
  },
  {
    title: "Puis-je travailler depuis le chantier ?",
    content:
      "Oui, depuis votre téléphone : un devis rédigé sur place, une photo de facture d'achat de matériaux qui part directement dans vos dépenses, une situation envoyée en fin de semaine. Votre numérotation reste continue où que vous soyez.",
  },
  {
    title: "La facturation électronique concerne-t-elle les artisans ?",
    content:
      "Oui. Depuis le 1ᵉʳ septembre 2026, toutes les entreprises doivent pouvoir recevoir une facture électronique par une plateforme agréée. L'obligation d'émettre s'étend aux TPE, PME et micro-entreprises à partir du 1ᵉʳ septembre 2027. L'émission comme la réception sont incluses dans Newbi, sans surcoût.",
  },
  {
    title: "Que se passe-t-il pendant les 30 jours offerts ?",
    content:
      "Vous avez accès à toutes les fonctionnalités pendant 30 jours, sans carte bancaire, et vous pouvez éditer de vrais devis et de vraies factures dès le premier jour. À la fin de l'essai, vous choisissez votre formule ; si vous ne faites rien, rien n'est prélevé.",
  },
];

export default function FAQ() {
  const items = questions.map((q) => ({
    question: q.title,
    answer: q.content,
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(items)) }}
      />
      <div className="mx-auto w-full max-w-3xl space-y-7 px-4 pt-10 pb-16 md:pt-20 lg:pt-22">
        <div className="space-y-2 text-center">
          <h2 className="text-balance text-4xl font-medium leading-tight tracking-tight text-gray-950 md:text-5xl lg:text-[3.5rem]">
            Questions fréquentes
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl">
            Les questions que se posent les artisans du bâtiment avant de
            changer d&apos;outil. Si vous ne trouvez pas la vôtre,{" "}
            <a href="/contact" className="underline underline-offset-4">
              écrivez-nous
            </a>
            .
          </p>
        </div>
        <PublicFaq items={items} />
      </div>
    </>
  );
}
