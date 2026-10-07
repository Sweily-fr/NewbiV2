import React from "react";
import PublicFaq, { faqJsonLd } from "@/src/components/public-faq";

// Les questions portent sur ce que la page montre réellement : OCR des
// justificatifs, rapprochement bancaire, TVA, notes de frais et export
// comptable. L'ancienne série (bons de commande, workflows de validation,
// budgets par catégorie) décrivait des fonctionnalités inexistantes — et
// elle était déclarée telle quelle à Google en JSON-LD.
const questions = [
  {
    id: "item-1",
    title: "Un justificatif photographié a-t-il la même valeur qu'un papier ?",
    content:
      "Oui, sous conditions. Depuis l'arrêté du 22 mars 2017, une facture papier numérisée a la même valeur probante que l'original si la copie est fidèle et durable. Newbi conserve le fichier d'origine, non modifié, avec sa date d'import. Vous pouvez donc jeter le ticket — mais gardez les originaux des documents soumis à une conservation particulière (actes notariés, documents douaniers).",
  },
  {
    id: "item-2",
    title: "Que lit exactement l'OCR sur une facture d'achat ?",
    content:
      "Le fournisseur, la date d'émission, le montant HT, le montant TTC et la TVA. Ces champs sont préremplis et restent modifiables : vous validez d'un clic, ou vous corrigez si le document est illisible. Formats acceptés : photo prise au téléphone (JPG, PNG, HEIC), PDF et PDF scanné.",
  },
  {
    id: "item-3",
    title: "Comment mes achats sont-ils rapprochés de mes transactions ?",
    content:
      "Une fois votre compte bancaire connecté, Newbi rapproche chaque justificatif de l'opération correspondante à partir du montant, de la date et du libellé. Vous voyez en permanence combien de transactions attendent encore leur pièce, et vous pouvez rattacher une pièce à la main en deux clics.",
  },
  {
    id: "item-4",
    title: "Puis-je gérer mes notes de frais dans Newbi ?",
    content:
      "Oui. Repas, carburant, péages, hébergement, fournitures : vous photographiez le reçu au moment de la dépense, Newbi lit le montant et la TVA, et classe la dépense dans sa catégorie. Tout arrive dans le même export que vos factures d'achat, sans tableur intermédiaire.",
  },
  {
    id: "item-5",
    title: "La TVA déductible est-elle calculée automatiquement ?",
    content:
      "La TVA lue sur chaque justificatif est reprise ligne à ligne et cumulée sur le mois. Vous retrouvez le total de TVA déductible dans l'export, avec le détail par taux — de quoi préparer votre déclaration sans reprendre les pièces une par une.",
  },
  {
    id: "item-6",
    title: "Sous quel format mon expert-comptable récupère-t-il mes achats ?",
    content:
      "Au format FEC, CSV, Sage ou Cegid, avec les justificatifs attachés. Vous exportez le mois complet en une fois, ou vous donnez à votre comptable un accès gratuit à votre espace pour qu'il vienne chercher les pièces lui-même.",
  },
  {
    id: "item-7",
    title: "Qui contacter si j'ai une question ou un problème ?",
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
            faqJsonLd(
              questions.map((item) => ({
                question: item.title ?? item.question,
                answer: item.content ?? item.answer,
              })),
            ),
          ),
        }}
      />
      <div className="mx-auto w-full max-w-3xl space-y-7 px-4 pt-10 md:pt-20 lg:pt-22 pb-0">
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
