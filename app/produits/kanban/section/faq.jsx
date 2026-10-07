import React from "react";
import PublicFaq, { faqJsonLd } from "@/src/components/public-faq";

const questions = [
  {
    id: "item-1",
    title: "Comment organiser mes projets dans Newbi ?",
    content:
      "Vous créez un tableau par projet ou par client, puis une colonne par étape de votre façon de travailler : à faire, en cours, en attente du client, terminé. Chaque tâche est une carte que vous déplacez d'une colonne à l'autre au fur et à mesure. Vous voyez où en est chaque projet d'un seul coup d'œil, sans avoir à ouvrir un tableur ni à relancer qui que ce soit.",
  },
  {
    id: "item-2",
    title: "C'est quoi un tableau kanban, concrètement ?",
    content:
      "C'est une méthode d'organisation visuelle née dans l'industrie : le travail est représenté par des cartes, posées dans des colonnes qui correspondent aux étapes d'avancement. On déplace une carte vers la droite à mesure qu'elle progresse. L'intérêt tient en une phrase : on voit immédiatement ce qui est bloqué, ce qui attend et ce qui est terminé. Aucune connaissance préalable n'est nécessaire pour l'utiliser.",
  },
  {
    id: "item-3",
    title: "Puis-je travailler à plusieurs sur le même projet ?",
    content:
      "Oui. Vous invitez les membres de votre équipe sur un tableau, vous leur assignez des tâches et chacun voit les déplacements des autres en temps réel. Personne n'a besoin de demander qui fait quoi : c'est écrit sur la carte.",
  },
  {
    id: "item-4",
    title: "Puis-je adapter les étapes à ma façon de travailler ?",
    content:
      "Oui. Les colonnes se créent, se renomment, se réorganisent et se suppriment librement. Un graphiste n'aura pas les mêmes étapes qu'un artisan ou qu'un cabinet de conseil : le tableau se plie à votre méthode, pas l'inverse.",
  },
  {
    id: "item-5",
    title: "Mes clients peuvent-ils suivre l'avancement de leur projet ?",
    content:
      "Oui. Vous partagez un lien de consultation : votre client ouvre le tableau dans son navigateur, sans créer de compte, et voit l'avancement en lecture seule. Cela remplace la plupart des e-mails de point d'étape.",
  },
  {
    id: "item-6",
    title: "Puis-je voir mes projets autrement qu'en colonnes ?",
    content:
      "Trois vues du même projet, au choix et en un clic : la vue Board pour l'avancement en colonnes, la vue Liste pour tout voir en tableau avec statut, priorité, responsable et échéance, et la vue Gantt pour situer les livrables dans le temps. Vous ne ressaisissez rien en changeant de vue.",
  },
  {
    id: "item-7",
    title:
      "La gestion de projet est-elle reliée à mes devis et à mes factures ?",
    content:
      "C'est la différence avec un outil de gestion de projet isolé : vos projets, vos clients, vos devis et vos factures vivent dans le même espace Newbi. Un projet terminé se facture sans rien recopier, et vous retrouvez l'historique du client à côté de ses tâches.",
  },
  {
    id: "item-8",
    title: "Faut-il payer un supplément pour la gestion de projet ?",
    content:
      "Non. Elle est incluse dans l'abonnement Newbi, au même titre que la facturation, les devis et les signatures e-mail. Vous testez l'ensemble 30 jours gratuitement, sans carte bancaire et sans engagement.",
  },
  {
    id: "item-9",
    title: "Qui contacter si j'ai une question ou un problème avec mon outil ?",
    content:
      "Rejoignez la communauté Newbi sur Whatsapp. Il suffit d'y accéder pour rejoindre les groupes thématiques et poser vos questions directement à la communauté et à l'équipe.",
  },
];

export default function FAQ() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            faqJsonLd(
              questions.map((item) => ({
                question: item.title ?? item.question,
                answer: item.content ?? item.answer,
              })),
            ),
          ),
        }}
      />
      <div className="mx-auto w-full max-w-3xl space-y-7 px-4 pt-10 md:pt-20 lg:pt-22 pb-16">
        <div className="space-y-2 text-center">
          <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-balance text-gray-950">
            Questions fréquentes
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Nous sommes là pour répondre à toutes vos questions. Si vous ne
            trouvez pas l'information recherchée, n'hésitez pas à{" "}
            <a href="/contact" className="underline underline-offset-4">
              nous contacter
            </a>
            .
          </p>
        </div>
        <PublicFaq
          items={questions.map((item) => ({
            question: item.title ?? item.question,
            answer: item.content ?? item.answer,
          }))}
        />
        <p className="text-muted-foreground">
          Vous ne trouvez pas ce que vous cherchez ? Contactez notre{" "}
          <a
            href="/contact"
            className="text-primary underline underline-offset-4"
          >
            équipe support
          </a>
        </p>
      </div>
    </>
  );
}
