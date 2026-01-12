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
          {/* {badgeImage && (
            <img
              src={badgeImage}
              alt="Badge Facturation Électronique"
              className="absolute top-4 right-[20px] w-[100px] xl:w-[120px] h-auto object-contain drop-shadow-lg z-50"
            />
          )} */}
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

export default function FacturesComponentsSection() {
  const sections = [
    {
      badge: "GESTION COMPLÈTE",
      title: "Gérez facilement devis, factures et paiements",
      description:
        "Simplifiez votre cycle de vente complet : créez des devis professionnels, convertissez-les en factures en un clic et suivez vos encaissements. Une solution de facturation intuitive pour les entrepreneurs et PME.",
      features: [
        "Création de devis et factures professionnels en quelques clics",
        "Conversion automatique des devis en factures",
        "Personnalisation complète de vos documents commerciaux",
        "Gestion des acomptes et factures d'avoir",
        "Numérotation automatique conforme à la réglementation",
        "Envoi par email avec suivi de lecture",
        "Paiement en ligne intégré pour vos clients",
        "Export PDF et archivage sécurisé",
      ],
      imageSrc: "/lp/factures/facture1.png",
      imageAlt: "Logiciel de facturation - Création de devis et factures",
      reversed: false,
    },
    {
      badge: "AUTOMATISATION",
      title: "Automatisez vos processus de facturation",
      description:
        "Gagnez du temps grâce à l'automatisation intelligente. Factures récurrentes, relances automatiques et rappels de paiement : concentrez-vous sur votre activité pendant que newbi gère votre facturation.",
      features: [
        "Factures récurrentes et abonnements automatisés",
        "Relances clients automatiques et personnalisables",
        "Rappels de paiement programmés avant échéance",
        "Modèles de factures réutilisables",
        "Calcul automatique de la TVA et des remises",
        "Duplication rapide de documents existants",
        "Workflows de validation personnalisables",
        "Intégration avec votre logiciel comptable",
      ],
      imageSrc: "/lp/factures/facture2.png",
      imageAlt: "Automatisation facturation - Factures récurrentes et relances",
      badgeImage: "/badgeFacturation.png",
      reversed: true,
    },
    {
      badge: "SUIVI EN TEMPS RÉEL",
      title: "Suivez vos factures et vos encaissements",
      description:
        "Gardez une vision claire de votre trésorerie. Tableau de bord en temps réel, suivi des paiements et rapports détaillés pour piloter efficacement votre activité de facturation.",
      features: [
        "Tableau de bord avec indicateurs clés de facturation",
        "Suivi du statut de chaque facture en temps réel",
        "Alertes sur les factures impayées et en retard",
        "Rapports de chiffre d'affaires et de TVA",
        "Historique complet des transactions clients",
        "Balance âgée pour anticiper les impayés",
        "Statistiques de délais de paiement",
        "Export des données pour votre expert-comptable",
      ],
      imageSrc: "/lp/factures/facture3.png",
      imageAlt: "Suivi facturation - Tableau de bord et encaissements",
      reversed: false,
    },
    {
      badge: "MOBILITÉ",
      title: "Accédez à votre logiciel de facturation où que vous soyez",
      description:
        "Facturez depuis n'importe où, à tout moment. Application web responsive et sécurisée accessible sur tous vos appareils. Idéal pour les entrepreneurs en déplacement.",
      features: [
        "Application web accessible sur mobile, tablette et ordinateur",
        "Création de factures en déplacement",
        "Synchronisation automatique sur tous vos appareils",
        "Accès sécurisé avec authentification renforcée",
        "Consultation des factures hors connexion",
        "Notifications push sur les paiements reçus",
        "Scan de documents et justificatifs",
        "Données hébergées en France (RGPD compliant)",
      ],
      imageSrc: "/sectionComponents1.png",
      imageAlt: "Facturation mobile - Logiciel accessible partout",
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
