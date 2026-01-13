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
    title: "Comment transférer un fichier avec newbi ?",
    content:
      "C'est très simple : glissez-déposez vos fichiers dans l'interface ou cliquez pour les sélectionner. Vous pouvez ensuite personnaliser le lien de partage, ajouter un mot de passe optionnel et définir une date d'expiration. Une fois validé, partagez le lien généré avec vos destinataires par email ou copier-coller.",
  },
  {
    id: "item-2",
    title:
      "Quelle est la taille maximale des fichiers que je peux transférer ?",
    content:
      "Vous pouvez transférer des fichiers jusqu'à 5 Go par envoi avec newbi. Il n'y a aucune limite sur le nombre de transferts que vous pouvez effectuer. Pour des fichiers encore plus volumineux, contactez notre équipe pour une solution sur mesure.",
  },
  {
    id: "item-3",
    title: "Combien de temps mes fichiers restent-ils disponibles ?",
    content:
      "Par défaut, vos fichiers sont disponibles pendant 7 jours. Vous pouvez personnaliser cette durée lors du transfert (de 1 à 30 jours). Une fois la date d'expiration atteinte, les fichiers sont automatiquement supprimés de nos serveurs pour garantir votre confidentialité.",
  },
  {
    id: "item-4",
    title: "Mes transferts sont-ils sécurisés ?",
    content:
      "Absolument. Tous vos transferts sont protégés par un chiffrement SSL/TLS de bout en bout. Vous pouvez ajouter un mot de passe pour sécuriser l'accès aux fichiers. Vos données sont hébergées en France sur des serveurs sécurisés et nous sommes conformes au RGPD. Aucune publicité ni tracking tiers.",
  },
  {
    id: "item-5",
    title: "Les destinataires doivent-ils avoir un compte newbi ?",
    content:
      "Non, aucune inscription n'est requise pour télécharger les fichiers que vous partagez. Vos destinataires reçoivent simplement un lien qu'ils peuvent ouvrir dans leur navigateur pour télécharger les fichiers. Seul l'expéditeur a besoin d'un compte newbi.",
  },
  {
    id: "item-6",
    title: "Puis-je suivre qui a téléchargé mes fichiers ?",
    content:
      "Oui, vous avez accès à un tableau de bord complet qui vous permet de suivre tous vos transferts. Vous pouvez voir combien de fois chaque fichier a été téléchargé, par qui (si vous avez demandé l'email), et quand. Vous recevez également des notifications par email à chaque téléchargement.",
  },
  {
    id: "item-7",
    title: "Puis-je annuler un transfert après l'avoir envoyé ?",
    content:
      "Oui, vous pouvez désactiver un lien de partage à tout moment depuis votre tableau de bord. Une fois désactivé, le lien ne fonctionnera plus et les fichiers ne seront plus accessibles, même si la date d'expiration n'est pas encore atteinte.",
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
