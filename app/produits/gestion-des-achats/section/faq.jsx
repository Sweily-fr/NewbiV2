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
    title: "Comment créer un bon de commande avec Newbi ?",
    content:
      "Créer un bon de commande est simple avec Newbi :\n\n- Cliquez sur 'Nouveau bon de commande' depuis le module Achats\n- Sélectionnez votre fournisseur dans la liste ou créez-en un nouveau\n- Ajoutez les articles avec quantités et prix\n- Validez et envoyez directement par email au fournisseur",
  },
  {
    id: "item-2",
    title: "Comment gérer plusieurs fournisseurs pour un même produit ?",
    content:
      "Newbi vous permet d'associer plusieurs fournisseurs à un même article. Vous pouvez comparer les prix, délais et conditions de chaque fournisseur pour choisir la meilleure option à chaque commande. Le système garde l'historique des achats par fournisseur.",
  },
  {
    id: "item-3",
    title: "Comment fonctionne le rapprochement des factures ?",
    content:
      "Le rapprochement automatique compare votre facture fournisseur avec le bon de commande et le bon de réception (rapprochement 3 voies). Si tout correspond, la facture est validée automatiquement. En cas d'écart, vous êtes alerté pour vérifier et ajuster.",
  },
  {
    id: "item-4",
    title: "Puis-je définir des budgets par catégorie d'achat ?",
    content:
      "Oui ! Vous pouvez créer des budgets par catégorie, département ou projet. Le système vous alerte en temps réel lorsque vous approchez ou dépassez un budget, vous permettant de mieux contrôler vos dépenses.",
  },
  {
    id: "item-5",
    title: "Comment configurer les workflows de validation ?",
    content:
      "Vous pouvez configurer des workflows personnalisés selon les montants, catégories ou fournisseurs. Par exemple, les commandes de plus de 5000€ peuvent nécessiter une double validation. Les validateurs reçoivent des notifications automatiques.",
  },
  {
    id: "item-6",
    title: "Qui contacter si j'ai une question ou un problème ?",
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
