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
    title: \\"Qu'est-ce que newbi ?\\",
    content:
      \\"Newbi est une plateforme tout‑en‑un pour gérer simplement et efficacement votre activité: devis, factures, signature de mail, gestion de tâches en Kanban et transfert de fichiers sécurisé. Notre objectif ? Vous faire gagner du temps du premier contact client jusqu'à l'encaissement.\\",
  },
  {
    id: \\"item-2\\",
    title: \\"À qui s'adresse newbi ?\\",
    content:
      \\"Newbi est une plateforme pensée pour les indépendants, TPE/PME, agences et associations qui veulent centraliser leurs outils commerciaux et administratifs, sans complexité. Newbi convient aussi aux équipes qui collaborent sur des ventes et des projets.\\",
  },
  {
    id: \\"item-3\\",
    title: \\"Comment créer un compte Newbi et vérifier mon adresse e‑mail ?\\",
    content:
      'C\'est très simple, 3 étapes :\n\n• Cliquez sur \\"Inscription\\" depuis la page d\'accueil\n• Renseignez votre mail et un mot de passe robuste\n• Ouvrez l\'e‑mail de confirmation et cliquez sur \\"Vérifier mon adresse\\"',
  },
  {
    id: \\"item-4\\",
    title:
      \\"Quelles sont les premières étapes après l'inscription pour être opérationnel rapidement ?\\",
    content:
      \\"Après votre inscription, plusieurs choses sont à réaliser si vous souhaitez être opérationnel.\n \n• Complétez votre catalogue produits: \nCréez vos produits avec leurs tarifs HT/ TTC, taux de TVA, unités, remises éventuelles\n• Complétez votre annuaire clients: \nAjoutez vos clients(raison sociale, SIREN / SIRET, n°TVA, contacts, adresse de facturation / livraison)\n\nAvec ces données en place, vous pouvez générer vos premiers devis puis les convertir en factures en quelques clics. Passez ensuite à la génération de votre signature professionnelle et celles de vos équipes, si besoin. Une fois ces étapes effectuées, vous êtes prêt à utiliser Newbi de manière fluide et efficace.\\",
  },
  {
    id: \\"item-5\\",
    title:
      \\"Quelles formules et quels prix propose Newbi ? Y a-t-il un essai gratuit ?\\",
    content:
      \\"À l'inscription, vous bénéficiez de 14 jours gratuits, durant lesquels vous pouvez résilier votre abonnement à tout moment.\n\nNewbi propose 3 formules :\n\n• Freelance (1 utilisateur) :\n- Mensuel : 14,59€ HT/mois\n- Annuel : 13,13€ HT/mois (soit 157,56€ HT/an, 10% de réduction)\n\n• PME (10 utilisateurs) :\n- Mensuel : 48,99€ HT/mois\n- Annuel : 44,09€ HT/mois (soit 529,08€ HT/an, 10% de réduction)\n\n• Entreprise (25 utilisateurs) :\n- Mensuel : 94,99€ HT/mois\n- Annuel : 85,49€ HT/mois (soit 1 025,88€ HT/an, 10% de réduction)\n\nVous pouvez à tout moment changer votre abonnement ou le résilier sans conditions.\\",
  },
  {
    id: \\"item-6\\",
    title:
      \\"Quels moyens de paiement sont acceptés pour l'abonnement Newbi et comment modifier ma formule ?\\",
    content:
      \\"Actuellement, l'abonnement Newbi se règle uniquement par carte bancaire. Il suffit d'enregistrer une carte valide dans votre espace client pour démarrer après les 14 jours d'essai gratuit.\\",
  },
  {
    id: \\"item-7\\",
    title: \\"Qui contacter si j'ai une question ou un problème sur Newbi ?\\",
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
