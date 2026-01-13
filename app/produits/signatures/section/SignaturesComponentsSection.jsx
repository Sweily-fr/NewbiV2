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

export default function SignaturesComponentsSection() {
  const sections = [
    {
      badge: "CRÉATION FACILE",
      title: "Créez des signatures email en quelques clics",
      description:
        "Utilisez notre éditeur intuitif pour créer des signatures professionnelles sans aucune compétence technique. Choisissez parmi nos modèles ou partez de zéro pour une signature unique.",
      features: [
        "Éditeur visuel drag & drop intuitif",
        "Bibliothèque de modèles professionnels",
        "Personnalisation complète des couleurs et polices",
        "Ajout de votre logo et photo de profil",
        "Liens vers vos réseaux sociaux",
        "Bannières promotionnelles intégrées",
        "Prévisualisation en temps réel",
        "Export compatible tous clients email",
      ],
      imageSrc: "/lp/signatures/signature1.png",
      imageAlt: "Création de signature email professionnelle",
      reversed: false,
    },
    {
      badge: "COMPATIBILITÉ TOTALE",
      title: "Compatible avec tous les clients email",
      description:
        "Vos signatures fonctionnent parfaitement sur Gmail, Outlook, Apple Mail, Thunderbird et tous les clients email professionnels. Installation en un clic avec nos guides détaillés.",
      features: [
        "Compatible Gmail, Outlook, Apple Mail",
        "Fonctionne sur mobile et desktop",
        "Installation guidée pas à pas",
        "Code HTML optimisé et responsive",
        "Rendu parfait sur tous les appareils",
        "Support des images et icônes",
        "Liens cliquables garantis",
        "Mise à jour automatique des signatures",
      ],
      imageSrc: "/lp/signatures/signature2.png",
      imageAlt: "Compatibilité signature email",
      reversed: true,
    },
    {
      badge: "GESTION D'ÉQUIPE",
      title: "Déployez des signatures uniformes pour toute l'équipe",
      description:
        "Créez une signature de référence et déployez-la à tous vos collaborateurs. Gardez une image de marque cohérente tout en permettant la personnalisation individuelle.",
      features: [
        "Gestion centralisée des signatures",
        "Déploiement en masse pour l'équipe",
        "Personnalisation par département",
        "Champs dynamiques (nom, poste, téléphone)",
        "Mise à jour automatique pour tous",
        "Contrôle des éléments modifiables",
        "Historique des versions",
        "Rôles et permissions d'administration",
      ],
      imageSrc: "/lp/signatures/signature3.png",
      imageAlt: "Gestion des signatures d'équipe",
      reversed: false,
    },
    {
      badge: "MARKETING INTÉGRÉ",
      title: "Transformez vos emails en outil marketing",
      description:
        "Ajoutez des bannières promotionnelles, des liens vers vos derniers contenus et des call-to-action dans vos signatures. Mesurez l'impact avec nos statistiques de clics.",
      features: [
        "Bannières promotionnelles dynamiques",
        "Call-to-action personnalisables",
        "Liens trackés avec statistiques",
        "Rotation automatique des bannières",
        "Intégration calendrier de rendez-vous",
        "Boutons de partage social",
        "QR codes personnalisés",
        "A/B testing des signatures",
      ],
      imageSrc: "/lp/signatures/signature4.png",
      imageAlt: "Marketing par signature email",
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
