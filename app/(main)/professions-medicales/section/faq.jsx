import React from "react";
import PublicFaq, { faqJsonLd } from "@/src/components/public-faq";

/* Les réponses reprennent deux articles du blog : « Facture d'ostéopathe :
   note d'honoraires, TVA et mentions obligatoires » et « Professions libérales
   et facturation électronique : ce qui change vraiment ». Aucun taux, aucun
   plafond de remboursement ni aucune cotation ne sont avancés ici. */
const questions = [
  {
    title: "Note d'honoraires ou facture : quelle différence ?",
    content:
      "Aucune, juridiquement. « Note d'honoraires » est l'usage consacré dans les professions médicales et paramédicales, mais il s'agit du même type de document : un écrit qui atteste du montant réglé par le patient en contrepartie d'un acte. Newbi édite donc des factures, soumises aux mêmes règles de numérotation et de mentions.",
  },
  {
    title: "Comment la mention d'exonération de TVA est-elle gérée ?",
    content:
      "Elle n'est pas devinée, elle est exigée. Dès qu'une ligne est à 0 % de TVA, Newbi réclame la mention d'exonération et la porte sur le document. Vous l'écrivez une fois — pour les soins relevant de l'article 261-4-1° du Code général des impôts, par exemple — et vous l'enregistrez dans votre modèle : elle est reprise sur les documents suivants.",
  },
  {
    title: "Et si une partie de mon activité n'est pas exonérée ?",
    content:
      "L'exonération dépend de la nature de l'acte, pas seulement de la profession : une prestation sans finalité thérapeutique démontrée peut en sortir. Le taux se choisissant ligne par ligne, un même document peut porter des lignes exonérées et des lignes soumises à la TVA. L'appréciation, elle, reste la vôtre.",
  },
  {
    title: "Que doit contenir le document remis au patient ?",
    content:
      "Les mentions habituelles d'une facture : vos coordonnées, celles du patient, le numéro, la date, la nature de l'acte et le montant réglé, plus la mention d'exonération si la ligne est à 0 %. C'est ce que demandent les mutuelles qui remboursent certaines séances, et c'est aussi pour cela qu'il vaut mieux l'éditer à la fin de la séance plutôt que des mois après.",
  },
  {
    title: "Suis-je concerné par la facturation électronique ?",
    content:
      "Cela dépend de vos clients, pas de votre régime de TVA. Un praticien qui ne facture que des patients particuliers relève de l'e-reporting, un envoi de données de transaction à l'administration, et non de la facture électronique. Si vous facturez aussi des entreprises — une clinique, un laboratoire, une mutuelle, un confrère pour une garde —, ces opérations-là entrent dans le champ B2B.",
  },
  {
    title: "Être exonéré de TVA me dispense-t-il de la réforme ?",
    content:
      "Non, et c'est la confusion la plus fréquente. Un professionnel exonéré reste un assujetti au sens fiscal. Surtout, la réception de factures fournisseurs au format électronique est obligatoire pour toutes les entreprises depuis le 1ᵉʳ septembre 2026 : même un praticien qui ne facture que des patients doit pouvoir recevoir les factures de son bailleur, de son fournisseur de matériel ou de ses logiciels.",
  },
  {
    title: "Puis-je suivre les dépenses de mon cabinet ?",
    content:
      "Oui. Photographiez un justificatif — matériel, loyer professionnel, abonnement : il est lu, classé et rapproché de la ligne bancaire correspondante si votre compte est connecté. Chaque dépense garde sa pièce, conservée dix ans.",
  },
  {
    title: "Mon expert-comptable peut-il accéder à mes documents ?",
    content:
      "Oui, et son accès est inclus gratuitement : un en formule Freelance, trois en TPE, cinq en Entreprise. Il consulte vos documents et lance ses exports (CSV, Excel ou FEC selon votre formule) sans occuper de place d'utilisateur.",
  },
  {
    title: "Que se passe-t-il pendant les 30 jours offerts ?",
    content:
      "Vous avez accès à toutes les fonctionnalités pendant 30 jours, sans carte bancaire, et vous pouvez éditer de vraies factures dès le premier jour. À la fin de l'essai, vous choisissez votre formule ; si vous ne faites rien, rien n'est prélevé.",
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
            Les questions que se posent les praticiens libéraux sur leur
            facturation. Si vous ne trouvez pas la vôtre,{" "}
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
