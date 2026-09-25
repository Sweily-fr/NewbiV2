import React from "react";
import PublicFaq, { faqJsonLd } from "@/src/components/public-faq";

const questions = [
  {
    id: "item-1",
    title: "Comment utiliser le Kanban avec Newbi ?",
    content:
      "Créez des colonnes personnalisées, ajoutez des cartes pour vos tâches, glissez-déposez les entre les colonnes, assignez des membres et suivez l'avancement de vos projets en temps réel.",
  },
  {
    id: "item-2",
    title: "Puis-je partager mon Kanban avec mon équipe ?",
    content:
      "Oui, vous pouvez inviter des membres de votre équipe à collaborer sur vos tableaux Kanban.",
  },
  {
    id: "item-3",
    title: "Puis-je personnaliser les colonnes de mon Kanban ?",
    content:
      "Oui, vous pouvez créer, renommer, réorganiser et supprimer des colonnes selon vos besoins.",
  },
  {
    id: "item-4",
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
            faqJsonLd(questions.map((item) => ({
              question: item.title ?? item.question,
              answer: item.content ?? item.answer,
            })))
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
