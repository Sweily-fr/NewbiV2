import React from \\"react\\";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from \\"@/src/components/ui/accordion\\";

const questions = [
  {
    id: \\"item-1\\",
    title: \\"Comment utiliser l'outil tableau Kanban ?\\",
    content:
      \\"Créez un tableau: \n- Outils Kanban > Créer un tableau > nommez-le.\n- Ouvrez-le en cliquant sur le tableau créé.\n- Structurez vos colonnes: À faire → En cours → Fait (ajoutez/renommez si besoin).\n- Ajoutez des tâches: bouton Nouvelle tâche (titre, description, échéance, responsable, priorité).\n- Mettez à jour: glissez-déposez les tâches entre les colonnes, modifiez statut/échéance/priorité.\n- Priorisez: placez les plus importantes en haut, utilisez étiquettes ou niveaux (P1/P2/P3).\n- Terminez: déplacez en Fait puis archivez pour garder l'historique propre.\\",
  },
  {
    id: \\"item-2\\",
    title: \\"Qui contacter si j'ai une question ou un problème avec mon outil ?\\",
    content:
      \\"Rejoignez la communauté Newbi sur Whatsapp. Il suffit d'y accéder pour rejoindre les groupes thématiques et poser vos questions directement à la communauté et à l'équipe.\\",
  },
];

export default function FAQ() {
  return (
    <div className=\\"mx-auto w-full max-w-3xl space-y-7 px-4 pt-16 pb-16\\">
      <div className=\\"space-y-2 text-center\\">
        <h2 className=\\"text-3xl md:text-4xl tracking-tight font-normal\\">
          Questions fréquentes
        </h2>
        <p className=\\"text-muted-foreground max-w-2xl mx-auto\\">
          Nous sommes là pour répondre à toutes vos questions. Si vous ne
          trouvez pas l'information recherchée, n'hésitez pas à nous contacter.
        </p>
      </div>
      <Accordion
        type=\\"single\\"
        collapsible
        className=\\"bg-card dark:bg-card/50 w-full -space-y-px rounded-lg\\"
        defaultValue=\\"item-1\\"
      >
        {questions.map((item) => (
          <AccordionItem
            value={item.id}
            key={item.id}
            className=\\"relative border-x first:rounded-t-lg first:border-t last:rounded-b-lg last:border-b\\"
          >
            <AccordionTrigger className=\\"px-4 py-4 text-[15px] leading-6 hover:no-underline font-normal\\">
              {item.title}
            </AccordionTrigger>
            <AccordionContent className=\\"text-muted-foreground pb-4 px-4 whitespace-pre-line\\">
              {item.content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <p className=\\"text-muted-foreground\\">
        Vous ne trouvez pas ce que vous cherchez ? Contactez notre{\\" \\"}
        <a
          href=\\"mailto:contact@newbi.fr\\"
          className=\\"text-primary hover:underline\\"
        >
          équipe support
        </a>
      </p>
    </div>
  );
}
