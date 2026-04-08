"use client";

import React, { useState } from "react";

const reviews = [
  {
    text: "Tout est automatisé et professionnel. Un vrai gain de temps pour mon entreprise de bâtiment.",
    rating: 5,
    name: "Mustafa G.",
    role: "Artisan BTP",
  },
  {
    text: "Interface facile à utiliser. Service client hyperréactif. Rapport qualité/prix excellent.",
    rating: 5,
    name: "Franck L.",
    role: "Nettoyage bâtiments",
  },
  {
    text: "Le logiciel est indispensable pour une bonne gestion, très facile à prendre en main.",
    rating: 5,
    name: "Roy M.",
    role: "Artisan",
  },
];

const stats = [
  { value: "+1 000", label: "entreprises accompagnées" },
  { value: "+10M €", label: "facturés sur Newbi" },
  { value: "+3 ans", label: "d'expertise en facturation" },
];

function Stars({ count }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(count)].map((_, i) => (
        <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#FBBF24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      <span className="ml-1.5 text-sm font-semibold text-gray-950">
        {count} / 5
      </span>
    </div>
  );
}

export default function TestimonialsSplit() {
  const [active, setActive] = useState(0);

  return (
    <section className="w-full py-16 lg:py-24 bg-[#FDFDFD]">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-[#5A50FF] mb-3">
            Recommandé par toute une communauté
          </span>
          <h2 className="text-3xl md:text-[2.5rem] font-medium tracking-[-0.015em] text-gray-950 mb-4">
            Vous en parlez mieux que nous
          </h2>
          <p className="text-base text-gray-600">
            Découvrez pourquoi des centaines d'indépendants ont choisi{" "}
            <strong>Newbi</strong> pour piloter leur activité au quotidien.
          </p>
        </div>

        {/* Carousel */}
        <div className="max-w-2xl mx-auto mb-16">
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 lg:p-8">
            <p className="text-base font-medium text-gray-950 mb-4 leading-relaxed">
              "{reviews[active].text}"
            </p>
            <Stars count={reviews[active].rating} />
            <p className="text-sm font-medium text-gray-950 mt-3">
              {reviews[active].name}{" "}
              <span className="text-gray-500 font-normal">
                — {reviews[active].role}
              </span>
            </p>
          </div>

          {/* Dots */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === active
                    ? "bg-[#5A50FF] scale-110"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
