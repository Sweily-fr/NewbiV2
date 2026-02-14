"use client";
import React from "react";
import { ExternalLink } from "lucide-react";

const featuredPlatforms = [
  {
    name: "Digitiz",
    description: "Guide des meilleures solutions digitales pour entreprises",
    logo: "https://digitiz.fr/wp-content/uploads/2025/04/digitiz-logo-officiel.svg",
    url: "https://digitiz.fr/newbi/",
  },
  {
    name: "La Fabrique du Net",
    description:
      "Plateforme de référence pour comparer les logiciels professionnels",
    logo: "/logos/fabriquedunet.png",
    url: "https://www.lafabriquedunet.fr/logiciel/newbi/",
    rating: "9/10",
  },
  {
    name: "Appvizer",
    description: "Comparateur de logiciels de gestion d'entreprise",
    logo: "/logos/appvizer.svg",
    url: "https://www.appvizer.fr/operations/gestion-entreprise/newbi",
  },
];

export default function FeaturedOnSection() {
  return (
    <div className="w-full py-16 lg:py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-3 mb-12">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-[#5A50FF] mb-3">
            Ils parlent de nous
          </span>
          <h2 className="text-3xl md:text-4xl font-normal tracking-[-0.015em] text-balance text-gray-950 dark:text-gray-50 mb-4">
            Reconnu par les plateformes de référence
          </h2>
          <p className="text-md font-normal tracking-tight text-gray-600 dark:text-gray-300 mx-auto mb-8 max-w-2xl">
            Découvrez ce que les experts disent de Newbi
          </p>
        </div>

        {/* Grid with separators */}
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:divide-x divide-gray-200">
            {featuredPlatforms.map((platform, index) => (
              <div key={index} className="flex-1">
                <a
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-8 flex flex-col h-full items-center md:items-start text-center md:text-left"
                >
                  {/* Logo en haut à gauche */}
                  <div className="mb-6">
                    <img
                      src={platform.logo}
                      alt={`${platform.name} logo`}
                      className="h-8 w-auto object-contain"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex flex-col items-center md:items-start">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-normal text-foreground">
                        {platform.name}
                      </h3>
                      {platform.rating && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          ⭐ {platform.rating}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {platform.description}
                    </p>

                    {/* CTA */}
                    <div className="flex items-center text-sm font-normal text-primary mt-auto">
                      <span>Voir l'avis</span>
                      <ExternalLink className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </a>

                {/* Mobile separator */}
                {index < featuredPlatforms.length - 1 && (
                  <div className="md:hidden border-b border-gray-200" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Optional: Trust indicator */}
        <div className="mt-12 text-center">
          <p className="text-xs text-muted-foreground">
            Newbi est référencé sur les principales plateformes de comparaison
            de logiciels professionnels
          </p>
        </div>
      </div>
    </div>
  );
}
