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
            className={`object-cover min-h-[300px] sm:min-h-[400px] lg:min-h-[600px] w-full object-left`}
            priority
          />
        </div>
      </div>
    </div>
  );
};

export default function TransfersComponentsSection() {
  const sections = [
    {
      badge: "TRANSFERT RAPIDE",
      title: "Envoyez des fichiers volumineux en quelques secondes",
      description:
        "Partagez des fichiers jusqu'à 5 Go sans limite de transferts. Interface intuitive par glisser-déposer, envoi instantané et liens de partage personnalisables pour vos clients et collaborateurs.",
      features: [
        "Transferts illimités jusqu'à 5 Go par fichier",
        "Interface glisser-déposer ultra-simple",
        "Envoi instantané sans compression",
        "Liens de partage personnalisables",
        "Partage multiple vers plusieurs destinataires",
        "Prévisualisation des fichiers avant envoi",
        "Historique complet de vos transferts",
        "Aucune inscription requise pour les destinataires",
      ],
      imageSrc: "/lp/transfers/transfer1.png",
      imageAlt: "Transfert de fichiers rapide et simple",
      reversed: false,
    },
    {
      badge: "SÉCURITÉ MAXIMALE",
      title: "Vos fichiers protégés de bout en bout",
      description:
        "Chiffrement SSL/TLS pour tous vos transferts. Protection par mot de passe, expiration automatique des liens et conformité RGPD pour une sécurité totale de vos données sensibles.",
      features: [
        "Chiffrement SSL/TLS de bout en bout",
        "Protection des liens par mot de passe",
        "Expiration automatique des liens de partage",
        "Suppression automatique des fichiers",
        "Conformité RGPD et hébergement en France",
        "Traçabilité complète des téléchargements",
        "Notifications de téléchargement",
        "Aucune publicité ni tracking tiers",
      ],
      imageSrc: "/lp/transfers/transfer2.png",
      imageAlt: "Sécurité des transferts de fichiers",
      reversed: true,
    },
    {
      badge: "GESTION AVANCÉE",
      title: "Gérez et suivez tous vos transferts",
      description:
        "Tableau de bord complet pour suivre tous vos envois. Statistiques détaillées, gestion des liens actifs et archivage automatique pour une organisation optimale de vos partages.",
      features: [
        "Tableau de bord de suivi des transferts",
        "Statistiques de téléchargement en temps réel",
        "Gestion centralisée de tous vos liens",
        "Archivage automatique des anciens transferts",
        "Recherche rapide dans l'historique",
        "Notifications par email personnalisables",
        "Export des rapports d'activité",
        "Gestion des destinataires et permissions",
      ],
      imageSrc: "/lp/transfers/transfer3.png",
      imageAlt: "Gestion des transferts de fichiers",
      reversed: false,
    },
    {
      badge: "COLLABORATION",
      title: "Partagez en équipe facilement",
      description:
        "Espaces de travail partagés pour vos équipes. Gestion des droits d'accès, dossiers collaboratifs et intégration avec vos outils préférés pour une collaboration fluide.",
      features: [
        "Espaces de travail partagés pour les équipes",
        "Gestion des droits et permissions",
        "Dossiers collaboratifs organisés",
        "Commentaires et annotations sur les fichiers",
        "Intégration avec Slack, Teams, Drive",
        "API pour automatiser vos workflows",
        "Branding personnalisé des pages de partage",
        "Support prioritaire pour les équipes",
      ],
      imageSrc: "/lp/transfers/transfer4.png",
      imageAlt: "Collaboration et partage d'équipe",
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
