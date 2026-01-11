"use client";
import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/components/ui/accordion";

const faqData = [
  {
    question: "Qu'est-ce qu'un logiciel de gestion de trésorerie ?",
    answer:
      "Un logiciel de gestion de trésorerie est un outil qui permet de suivre, analyser et prévoir les flux financiers de votre entreprise. Il centralise vos comptes bancaires, automatise le suivi de vos encaissements et décaissements, et vous aide à anticiper vos besoins en cash flow pour prendre les bonnes décisions financières.",
  },
  {
    question: "Comment newbi m'aide à gérer ma trésorerie ?",
    answer:
      "newbi vous offre une vue consolidée de tous vos comptes bancaires, des prévisions de trésorerie automatisées, des alertes personnalisées sur vos seuils critiques, et des rapports détaillés pour piloter votre cash flow. La synchronisation bancaire automatique vous fait gagner du temps et élimine les erreurs de saisie.",
  },
  {
    question: "Puis-je connecter plusieurs comptes bancaires ?",
    answer:
      "Oui, newbi permet de connecter tous vos comptes bancaires professionnels, quelle que soit votre banque. Nous sommes compatibles avec plus de 300 établissements bancaires en France. Vous bénéficiez ainsi d'une vision consolidée de votre trésorerie sur une seule plateforme.",
  },
  {
    question: "Les données bancaires sont-elles sécurisées ?",
    answer:
      "Absolument. newbi utilise les protocoles de sécurité les plus stricts (chiffrement SSL, authentification forte). Nous ne stockons jamais vos identifiants bancaires et passons par des agrégateurs certifiés DSP2. Vos données sont hébergées en France et nous sommes conformes au RGPD.",
  },
  {
    question: "Comment fonctionnent les prévisions de trésorerie ?",
    answer:
      "Nos prévisions de trésorerie s'appuient sur vos données historiques, vos factures en attente de paiement, vos charges récurrentes et vos échéances connues. L'algorithme analyse ces informations pour vous projeter à 30, 60 ou 90 jours et vous alerter en cas de risque de découvert.",
  },
  {
    question: "Puis-je partager mes données avec mon expert-comptable ?",
    answer:
      "Oui, newbi facilite la collaboration avec votre expert-comptable. Vous pouvez lui donner un accès dédié à votre espace, exporter vos données au format compatible avec les logiciels comptables, et générer des rapports financiers prêts à l'emploi pour vos échanges.",
  },
  {
    question: "Le suivi de trésorerie est-il inclus dans l'abonnement newbi ?",
    answer:
      "Oui, le module de gestion de trésorerie est inclus dans toutes les offres newbi. Vous bénéficiez du tableau de bord, de la synchronisation bancaire, des prévisions et des alertes sans surcoût. Consultez nos tarifs pour découvrir l'offre adaptée à votre entreprise.",
  },
  {
    question: "Puis-je accéder à ma trésorerie depuis mon mobile ?",
    answer:
      "Oui, newbi est accessible depuis n'importe quel appareil (ordinateur, tablette, smartphone). Notre interface responsive vous permet de consulter votre trésorerie, valider des paiements et recevoir des alertes où que vous soyez.",
  },
];

export default function FAQ() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-gray-950 mb-4">
            Questions fréquentes sur la gestion de trésorerie
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Tout ce que vous devez savoir sur notre logiciel de suivi de
            trésorerie et de cash flow pour les PME et entrepreneurs.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqData.map((item, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border border-gray-200 rounded-lg px-6"
            >
              <AccordionTrigger className="text-left font-medium text-gray-900 hover:no-underline py-4">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pb-4">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
