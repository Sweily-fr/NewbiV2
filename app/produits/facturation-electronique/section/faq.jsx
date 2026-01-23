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
    question: "Qu'est-ce que la facturation électronique ?",
    answer:
      "La facturation électronique (ou e-invoicing) consiste à émettre, transmettre et recevoir des factures dans un format électronique structuré (Factur-X, UBL, CII). Contrairement à une facture PDF simple, la facture électronique contient des données exploitables automatiquement par les systèmes informatiques, facilitant ainsi le traitement et la conformité fiscale.",
  },
  {
    question: "Quand la facturation électronique devient-elle obligatoire ?",
    answer:
      "La réforme de la facturation électronique en France se déploie progressivement : à partir du 1er septembre 2026, toutes les entreprises devront être en mesure de recevoir des factures électroniques. L'obligation d'émettre des factures électroniques s'appliquera selon la taille de l'entreprise : grandes entreprises et ETI en 2026, PME et micro-entreprises en 2027.",
  },
  {
    question: "Qui est concerné par la facturation électronique ?",
    answer:
      "Toutes les entreprises assujetties à la TVA et établies en France sont concernées par cette obligation pour leurs transactions B2B domestiques. Les transactions B2C et internationales sont soumises à l'e-reporting (transmission des données de transaction à l'administration fiscale).",
  },
  {
    question: "Qu'est-ce que le Portail Public de Facturation (PPF) ?",
    answer:
      "Le Portail Public de Facturation (PPF) est la plateforme mise en place par l'État français pour centraliser les échanges de factures électroniques. Il permet de transmettre, recevoir et archiver les factures, ainsi que de communiquer les données de transaction à l'administration fiscale. newbi s'interface directement avec le PPF.",
  },
  {
    question: "Quelle est la différence entre e-invoicing et e-reporting ?",
    answer:
      "L'e-invoicing concerne l'émission et la réception de factures électroniques entre entreprises (B2B). L'e-reporting concerne la transmission des données de transaction à l'administration fiscale pour les opérations non couvertes par l'e-invoicing : ventes aux particuliers (B2C), transactions internationales, etc.",
  },
  {
    question: "newbi est-il conforme à la réforme 2026 ?",
    answer:
      "Oui, newbi intègre nativement la facturation électronique conforme aux exigences de la réforme 2026. Notre solution génère des factures aux formats standards (Factur-X, UBL, CII), s'interface avec le Portail Public de Facturation, et assure l'archivage légal de vos documents pendant 10 ans.",
  },
  {
    question: "Quels formats de factures électroniques sont acceptés ?",
    answer:
      "Les formats acceptés sont : Factur-X (format hybride PDF + XML), UBL (Universal Business Language) et CII (Cross Industry Invoice). newbi génère automatiquement vos factures dans ces formats standards, garantissant leur acceptation par toutes les plateformes conformes.",
  },
  {
    question: "Comment archiver mes factures électroniques ?",
    answer:
      "newbi assure l'archivage à valeur probante de vos factures électroniques, conforme à la norme NF Z42-013. Vos documents sont conservés dans un coffre-fort numérique sécurisé pendant la durée légale de 10 ans, avec horodatage qualifié et garantie d'intégrité.",
  },
];

export default function FAQ() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-gray-950 mb-4">
            Questions fréquentes sur la facturation électronique
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Tout ce que vous devez savoir sur la réforme 2026, l'e-invoicing,
            l'e-reporting et la conformité de vos factures électroniques.
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
