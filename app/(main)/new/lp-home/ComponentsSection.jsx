"use client";
import React from "react";
import { Check, ChevronRight } from "lucide-react";

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

const gradientTextStyle = {
  textWrap: "nowrap",
  background: "linear-gradient(90deg, #5A50FF 0%, #8B7FFF 100%)",
  backgroundClip: "text",
  WebkitBackgroundClip: "text",
  color: "transparent",
};

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

          <button className="mt-8 inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-[#202020] rounded-lg hover:bg-[#333333] transition-colors">
            Démarrer maintenant
            <ChevronRight className="w-4 h-4" />
          </button>
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
              className="absolute top-4 right-4 w-[100px] xl:w-[120px] h-auto object-contain drop-shadow-lg z-20"
            />
          )}
          <ImageCard
            src={imageSrc}
            alt={imageAlt}
            width={1760}
            height={1408}
            className={`object-cover min-h-[400px] lg:min-h-[600px] w-full ${reversed ? "object-left lg:object-[0%_100%]" : "object-left"}`}
            priority
          />
        </div>
      </div>
    </div>
  );
};

export default function ComponentsSection() {
  const sections = [
    {
      badge: "SOLUTION TOUT-EN-UN",
      title: "Gardez le contrôle de votre entreprise",
      description:
        "Centralisez toutes vos opérations financières et administratives sur une seule plateforme intuitive. Prenez des décisions éclairées grâce à une vue d'ensemble complète de votre activité.",
      features: [
        "Tableau de bord en temps réel avec tous vos indicateurs clés",
        "Suivi automatique de votre trésorerie et de vos flux",
        "Rapports personnalisés pour piloter votre croissance",
        "Accès sécurisé depuis n'importe quel appareil",
        "Gestion multi-comptes et multi-entreprises",
        "Notifications intelligentes sur vos échéances",
        "Historique complet de toutes vos opérations",
        "Support client réactif et personnalisé",
      ],
      imageSrc: "/sectionComponents1.png",
      imageAlt: "Dashboard newbi",
      reversed: false,
    },
    {
      badge: "OUTIL DE GESTION SIMPLE ET EFFICACE",
      title: "Gagnez en efficacité, simplifiez-vous le quotidien",
      description:
        "Automatisez les tâches répétitives et concentrez-vous sur ce qui compte vraiment : développer votre activité. Notre interface intuitive vous fait gagner un temps précieux chaque jour.",
      features: [
        "Facturation automatisée et envoi en un clic",
        "Relances clients automatiques et personnalisables",
        "Synchronisation bancaire en temps réel",
        "Gestion simplifiée de vos devis et contrats",
        "Modèles de documents personnalisables",
        "Signature électronique intégrée",
        "Suivi des paiements en temps réel",
        "Intégration avec vos outils favoris",
      ],
      imageSrc: "/sectionComponents2.png",
      imageAlt: "Gestion efficace newbi",
      badgeImage: "/badgeFacturation.png",
      reversed: true,
    },
    {
      badge: "GESTION DES DÉPENSES",
      title: "Gérez l'ensemble de vos dépenses",
      description:
        "Gardez un œil sur chaque euro dépensé. Catégorisez automatiquement vos dépenses, suivez vos budgets et optimisez vos coûts pour maximiser votre rentabilité.",
      features: [
        "Catégorisation automatique de vos dépenses",
        "Scan et archivage de vos justificatifs",
        "Alertes budget et suivi des écarts",
        "Export comptable simplifié pour votre expert-comptable",
        "Gestion des notes de frais collaborateurs",
        "Rapprochement bancaire automatique",
        "Analyse des dépenses par catégorie",
        "Prévisions budgétaires intelligentes",
      ],
      imageSrc: "/sectionComponents3.png",
      imageAlt: "Gestion des dépenses newbi",
      reversed: false,
    },
  ];

  return (
    <section
      id="components"
      className="relative isolate overflow-hidden pt-10 sm:pt-32"
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
            reversed={section.reversed}
          />
        ))}
      </div>
    </section>
  );
}
