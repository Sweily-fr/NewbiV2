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

export default function KanbanComponentsSection() {
  const sections = [
    {
      badge: "ORGANISATION VISUELLE",
      title: "Visualisez vos projets en un coup d'œil",
      description:
        "Créez des tableaux Kanban personnalisés pour organiser vos tâches par colonnes. Glissez-déposez vos cartes pour suivre l'avancement de chaque projet en temps réel.",
      features: [
        "Tableaux Kanban illimités et personnalisables",
        "Colonnes personnalisées (À faire, En cours, Terminé...)",
        "Glisser-déposer intuitif des tâches",
        "Vue d'ensemble de tous vos projets",
        "Filtres et recherche avancée",
        "Étiquettes et couleurs pour catégoriser",
        "Dates d'échéance et rappels",
        "Pièces jointes et commentaires sur les tâches",
      ],
      imageSrc: "/lp/projet/projet_list.png",
      imageAlt: "Tableau Kanban - Organisation visuelle",
      reversed: false,
    },
    {
      badge: "COLLABORATION",
      title: "Travaillez en équipe en temps réel",
      description:
        "Invitez vos collaborateurs, assignez des tâches et suivez la progression de chacun. Commentaires, mentions et notifications pour une communication fluide au sein de l'équipe.",
      features: [
        "Collaboration en temps réel",
        "Attribution des tâches aux membres",
        "Commentaires et mentions @",
        "Notifications instantanées",
        "Historique des modifications",
        "Rôles et permissions personnalisables",
        "Partage de tableaux avec des externes",
        "Chat intégré par projet",
      ],
      imageSrc: "/lp/projet/collaboration.png",
      imageAlt: "Collaboration équipe Kanban",
      reversed: true,
    },
    {
      badge: "PRODUCTIVITÉ",
      title: "Boostez votre productivité au quotidien",
      description:
        "Automatisez vos workflows, définissez des règles et gagnez du temps sur les tâches répétitives. Tableaux de bord et statistiques pour mesurer votre efficacité.",
      features: [
        "Automatisations et règles personnalisées",
        "Templates de projets réutilisables",
        "Checklists et sous-tâches",
        "Estimation du temps par tâche",
        "Statistiques et rapports d'avancement",
        "Intégration calendrier",
        "Mode focus pour se concentrer",
        "Raccourcis clavier pour aller plus vite",
      ],
      imageSrc: "/lp/projet/productive.png",
      imageAlt: "Productivité avec Kanban",
      reversed: false,
    },
    // {
    //   badge: "INTÉGRATIONS",
    //   title: "Connectez vos outils préférés",
    //   description:
    //     "Synchronisez vos tableaux Kanban avec vos autres outils : calendrier, email, stockage cloud. Une plateforme centrale pour toute votre gestion de projet.",
    //   features: [
    //     "Intégration Google Calendar et Outlook",
    //     "Connexion avec Slack et Teams",
    //     "Synchronisation Google Drive et Dropbox",
    //     "API ouverte pour vos développements",
    //     "Webhooks pour automatiser",
    //     "Import/Export de données",
    //     "Application mobile iOS et Android",
    //     "Mode hors-ligne disponible",
    //   ],
    //   imageSrc: "/lp/kanban/kanban4.png",
    //   imageAlt: "Intégrations Kanban",
    //   reversed: true,
    // },
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
