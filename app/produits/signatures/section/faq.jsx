import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/components/ui/accordion";

const questions = [
  {
    id: "item-1",
    title: "Comment créer une signature de mail avec Newbi ?",
    content:
      "Ouvrez l'outil signature de mail, créez une nouvelle signature, ajoutez le logo, les couleurs, la typographie de votre choix, les coordonnées, les boutons sociaux et champs dynamiques. Vous n'avez plus qu'à copier-coller votre signature et l'enregistrer",
  },
  {
    id: "item-2",
    title: "Puis-je créer des signatures de mail pour toute mon équipe ?",
    content:
      "Oui, il est possible de créer des signatures de mail pour toute votre équipe.",
  },
  {
    id: "item-3",
    title: "Puis-je personnaliser mes signatures de mail ?",
    content:
      "Oui, vous pouvez modifier les couleurs, la police, les boutons sociaux, la disposition des champs pour créer la signature correspondant à votre image de marque.",
  },
  {
    id: "item-4",
    title:
      "La signature générée est-elle responsive et compatible avec les principaux clients mail ?",
    content: "Oui, optimisée pour Gmail, Outlook, Apple Mail et mobile.",
  },
  {
    id: "item-5",
    title: "Qui contacter si j'ai une question ou un problème avec mon outil ?",
    content:
      "Rejoignez la communauté Newbi sur Whatsapp. Il suffit d'y accéder pour rejoindre les groupes thématiques et poser vos questions directement à la communauté et à l'équipe.",
  },
];

export default function FAQ() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-7 px-4 pt-16 pb-16">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl md:text-4xl tracking-tight font-normal">
          Questions fréquentes
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Nous sommes là pour répondre à toutes vos questions. Si vous ne
          trouvez pas l'information recherchée, n'hésitez pas à nous contacter.
        </p>
      </div>
      <Accordion
        type="single"
        collapsible
        className="bg-card dark:bg-card/50 w-full -space-y-px rounded-lg"
        defaultValue="item-1"
      >
        {questions.map((item) => (
          <AccordionItem
            value={item.id}
            key={item.id}
            className="relative border-x first:rounded-t-lg first:border-t last:rounded-b-lg last:border-b"
          >
            <AccordionTrigger className="px-4 py-4 text-[15px] leading-6 hover:no-underline font-normal">
              {item.title}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pb-4 px-4 whitespace-pre-line">
              {item.content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <p className="text-muted-foreground">
        Vous ne trouvez pas ce que vous cherchez ? Contactez notre{" "}
        <a
          href="mailto:contact@newbi.fr"
          className="text-primary hover:underline"
        >
          équipe support
        </a>
      </p>
    </div>
  );
}
