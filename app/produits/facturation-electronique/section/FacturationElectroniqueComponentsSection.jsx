"use client";
import React from "react";
import { Check, ChevronRight } from "lucide-react";
import Link from "next/link";

const DashedLine = ({ position, orientation = "horizontal", style = {} }) => {
  const baseStyle = {
    "--background": "#ffffff",
    "--color": "rgba(0, 0, 0, 0.2)",
    "--color-dark": "rgba(255, 255, 255, 0.5)",
    "--fade-stop": "90%",
    maskComposite: "exclude",
    ...style,
  };

  if (orientation === "horizontal") {
    return (
      <div
        className={`absolute left-[calc(var(--offset)/2*-1)] h-[var(--height)] w-[calc(100%+var(--offset))] bg-[linear-gradient(to_right,var(--color),var(--color)_50%,transparent_0,transparent)] [background-size:var(--width)_var(--height)] [mask:linear-gradient(to_left,var(--background)_var(--fade-stop),transparent),_linear-gradient(to_right,var(--background)_var(--fade-stop),transparent),_linear-gradient(black,black)] [mask-composite:exclude] z-30 dark:bg-[linear-gradient(to_right,var(--color-dark),var(--color-dark)_50%,transparent_0,transparent)] ${position}`}
        style={{
          ...baseStyle,
          "--height": "1px",
          "--width": "5px",
          "--offset": "200px",
        }}
      />
    );
  }

  return (
    <div
      className={`absolute top-[calc(var(--offset)/2*-1)] h-[calc(100%+var(--offset))] w-[var(--width)] bg-[linear-gradient(to_bottom,var(--color),var(--color)_50%,transparent_0,transparent)] [background-size:var(--width)_var(--height)] [mask:linear-gradient(to_top,var(--background)_var(--fade-stop),transparent),_linear-gradient(to_bottom,var(--background)_var(--fade-stop),transparent),_linear-gradient(black,black)] [mask-composite:exclude] z-30 dark:bg-[linear-gradient(to_bottom,var(--color-dark),var(--color-dark)_50%,transparent_0,transparent)] ${position}`}
      style={{
        ...baseStyle,
        "--height": "5px",
        "--width": "1px",
        "--offset": "150px",
      }}
    />
  );
};

const ImageCard = ({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
}) => (
  <img
    draggable="false"
    alt={alt}
    loading={priority ? "eager" : "lazy"}
    width={width}
    height={height}
    decoding="async"
    className={`relative z-40 w-full max-w-none flex-none rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06),0_8px_20px_-5px_rgba(25,28,33,0.12)] ring-1 ring-gray-950/5 ${className}`}
    src={src}
  />
);

const FeatureBlock = ({
  badge,
  title,
  description,
  features,
  imageSrc,
  imageAlt,
  badgeImage,
  reversed = false,
}) => {
  return (
    <div className="max-w-7xl mx-auto pt-6 pb-4 px-4 sm:px-6 lg:px-12">
      <div
        className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start ${reversed ? "" : ""}`}
      >
        {/* Text Content */}
        <div className={`${reversed ? "lg:order-2 lg:pl-12" : "lg:order-1"}`}>
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-[#5A50FF] mb-3">
            {badge}
          </span>
          <h2 className="text-3xl font-normal tracking-[-0.015em] text-balance text-gray-950 dark:text-gray-50">
            {title}
          </h2>
          <p className="mt-4 max-w-md text-base/6 text-gray-600 dark:text-gray-400">
            {description}
          </p>

          <ul className="mt-6 space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#5A50FF]/10 flex items-center justify-center mt-0.5">
                  <Check className="w-3 h-3 text-[#5A50FF]" />
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          <Link
            href="/auth/signup"
            className="mt-8 inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-[#202020] rounded-lg hover:bg-[#333333] transition-colors"
          >
            Essayer gratuitement
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Image Content */}
        <div
          className={`relative ${reversed ? "lg:order-1 lg:-ml-40" : "lg:order-2 lg:-mr-40"}`}
        >
          <DashedLine position="-top-px" orientation="horizontal" />
          <DashedLine position="-left-px" orientation="vertical" />
          {badgeImage && (
            <img
              src={badgeImage}
              alt="Badge Facturation Électronique"
              className="absolute top-4 right-4 w-[100px] xl:w-[120px] h-auto object-contain drop-shadow-lg z-50"
            />
          )}
          <ImageCard
            src={imageSrc}
            alt={imageAlt}
            width={1760}
            height={1408}
            className={`object-cover min-h-[300px] sm:min-h-[400px] lg:min-h-[600px] w-full ${reversed ? "object-left lg:object-[-32%_100%]" : "object-left"}`}
            priority
          />
        </div>
      </div>
    </div>
  );
};

export default function FacturationElectroniqueComponentsSection() {
  const sections = [
    {
      badge: "RÉFORME 2026",
      title: "Préparez-vous à l'obligation de facturation électronique",
      description:
        "La réforme de la facturation électronique entre en vigueur progressivement à partir de 2026. Anticipez dès maintenant cette obligation légale avec newbi et assurez la conformité de votre entreprise.",
      features: [
        "Conformité avec la réforme de la facturation électronique 2026",
        "Formats standards : Factur-X, UBL, CII",
        "Transmission automatique vers le Portail Public de Facturation (PPF)",
        "Archivage légal des factures pendant 10 ans",
        "Certificat d'authenticité et d'intégrité des documents",
        "Mise à jour automatique selon les évolutions réglementaires",
        "Accompagnement personnalisé pour la transition",
        "Formation et support inclus",
      ],
      imageSrc: "/sectionComponents1.png",
      imageAlt: "Facturation électronique 2026 - Conformité réforme",
      reversed: false,
    },
    {
      badge: "E-INVOICING",
      title: "Émettez et recevez vos factures au format électronique",
      description:
        "Simplifiez vos échanges B2B avec la facturation électronique. Envoyez et recevez des factures dématérialisées conformes aux normes en vigueur, directement depuis votre interface newbi.",
      features: [
        "Création de factures électroniques en quelques clics",
        "Réception et traitement automatique des factures fournisseurs",
        "Validation automatique des données obligatoires",
        "Signature électronique qualifiée intégrée",
        "Piste d'audit fiable (PAF) automatisée",
        "Interopérabilité avec les plateformes partenaires",
        "Notification en temps réel des statuts de factures",
        "Tableau de bord de suivi des flux e-invoicing",
      ],
      imageSrc: "/sectionComponents2.png",
      imageAlt: "E-invoicing - Factures électroniques B2B",
      badgeImage: "/badgeFacturation.png",
      reversed: true,
    },
    {
      badge: "E-REPORTING",
      title: "Transmettez vos données de transaction à l'administration",
      description:
        "L'e-reporting est obligatoire pour les transactions B2C et internationales. newbi automatise la transmission de vos données fiscales vers l'administration, en toute conformité.",
      features: [
        "Transmission automatique des données de transaction",
        "Conformité e-reporting pour les ventes B2C",
        "Déclaration des opérations internationales",
        "Génération automatique des fichiers de reporting",
        "Historique complet des transmissions",
        "Alertes en cas d'anomalie ou de rejet",
        "Rapports de conformité exportables",
        "Intégration avec votre comptabilité",
      ],
      imageSrc: "/sectionComponents3.png",
      imageAlt: "E-reporting - Transmission données fiscales",
      reversed: false,
    },
    {
      badge: "SÉCURITÉ & ARCHIVAGE",
      title: "Archivez vos factures électroniques en toute sécurité",
      description:
        "La conservation des factures électroniques est une obligation légale. newbi garantit un archivage sécurisé, conforme aux exigences fiscales, avec une traçabilité complète.",
      features: [
        "Archivage à valeur probante certifié NF Z42-013",
        "Conservation légale pendant 10 ans minimum",
        "Coffre-fort numérique sécurisé",
        "Horodatage qualifié des documents",
        "Accès rapide et recherche avancée",
        "Export des archives sur demande",
        "Hébergement des données en France (RGPD)",
        "Sauvegarde redondante et plan de reprise",
      ],
      imageSrc: "/sectionComponents1.png",
      imageAlt: "Archivage factures électroniques - Coffre-fort numérique",
      reversed: true,
    },
  ];

  return (
    <section
      id="features"
      className="relative isolate overflow-hidden pt-10 sm:pt-20 bg-white"
    >
      <div className="flex flex-col gap-20 sm:gap-32">
        {sections.map((section, index) => (
          <FeatureBlock
            key={index}
            badge={section.badge}
            title={section.title}
            description={section.description}
            features={section.features}
            imageSrc={section.imageSrc}
            imageAlt={section.imageAlt}
            badgeImage={section.badgeImage}
            reversed={section.reversed}
          />
        ))}
      </div>
    </section>
  );
}
