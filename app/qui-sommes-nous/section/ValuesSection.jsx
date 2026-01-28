"use client";
import React from "react";
import Image from "next/image";

const values = [
  {
    title: "Proximité",
    description:
      "Nous plaçons l'humain au centre de tout. Chaque entrepreneur mérite une écoute attentive.",
    image: "/lp/about/proximite.svg",
  },
  {
    title: "Simplicité",
    description:
      "La gestion financière ne devrait jamais être un frein. Nous concevons des outils intuitifs.",
    image: "/lp/about/simplicite.svg",
  },
  {
    title: "Accessibilité",
    description:
      "Des tarifs justes pour que chaque entreprise puisse accéder à des outils professionnels.",
    image: "/lp/about/accessibilite.svg",
  },
  {
    title: "Fiabilité",
    description:
      "Vos données sont précieuses. Nous garantissons leur sécurité et la conformité française.",
    image: "/lp/about/securite.svg",
  },
  {
    title: "Transparence",
    description:
      "Pas de frais cachés, pas de mauvaises surprises. Nous communiquons clairement sur nos tarifs et nos engagements.",
    image: "/lp/about/transparence.svg",
  },
];

export function ValuesSection() {
  return (
    <section className="py-20 lg:py-28 w-full bg-[#050505] overflow-hidden">
      {/* Header - avec padding gauche seulement */}
      <div className="pl-4 md:pl-8 lg:pl-20 mb-12 lg:mb-16">
        <div className="max-w-7xl">
          <h2 className="text-3xl md:text-4xl font-normal tracking-[-0.015em] text-white">
            Nos valeurs
          </h2>
        </div>
      </div>

      {/* Cards Carousel - déborde des deux côtés */}
      <div>
        <div
          className="flex gap-6 overflow-x-auto pb-6 pl-4 md:pl-8 lg:pl-20"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {values.map((value, index) => {
            const IconComponent = value.icon;
            return (
              <div key={index} className="flex-shrink-0 w-[320px] md:w-[380px]">
                <div className="h-full overflow-hidden rounded-lg bg-[#1a1a1a] border border-[#3a3a3a]">
                  {/* Image/Icon - visible sur desktop en haut */}
                  <div className="hidden md:block md:order-1">
                    <div className="relative w-full h-64 overflow-hidden bg-[#1A1A1A] flex items-center justify-center p-6">
                      {value.image ? (
                        <Image
                          src={value.image}
                          alt={value.title}
                          width={200}
                          height={160}
                          className="object-contain"
                        />
                      ) : (
                        <IconComponent className="w-16 h-16 text-gray-600" />
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col order-1 md:order-2 p-6">
                    <h3 className="mb-4 text-left text-xl font-medium text-white">
                      {value.title}
                    </h3>
                    <p className="text-left text-sm text-gray-400 leading-relaxed grow">
                      {value.description}
                    </p>
                  </div>

                  {/* Image/Icon - visible sur mobile en bas */}
                  <div className="block md:hidden order-2">
                    <div className="relative w-full h-52 overflow-hidden bg-[#1A1A1A] flex items-center justify-center p-4">
                      {value.image ? (
                        <Image
                          src={value.image}
                          alt={value.title}
                          width={180}
                          height={140}
                          className="object-contain"
                        />
                      ) : (
                        <IconComponent className="w-14 h-14 text-gray-600" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
