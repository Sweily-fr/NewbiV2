"use client";
import React from "react";
import Link from "next/link";

const defaultMetiers = [
  {
    title: "Artisans & Bâtiment",
    desc: "Plombiers, électriciens, maçons, peintres, architectes d'intérieur et tous les professionnels du BTP.",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80",
  },
  {
    title: "Créatifs & Freelances",
    desc: "Graphistes, développeurs, photographes, rédacteurs, community managers et consultants digitaux.",
    image: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=600&q=80",
  },
  {
    title: "Commerçants & E-commerce",
    desc: "Boutiques en ligne, artisans créateurs, traiteurs, vendeurs sur marketplaces et indépendants du commerce.",
    image: "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=600&q=80",
  },
  {
    title: "Consultants & Experts",
    desc: "Coachs, formateurs, consultants en stratégie, marketing, communication et gestion de projet.",
    image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&q=80",
  },
];

export default function MetiersSection({
  badge = "Pour chaque métier",
  title = "Une solution qui s'adapte à votre activité",
  subtitle = "Que vous soyez artisan, freelance ou consultant, Newbi s'ajuste à vos besoins pour simplifier votre gestion au quotidien.",
  items = defaultMetiers,
  bottomTitle = "",
  bottomText = "",
  ctaText = "",
  ctaHref = "/auth/register",
  maxWidth,
}) {
  const maxW = maxWidth || "max-w-6xl";
  return (
    <section className="pt-10 md:pt-20 lg:pt-22 relative overflow-hidden">
      <div className={`${maxW} px-4 mx-auto`}>
        <div>
          {/* Header */}
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-[#5A50FF] mb-3">
              {badge}
            </span>
            <h2 className="text-3xl md:text-[2.5rem] font-medium tracking-[-0.015em] text-gray-950 mb-4">
              {title}
            </h2>
            <p className="text-base text-[#212121] max-w-2xl mx-auto">
              {subtitle}
            </p>
          </div>

          {/* Cards grid */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-12">
            {items.map((metier, i) => (
              <div
                key={i}
                className="flex grow flex-col rounded-3xl border border-neutral-200/60 bg-white/40 p-3 h-full overflow-hidden"
              >
                <div className="flex grow flex-col overflow-hidden bg-white rounded-xl">
                  {/* Image */}
                  <div className="h-48 md:h-56 overflow-hidden">
                    <img
                      src={metier.image}
                      alt={metier.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Content */}
                  <div className="p-5 flex flex-col gap-2">
                    <h3 className="text-xl font-semibold text-gray-950">
                      {metier.title}
                    </h3>
                    <p className="text-sm text-gray-600">{metier.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          {(bottomTitle || bottomText || ctaText) && (
            <div className="text-center max-w-2xl mx-auto">
              {bottomTitle && <h3 className="text-3xl font-medium text-gray-950 mb-3">
                {bottomTitle}
              </h3>}
              {bottomText && <p className="text-md text-[#212121] mb-6">
                {bottomText}
              </p>}
              {ctaText && <Link
                href={ctaHref}
                className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-base font-medium text-white bg-[#202020] hover:bg-[#333333] transition-colors"
              >
                {ctaText}
              </Link>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
