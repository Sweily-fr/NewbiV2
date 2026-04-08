import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/components/ui/accordion";

const faqData = [
  {
    id: "item-1",
    title: "Qu'est-ce que la facturation électronique ?",
    content:
      "La facturation électronique (ou e-invoicing) consiste à émettre, transmettre et recevoir des factures dans un format électronique structuré (Factur-X, UBL, CII). Contrairement à une facture PDF simple, la facture électronique contient des données exploitables automatiquement par les systèmes informatiques, facilitant ainsi le traitement et la conformité fiscale.",
  },
  {
    id: "item-2",
    title: "Quand la facturation électronique devient-elle obligatoire ?",
    content:
      "La réforme de la facturation électronique en France se déploie progressivement : à partir du 1er septembre 2026, toutes les entreprises devront être en mesure de recevoir des factures électroniques. L'obligation d'émettre des factures électroniques s'appliquera selon la taille de l'entreprise : grandes entreprises et ETI en 2026, PME et micro-entreprises en 2027.",
  },
  {
    id: "item-3",
    title: "Qui est concerné par la facturation électronique ?",
    content:
      "Toutes les entreprises assujetties à la TVA et établies en France sont concernées par cette obligation pour leurs transactions B2B domestiques. Les transactions B2C et internationales sont soumises à l'e-reporting (transmission des données de transaction à l'administration fiscale).",
  },
  {
    id: "item-4",
    title: "Qu'est-ce que le Portail Public de Facturation (PPF) ?",
    content:
      "Le Portail Public de Facturation (PPF) est la plateforme mise en place par l'État français pour centraliser les échanges de factures électroniques. Il permet de transmettre, recevoir et archiver les factures, ainsi que de communiquer les données de transaction à l'administration fiscale. newbi s'interface directement avec le PPF.",
  },
  {
    id: "item-5",
    title: "Quelle est la différence entre e-invoicing et e-reporting ?",
    content:
      "L'e-invoicing concerne l'émission et la réception de factures électroniques entre entreprises (B2B). L'e-reporting concerne la transmission des données de transaction à l'administration fiscale pour les opérations non couvertes par l'e-invoicing : ventes aux particuliers (B2C), transactions internationales, etc.",
  },
  {
    id: "item-6",
    title: "newbi est-il conforme à la réforme 2026 ?",
    content:
      "Oui, newbi intègre nativement la facturation électronique conforme aux exigences de la réforme 2026. Notre solution génère des factures aux formats standards (Factur-X, UBL, CII), s'interface avec le Portail Public de Facturation, et assure l'archivage légal de vos documents pendant 10 ans.",
  },
  {
    id: "item-7",
    title: "Quels formats de factures électroniques sont acceptés ?",
    content:
      "Les formats acceptés sont : Factur-X (format hybride PDF + XML), UBL (Universal Business Language) et CII (Cross Industry Invoice). newbi génère automatiquement vos factures dans ces formats standards, garantissant leur acceptation par toutes les plateformes conformes.",
  },
  {
    id: "item-8",
    title: "Comment archiver mes factures électroniques ?",
    content:
      "newbi assure l'archivage à valeur probante de vos factures électroniques, conforme à la norme NF Z42-013. Vos documents sont conservés dans un coffre-fort numérique sécurisé pendant la durée légale de 10 ans, avec horodatage qualifié et garantie d'intégrité.",
  },
];

export default function FAQ() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-7 px-4 pt-10 md:pt-20 lg:pt-22 pb-16">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl md:text-[2.5rem] font-medium tracking-[-0.015em] text-balance text-gray-950 mb-4">
          Questions fréquentes
        </h2>
        <p className="text-md font-normal tracking-tight text-gray-600 mx-auto mb-8 max-w-2xl">
          Nous sommes là pour répondre à toutes vos questions. Si vous ne
          trouvez pas l&apos;information recherchée, n&apos;hésitez pas à nous contacter.
        </p>
      </div>
      <Accordion
        type="single"
        collapsible
        className="bg-card dark:bg-card/50 w-full -space-y-px rounded-lg"
        defaultValue="item-1"
      >
        {faqData.map((item) => (
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
