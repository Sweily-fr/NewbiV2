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

export default function TresorerieComponentsSection() {
  const sections = [
    {
      badge: "TABLEAU DE BORD TRÉSORERIE",
      title: "Visualisez votre trésorerie en temps réel",
      description:
        "Gardez un œil sur votre cash flow grâce à un tableau de bord intuitif. Suivez vos soldes bancaires, vos encaissements et décaissements pour une vision claire de votre situation financière.",
      features: [
        "Solde de trésorerie actualisé en temps réel",
        "Graphiques d'évolution de votre cash flow",
        "Consolidation multi-comptes et multi-banques",
        "Indicateurs clés de performance financière",
        "Alertes personnalisées sur vos seuils de trésorerie",
        "Vue synthétique de vos flux entrants et sortants",
        "Historique complet de vos mouvements bancaires",
        "Export des données pour votre expert-comptable",
      ],
      imageSrc: "/sectionComponents1.png",
      imageAlt: "Tableau de bord gestion de trésorerie - Suivi cash flow",
      reversed: false,
    },
    {
      badge: "PRÉVISIONS FINANCIÈRES",
      title: "Anticipez vos besoins de trésorerie",
      description:
        "Ne subissez plus les imprévus financiers. Grâce à nos outils de prévision de trésorerie, anticipez vos besoins en fonds de roulement et planifiez sereinement votre croissance.",
      features: [
        "Prévisions de trésorerie à 30, 60 et 90 jours",
        "Scénarios prévisionnels personnalisables",
        "Intégration automatique des factures à venir",
        "Prise en compte des charges récurrentes",
        "Alertes sur les risques de découvert",
        "Simulation d'impact des décisions financières",
        "Planification des investissements",
        "Rapports prévisionnels exportables",
      ],
      imageSrc: "/sectionComponents2.png",
      imageAlt: "Prévision de trésorerie - Anticipation besoins financiers",
      reversed: true,
    },
    {
      badge: "SYNCHRONISATION BANCAIRE",
      title: "Connectez vos comptes bancaires automatiquement",
      description:
        "Centralisez tous vos comptes bancaires professionnels sur une seule plateforme. La synchronisation automatique vous fait gagner du temps et élimine les erreurs de saisie manuelle.",
      features: [
        "Connexion sécurisée avec plus de 300 banques",
        "Synchronisation automatique quotidienne",
        "Catégorisation intelligente des transactions",
        "Rapprochement bancaire automatisé",
        "Détection des doublons et anomalies",
        "Historique illimité de vos opérations",
        "Multi-devises pour l'international",
        "Conformité RGPD et sécurité bancaire",
      ],
      imageSrc: "/sectionComponents3.png",
      imageAlt:
        "Synchronisation bancaire automatique - Connexion multi-banques",
      reversed: false,
    },
    {
      badge: "PILOTAGE FINANCIER",
      title: "Prenez les bonnes décisions pour votre entreprise",
      description:
        "Transformez vos données financières en insights actionnables. Analysez vos performances, identifiez les opportunités d'optimisation et pilotez votre entreprise avec confiance.",
      features: [
        "Analyse des délais de paiement clients et fournisseurs",
        "Suivi du besoin en fonds de roulement (BFR)",
        "Indicateurs de rentabilité par activité",
        "Comparaison budget vs réalisé",
        "Rapports financiers personnalisables",
        "Partage sécurisé avec votre comptable",
        "Tableaux de bord collaboratifs",
        "Accès mobile pour décider partout",
      ],
      imageSrc: "/sectionComponents1.png",
      imageAlt: "Pilotage financier entreprise - Analyse trésorerie PME",
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
