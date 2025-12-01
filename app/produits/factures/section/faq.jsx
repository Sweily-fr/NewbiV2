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
    title: "Comment créer ma première facture avec Newbi ?",
    content:
      "Avec Newbi, deux façons s'offrent à vous pour créer et éditer vos factures.\n\n- Cliquez sur le bouton créer la facture -> l'éditeur de facture s'ouvre. Presque toutes les informations sont déjà préremplies. \n- Modifier au besoin vos conditions de paiement, échéance, remises, notes/mentions légales et numérotation. \n- Enregistrez, puis envoyez la facture par e-mail.",
  },
  {
    id: "item-2",
    title: "Puis-je personnaliser mes factures ?",
    content:
      "Oui ! Le logo, les couleurs, les champs affichés, les conditions de vente, les mentions légales, le pied de page (pénalités de retard, indemnité forfaitaire, IBAN). Vous pouvez aussi définir le préfixe de numérotation (ex. FY25-).",
  },
  {
    id: "item-3",
    title: "Comment modifier mes informations entreprises clients ?",
    content:
      "Pour modifier vos informations clients, rendez vous dans la page Clients > Sélectionnez le client > Modifier. Les changements s'appliquent aux prochaines factures. Les documents déjà émis restent inchangés pour assurer la traçabilité.",
  },
  {
    id: "item-4",
    title:
      "Est-ce que les factures sont conformes à la législation française ?",
    content:
      "Newbi vous aide à respecter les exigences clés: numérotation continue et inaltérable, date d'émission, identité vendeur/acheteur, N° TVA quand applicable, détail des lignes, taux et montants de TVA, totaux HT/TVA/TTC, échéance, conditions de paiement, pénalités et indemnité forfaitaire, mentions spécifiques si exonération. L'export et l'archivage sont disponibles pour votre comptabilité.",
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
