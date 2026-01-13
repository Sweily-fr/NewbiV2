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
    title: "Comment fonctionne la synchronisation bancaire ?",
    content:
      "La synchronisation bancaire se fait via une connexion sécurisée certifiée DSP2 avec votre banque. Vous vous connectez une seule fois avec vos identifiants bancaires, et newbi récupère automatiquement vos transactions en temps réel. Vos identifiants ne sont jamais stockés sur nos serveurs.",
  },
  {
    id: "item-2",
    title: "Quelles banques sont compatibles avec newbi ?",
    content:
      "newbi est compatible avec plus de 300 établissements bancaires en France et en Europe, incluant toutes les grandes banques françaises (BNP Paribas, Société Générale, Crédit Agricole, LCL, Banque Postale, etc.) ainsi que les néobanques (Qonto, Shine, N26, Revolut, etc.).",
  },
  {
    id: "item-3",
    title: "Mes données bancaires sont-elles sécurisées ?",
    content:
      "Absolument. Nous utilisons les protocoles de sécurité les plus stricts : chiffrement SSL/TLS, authentification forte, certification DSP2, et conformité RGPD. Vos identifiants bancaires ne sont jamais stockés. Nous passons par des agrégateurs certifiés et vos données sont hébergées en France sur des serveurs sécurisés.",
  },
  {
    id: "item-4",
    title: "À quelle fréquence mes transactions sont-elles synchronisées ?",
    content:
      "Vos transactions bancaires sont synchronisées automatiquement plusieurs fois par jour. Vous pouvez également forcer une synchronisation manuelle à tout moment depuis votre tableau de bord pour obtenir les dernières opérations en temps réel.",
  },
  {
    id: "item-5",
    title: "Puis-je connecter plusieurs comptes bancaires ?",
    content:
      "Oui, vous pouvez connecter autant de comptes bancaires que vous le souhaitez, qu'ils soient dans la même banque ou dans des établissements différents. Vous bénéficiez ainsi d'une vision consolidée de toute votre trésorerie sur un seul tableau de bord.",
  },
  {
    id: "item-6",
    title: "Le rapprochement bancaire est-il automatique ?",
    content:
      "Oui, newbi effectue automatiquement le rapprochement entre vos transactions bancaires et vos factures. Le système détecte intelligemment les correspondances et marque automatiquement vos factures comme payées. Vous pouvez également effectuer des rapprochements manuels si nécessaire.",
  },
  {
    id: "item-7",
    title: "Que se passe-t-il si je change de banque ?",
    content:
      "Vous pouvez facilement ajouter votre nouveau compte bancaire et désactiver l'ancien. Toutes vos données historiques sont conservées et vous gardez l'accès à l'historique complet de vos transactions passées pour votre comptabilité.",
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
