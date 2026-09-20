"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { REVIEWS } from "./lp-config";

// Carrousel de témoignages : titre et citation à gauche, portrait à droite,
// flèches précédent / suivant en bas à droite. Un témoignage à la fois.
// `proofs` (optionnel) : 3 cartes de réassurance sous le carrousel,
// { avatar, icon, title, desc }.
export default function LpTestimonials({
  title = "Ce que disent nos clients",
  reviews = REVIEWS,
  proofs,
}) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const active = reviews[index];

  const go = (dir) => {
    setDirection(dir);
    setIndex((i) => (i + dir + reviews.length) % reviews.length);
  };

  return (
    <section className="px-5 py-14 md:py-20 bg-[#F4F4F5]">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-10 lg:gap-12">
        {/* Colonne texte */}
        <div className="lg:col-span-7 flex flex-col">
          <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-balance text-gray-950">
            {title}
          </h2>

          <div className="mt-10 lg:mt-auto lg:pt-10 relative">
            <AnimatePresence mode="wait" initial={false}>
              <motion.figure
                key={index}
                initial={{ opacity: 0, y: 16 * direction }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 * direction }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <blockquote className="text-xl md:text-2xl leading-relaxed text-gray-950 text-balance">
                  “{active.text}”
                </blockquote>
                <figcaption className="mt-6 text-base text-gray-800">
                  <span className="font-medium text-gray-950">
                    {active.name}
                  </span>
                  , {active.role}
                </figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>
        </div>

        {/* Colonne photo */}
        <div className="lg:col-span-4 lg:col-start-9 flex flex-col">
          <div className="relative aspect-[4/5] lg:aspect-square w-full max-w-sm lg:max-w-none mx-auto overflow-hidden rounded-3xl bg-gray-200">
            <AnimatePresence initial={false}>
              <motion.img
                key={index}
                src={active.image}
                alt={`${active.name}, ${active.role}`}
                className="absolute inset-0 size-full object-cover object-top"
                initial={{ opacity: 0, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Témoignage précédent"
              className="flex size-12 items-center justify-center rounded-full bg-gray-200/80 text-gray-500 hover:bg-gray-300/80 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Témoignage suivant"
              className="flex size-12 items-center justify-center rounded-full bg-gray-200/80 text-gray-950 hover:bg-gray-300/80 transition-colors"
            >
              <ArrowRight className="size-5" />
            </button>
          </div>
        </div>
      </div>

      {proofs?.length > 0 && (
        <div className="max-w-6xl mx-auto mt-14 md:mt-20 grid md:grid-cols-3 gap-4 md:gap-5">
          {proofs.map((item) => (
            <article
              key={item.title}
              className="rounded-3xl bg-white p-7 md:p-8 flex flex-col"
            >
              {/* Avatar + pastille icône qui se chevauchent */}
              <div className="flex items-center mb-6">
                <img
                  src={item.avatar}
                  alt=""
                  className="size-14 rounded-full object-cover ring-4 ring-white"
                />
                <span className="-ml-4 flex size-14 items-center justify-center rounded-full bg-white border border-gray-200 ring-4 ring-white text-gray-950 text-sm font-medium">
                  {item.icon}
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-medium tracking-tight text-gray-950 mb-2">
                {item.title}
              </h3>
              <p className="text-[15px] leading-relaxed text-gray-700">
                {item.desc}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
