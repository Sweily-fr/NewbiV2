import React from "react";
import PublicFaq, { faqJsonLd } from "@/src/components/public-faq";

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
    <div className="mx-auto w-full max-w-3xl space-y-7 px-4 pt-16 pb-16">
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
