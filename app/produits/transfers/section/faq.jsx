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
    title: "Comment fonctionne l'outil transfert de fichiers Newbi ?",
    content:
      "Glissez‑déposez vos fichiers, obtenez un lien sécurisé à partager au client. Vous pouvez définir un mot de passe, une date d'expiration et une limite de téléchargements. Notifications à chaque téléchargement.",
  },
  {
    id: "item-2",
    title: "Quelle est la taille maximale possible par transfert ?",
    content: "La taille maximale possible par transfert est de 5Go.",
  },
  {
    id: "item-3",
    title:
      "Que se passe-t-il si mon client n'a pas téléchargé les fichiers avant l'expiration du lien ?",
    content:
      "Le lien devient inaccessible. Il faudra créer un nouveau lien avec une nouvelle date d'expiration.",
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
