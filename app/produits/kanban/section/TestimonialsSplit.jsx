"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const testimonials = [
  {
    id: 1,
    quote:
      "Le Kanban de newbi a transformé notre façon de travailler. Toute l'équipe voit où en sont les projets et on ne rate plus aucune deadline.",
    name: "Lucas Bernard",
    role: "Chef de projet",
    company: "AgenceWeb",
    image: "/lp/testimonials/avatar1.jpg",
  },
  {
    id: 2,
    quote:
      "Simple et efficace. J'ai enfin une vue claire de toutes mes tâches et je peux prioriser facilement. Ma productivité a doublé !",
    name: "Emma Rousseau",
    role: "Freelance",
    company: "ER Design",
    image: "/lp/testimonials/avatar2.jpg",
  },
  {
    id: 3,
    quote:
      "La collaboration en temps réel est un game-changer. Plus besoin de réunions interminables, tout le monde sait ce qu'il a à faire.",
    name: "Antoine Mercier",
    role: "Directeur technique",
    company: "StartupTech",
    image: "/lp/testimonials/avatar3.jpg",
  },
];

export function TestimonialsSplit() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const active = testimonials[activeIndex];

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section className="w-full py-20 pb-12 lg:pb-32 bg-white">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div
          className="relative flex flex-col lg:grid lg:grid-cols-[1fr_auto] gap-8 lg:gap-12 items-center cursor-pointer group"
          onClick={nextTestimonial}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div className="space-y-6 lg:space-y-8 w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.company}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-muted-foreground"
              >
                <span className="w-8 h-px bg-muted-foreground/50" />
                {active.company}
              </motion.div>
            </AnimatePresence>

            <div className="relative overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.blockquote
                  key={active.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -40 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="text-3xl md:text-4xl font-light leading-[1.3] tracking-tight text-foreground"
                >
                  {active.quote}
                </motion.blockquote>
              </AnimatePresence>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={active.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="flex items-center gap-4"
              >
                <div className="w-10 h-px bg-foreground/20" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {active.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{active.role}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="relative w-full lg:w-64 h-64 lg:h-80">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, filter: "blur(20px)", scale: 1.05 }}
                animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                exit={{ opacity: 0, filter: "blur(20px)", scale: 0.95 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <div className="w-full h-full rounded-2xl overflow-hidden border border-border/50">
                  <img
                    src={active.image || "/placeholder.svg"}
                    alt={active.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </motion.div>
            </AnimatePresence>

            <motion.div
              animate={{
                opacity: isHovering ? 1 : 0,
                scale: isHovering ? 1 : 0.8,
              }}
              transition={{ duration: 0.2 }}
              className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs text-muted-foreground"
            >
              <span>Next</span>
              <ArrowUpRight className="w-3 h-3" />
            </motion.div>
          </div>

          <div className="relative lg:absolute lg:-bottom-16 lg:left-0 flex items-center gap-3 justify-center lg:justify-start mt-8 lg:mt-0">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex(index);
                }}
                className="relative p-1 group/dot"
              >
                <span
                  className={`
                    block w-2 h-2 rounded-full transition-all duration-300
                    ${
                      index === activeIndex
                        ? "bg-foreground scale-100"
                        : "bg-muted-foreground/30 scale-75 hover:bg-muted-foreground/50 hover:scale-100"
                    }
                  `}
                />
                {index === activeIndex && (
                  <motion.span
                    layoutId="activeDot"
                    className="absolute inset-0 border border-foreground/30 rounded-full"
                    transition={{ duration: 0.3 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
