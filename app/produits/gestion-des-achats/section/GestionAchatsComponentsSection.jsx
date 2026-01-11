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
    <div className="max-w-7xl mx-auto pt-6 pb-4 px-6 lg:px-12">
      <div
        className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-start ${reversed ? "" : ""}`}
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
              alt="Badge"
              className="absolute top-4 right-4 w-[100px] xl:w-[120px] h-auto object-contain drop-shadow-lg z-50"
            />
          )}
          <ImageCard
            src={imageSrc}
            alt={imageAlt}
            width={1760}
            height={1408}
            className={`object-cover min-h-[600px] w-full ${reversed ? "object-[-32%_100%]" : "object-left"}`}
            priority
          />
        </div>
      </div>
    </div>
  );
};

export default function GestionAchatsComponentsSection() {
  const sections = [
    {
      badge: "COMMANDES",
      title: "Créez et suivez vos bons de commande",
      description:
        "Simplifiez votre processus d'achat : créez des bons de commande professionnels, suivez leur statut et gardez un historique complet de toutes vos commandes fournisseurs.",
      features: [
        "Création rapide de bons de commande en quelques clics",
        "Suivi en temps réel du statut des commandes",
        "Validation multi-niveaux selon les montants",
        "Historique complet et recherche avancée",
        "Modèles de commandes réutilisables",
        "Envoi automatique aux fournisseurs par email",
        "Gestion des réceptions partielles",
        "Export PDF et archivage sécurisé",
      ],
      imageSrc: "/sectionComponents1.png",
      imageAlt: "Gestion des commandes - Bons de commande fournisseurs",
      reversed: false,
    },
    {
      badge: "FOURNISSEURS",
      title: "Centralisez votre base fournisseurs",
      description:
        "Gérez tous vos fournisseurs depuis une interface unique. Consultez l'historique, les conditions commerciales et évaluez les performances de chaque partenaire.",
      features: [
        "Fiche détaillée par fournisseur avec contacts",
        "Conditions commerciales et délais de paiement",
        "Historique complet des achats par fournisseur",
        "Évaluation et notation des performances",
        "Gestion des catalogues produits",
        "Documents et contrats centralisés",
        "Alertes sur les échéances de contrats",
        "Import/export de votre base fournisseurs",
      ],
      imageSrc: "/sectionComponents2.png",
      imageAlt: "Base fournisseurs - Gestion centralisée",
      reversed: true,
    },
    {
      badge: "FACTURES D'ACHAT",
      title: "Gérez vos factures fournisseurs",
      description:
        "Rapprochez automatiquement vos factures avec vos commandes et réceptions. Simplifiez la validation et accélérez vos paiements tout en gardant le contrôle.",
      features: [
        "Rapprochement automatique commande/réception/facture",
        "Workflow de validation personnalisable",
        "Échéancier de paiement fournisseurs",
        "Alertes sur les échéances à venir",
        "Gestion des litiges et avoirs",
        "Archivage numérique conforme",
        "Intégration comptable automatique",
        "Reporting des dépenses par catégorie",
      ],
      imageSrc: "/sectionComponents3.png",
      imageAlt: "Factures fournisseurs - Rapprochement automatique",
      reversed: false,
    },
    {
      badge: "ANALYSE",
      title: "Optimisez vos coûts d'achat",
      description:
        "Analysez vos dépenses et identifiez les opportunités d'économies. Tableaux de bord en temps réel et rapports détaillés pour piloter efficacement vos achats.",
      features: [
        "Tableau de bord avec KPIs achats en temps réel",
        "Analyse des dépenses par catégorie et fournisseur",
        "Comparaison des prix entre fournisseurs",
        "Alertes sur les dépassements de budget",
        "Suivi des économies réalisées",
        "Rapports personnalisables et exports",
        "Prévisions de trésorerie fournisseurs",
        "Données hébergées en France (RGPD compliant)",
      ],
      imageSrc: "/sectionComponents1.png",
      imageAlt: "Analyse achats - Optimisation des coûts",
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
