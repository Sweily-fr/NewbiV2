import React from "react";
import PublicFaq, { faqJsonLd } from "@/src/components/public-faq";

/* Les règles métier viennent des articles « Facture d'avocat » et
   « Facturation cabinet d'avocats » du blog. Ce qui relève de l'application —
   taux de TVA à la ligne, mention d'exonération exigée dès 0 %, factures
   d'acompte, champs personnalisés, chronomètre sur les tâches — est décrit
   d'après le modèle de données réel : rien n'est annoncé qui n'existe pas. */
const questions = [
  {
    title: "Newbi édite-t-il la convention d'honoraires ?",
    content:
      "Non. La convention d'honoraires est un document propre à votre relation client, obligatoire pour toute mission depuis la loi Macron du 6 août 2015 et signée avant les diligences. Newbi édite ce qui en découle : vos factures d'honoraires, vos factures d'acompte et vos avoirs. Vous pouvez porter la référence de la convention sur chaque document via un champ personnalisé.",
  },
  {
    title: "Comment distinguer honoraires et débours sur la facture ?",
    content:
      "Par le taux de TVA, qui se choisit ligne par ligne. Vos honoraires sont à 20 %, et les débours — sommes avancées pour le compte du client, comme les frais de greffe ou d'huissier — se portent sur une ligne à 0 % refacturée à l'euro près. Dès qu'une ligne est à 0 %, Newbi exige la mention d'exonération correspondante et l'affiche sur le document.",
  },
  {
    title: "Puis-je demander une provision avant d'engager la mission ?",
    content:
      "Oui, avec une facture d'acompte : c'est un type de document à part entière dans Newbi, avec son montant et sa place dans votre numérotation continue. Les factures émises ensuite s'imputent sur ce qui a déjà été réglé. Attention à ne pas confondre avec la provision versée sur le compte CARPA, qui relève de votre organisation et non du logiciel.",
  },
  {
    title: "Puis-je suivre le temps passé par dossier ?",
    content:
      "Oui. Chaque tâche de vos tableaux de projet dispose d'un chronomètre, d'un historique de saisies, d'un taux horaire et d'une règle d'arrondi. Vous suivez ainsi les diligences dossier par dossier, puis vous reportez le montant sur la facture — la conversion n'est pas automatique.",
  },
  {
    title: "Un avocat peut-il bénéficier de la franchise en base de TVA ?",
    content:
      "Non. Les avocats sont assujettis à la TVA au taux normal de 20 % sur leurs honoraires, dès le premier euro de chiffre d'affaires, sans possibilité de franchise en base — contrairement à d'autres professions libérales. Vos documents sont donc paramétrés avec la TVA active.",
  },
  {
    title: "Et pour un client établi hors de France ?",
    content:
      "Les prestations rendues à un client situé hors de l'Union européenne sont exonérées au titre de l'export de services, et celles rendues à un assujetti dans un autre État membre relèvent de l'autoliquidation. Dans les deux cas, vous passez la ligne à 0 % et vous portez la mention qui convient dans le texte d'exonération : Newbi n'a pas de réglage dédié à ces régimes.",
  },
  {
    title: "Mes factures doivent-elles détailler les diligences ?",
    content:
      "C'est fortement recommandé : la nature, la date et la durée de chaque diligence sont ce qui évite une contestation d'honoraires. Chaque ligne de facture porte une description, une quantité, une unité et un prix unitaire, ce qui permet de détailler autant que nécessaire.",
  },
  {
    title: "Mon cabinet peut-il travailler à plusieurs sur le même espace ?",
    content:
      "Oui. La formule Freelance couvre un utilisateur, TPE jusqu'à dix et Entreprise jusqu'à vingt-cinq, auxquels s'ajoutent les accès comptables gratuits. Chacun travaille sur les mêmes dossiers et les mêmes documents, sans fichier qui circule par e-mail.",
  },
  {
    title: "Que se passe-t-il pendant les 30 jours offerts ?",
    content:
      "Vous avez accès à toutes les fonctionnalités pendant 30 jours, sans carte bancaire, et vous pouvez éditer de vraies factures d'honoraires dès le premier jour. À la fin de l'essai, vous choisissez votre formule ; si vous ne faites rien, rien n'est prélevé.",
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
            Les questions que se posent les avocats sur la facturation de leurs
            honoraires. Si vous ne trouvez pas la vôtre,{" "}
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
