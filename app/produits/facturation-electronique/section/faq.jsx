import React from "react";
import PublicFaq, { faqJsonLd } from "@/src/components/public-faq";

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
      "La réforme se déploie en deux temps. Depuis le 1er septembre 2026, toutes les entreprises, quelle que soit leur taille, doivent être en mesure de recevoir une facture électronique : cette obligation est déjà en vigueur. L'obligation d'émettre suit ensuite la taille de l'entreprise : grandes entreprises et ETI depuis le 1er septembre 2026, TPE, PME et micro-entreprises à partir du 1er septembre 2027.",
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
      "Le Portail Public de Facturation (PPF) est la plateforme mise en place par l'État français pour centraliser les échanges de factures électroniques. Il permet de transmettre, recevoir et archiver les factures, ainsi que de communiquer les données de transaction à l'administration fiscale. Newbi est un opérateur de dématérialisation : vos factures transitent par une plateforme de dématérialisation partenaire (PDP) immatriculée, qui dialogue avec l'annuaire et l'administration. Vous n'avez donc aucune démarche à faire auprès du portail public.",
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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            faqJsonLd(faqData.map((item) => ({
              question: item.title ?? item.question,
              answer: item.content ?? item.answer,
            })))
          ),
        }}
      />
    <div className="mx-auto w-full max-w-3xl space-y-7 px-4 pt-10 md:pt-20 lg:pt-22 pb-16">
      <div className="space-y-2 text-center">
        <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-balance text-gray-950 mb-4">
          Questions fréquentes
        </h2>
        <p className="text-md font-normal tracking-tight text-gray-600 mx-auto mb-8 max-w-2xl">
          Nous sommes là pour répondre à toutes vos questions. Si vous ne
          trouvez pas l&apos;information recherchée, n&apos;hésitez pas à{" "}
          <a href="/contact" className="underline underline-offset-4">
            nous contacter
          </a>
          .
        </p>
      </div>
      <PublicFaq
        items={faqData.map((item) => ({
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
