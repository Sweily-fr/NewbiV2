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
    title: "Comment créer un devis avec Newbi ?",
    content:
      "Pour créer un devis avec Newbi, ouvrez l'outil Devis. Cliquez sur 'créer un devis', si votre client se trouve dans votre annuaire client vous avez juste à le rechercher. Sinon, vous pouvez aussi le rechercher à partir de son numéro de SIREN ou SIRET. Remplissez les conditions, échéances, détails produits…",
  },
  {
    id: "item-2",
    title: "Puis-je personnaliser mes devis ?",
    content:
      "Oui ! Le logo, les couleurs, les champs affichés, les conditions de vente, les mentions légales, le pied de page (pénalités de retard, indemnité forfaitaire, IBAN). Vous pouvez aussi définir le préfixe de numérotation (ex. FY25‑).",
  },
  {
    id: "item-3",
    title: "Est-ce que les devis sont conformes à la législation française ?",
    content:
      "Un devis n'est pas une facture mais doit comporter les informations essentielles: identité du prestataire et du client, les caractéristiques principales du bien ou du service, le prix, la TVA applicable, les conditions et durée de validité. Newbi pré remplit ces éléments et vous laisse ajouter vos clauses.",
  },
  {
    id: "item-4",
    title: "Comment suivre le statut de votre devis ?",
    content:
      "Lors de la création de votre devis, vous allez définir une date d'échéance. A partir de ce moment, des rappels automatiques peuvent être envoyés avant l'échéance. Passé la date, le devis passera en 'expiré'. Vous pourrez également mettre à jour le statut de votre devis.",
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
