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
  reversed = false,
}) => {
  return (
    <div className="max-w-7xl mx-auto pt-6 pb-4 px-4 sm:px-6 lg:px-12">
      <div
        className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start ${reversed ? "" : ""}`}
      >
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

        <div
          className={`relative ${reversed ? "lg:order-1 lg:-ml-40" : "lg:order-2 lg:-mr-40"}`}
        >
          <DashedLine position="-top-px" orientation="horizontal" />
          <DashedLine position="-left-px" orientation="vertical" />
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

export default function SynchronisationComponentsSection() {
  const sections = [
    {
      badge: "CONNEXION SÉCURISÉE",
      title: "Connectez tous vos comptes bancaires en un clic",
      description:
        "Synchronisez automatiquement vos comptes bancaires professionnels et personnels. Compatible avec plus de 300 banques françaises et européennes. Connexion sécurisée certifiée DSP2.",
      features: [
        "Connexion sécurisée à plus de 300 banques",
        "Synchronisation automatique des transactions",
        "Mise à jour en temps réel de vos soldes",
        "Certification DSP2 et conformité RGPD",
        "Authentification forte et chiffrement SSL",
        "Aucun stockage de vos identifiants bancaires",
        "Multi-comptes et multi-banques",
        "Historique complet de vos opérations",
      ],
      imageSrc: "/lp/synchronisation/sync1.png",
      imageAlt: "Synchronisation bancaire - Connexion sécurisée",
      reversed: false,
    },
    {
      badge: "VISION CONSOLIDÉE",
      title: "Une vue d'ensemble de votre trésorerie",
      description:
        "Visualisez tous vos comptes bancaires sur un seul tableau de bord. Suivez vos flux financiers en temps réel et anticipez vos besoins de trésorerie avec des graphiques intuitifs.",
      features: [
        "Tableau de bord consolidé multi-comptes",
        "Graphiques et indicateurs en temps réel",
        "Catégorisation automatique des transactions",
        "Prévisions de trésorerie intelligentes",
        "Alertes sur seuils personnalisables",
        "Rapports financiers détaillés",
        "Export des données comptables",
        "Partage sécurisé avec votre expert-comptable",
      ],
      imageSrc: "/lp/synchronisation/sync2.png",
      imageAlt: "Tableau de bord trésorerie - Vision consolidée",
      reversed: true,
    },
    {
      badge: "AUTOMATISATION",
      title: "Automatisez votre rapprochement bancaire",
      description:
        "Gagnez du temps avec le rapprochement automatique entre vos transactions bancaires et vos factures. Identifiez instantanément les paiements reçus et les règlements effectués.",
      features: [
        "Rapprochement automatique factures/paiements",
        "Détection intelligente des correspondances",
        "Marquage automatique des factures payées",
        "Suivi des impayés et retards de paiement",
        "Lettrage comptable simplifié",
        "Réconciliation multi-devises",
        "Gestion des écarts et anomalies",
        "Historique complet des rapprochements",
      ],
      imageSrc: "/lp/synchronisation/sync3.png",
      imageAlt: "Rapprochement bancaire automatique",
      reversed: false,
    },
    {
      badge: "SÉCURITÉ MAXIMALE",
      title: "Vos données bancaires en toute sécurité",
      description:
        "Nous utilisons les protocoles de sécurité les plus stricts pour protéger vos données. Hébergement en France, conformité RGPD et certification DSP2 pour une tranquillité d'esprit totale.",
      features: [
        "Chiffrement SSL/TLS de bout en bout",
        "Authentification forte obligatoire",
        "Aucun stockage des identifiants bancaires",
        "Hébergement sécurisé en France",
        "Conformité RGPD et directive DSP2",
        "Audits de sécurité réguliers",
        "Sauvegarde automatique des données",
        "Accès contrôlé et traçabilité complète",
      ],
      imageSrc: "/lp/synchronisation/sync4.png",
      imageAlt: "Sécurité bancaire - Protection des données",
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
            reversed={section.reversed}
          />
        ))}
      </div>
    </section>
  );
}
