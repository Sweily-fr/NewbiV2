"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

// Pastille colorée insérée au milieu du H1 : un point et un mot qui changent
// tout seuls (« ta boîte », « ton agence », …). Chaque mot a son duo de
// couleurs pastel (fond + point), qui se fond dans celui du mot suivant.
//
// `words` : [{ label, bg, dot }] — l'ordre est celui d'affichage.
//
// Le mot est remplacé sans transition ; c'est la pastille qui s'étire ou se
// rétracte jusqu'à la longueur du nouveau mot. La largeur visée est mesurée
// sur un calque invisible contenant tous les mots, puis animée : comme elle
// pilote la largeur réelle, le texte qui suit dans le titre se décale au même
// rythme. Sans mouvement (prefers-reduced-motion), le premier mot reste
// affiché fixe.
export default function RotatingPill({ words, interval = 3000 }) {
  const [index, setIndex] = React.useState(0);
  const [width, setWidth] = React.useState(null);
  const measureRefs = React.useRef([]);
  const reduceMotion = useReducedMotion();
  const current = words[index];

  React.useEffect(() => {
    if (reduceMotion || words.length < 2) return;
    const id = setInterval(
      () => setIndex((v) => (v + 1) % words.length),
      interval,
    );
    return () => clearInterval(id);
  }, [reduceMotion, words.length, interval]);

  // Mesure au montage, à chaque mot, au redimensionnement (la taille du H1
  // change selon le breakpoint) et une fois les polices chargées.
  React.useLayoutEffect(() => {
    const measure = () => {
      const el = measureRefs.current[index];
      if (el) setWidth(el.getBoundingClientRect().width);
    };
    measure();
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => window.removeEventListener("resize", measure);
  }, [index]);

  const colorTransition = {
    duration: reduceMotion ? 0 : 0.35,
    ease: "easeOut",
  };

  // Le mot de la pastille est plus petit et moins gras que le reste du titre
  // (unités em : il suit la taille du H1 à chaque breakpoint).
  return (
    <motion.span
      className="inline-flex items-center gap-2.5 md:gap-4 rounded-full px-5 md:px-7 py-1.5 md:py-2.5 align-middle text-[0.82em] font-normal"
      initial={false}
      animate={{ backgroundColor: current.bg }}
      transition={colorTransition}
    >
      <motion.span
        aria-hidden="true"
        className="size-3.5 md:size-6 shrink-0 rounded-full"
        initial={false}
        animate={{ backgroundColor: current.dot }}
        transition={colorTransition}
      />
      <motion.span
        className="relative inline-block overflow-hidden"
        initial={false}
        animate={{ width: width ?? "auto" }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 220, damping: 28, mass: 0.8 }
        }
      >
        {/* Donne sa hauteur à la pastille : dans le flux, mais invisible */}
        <span aria-hidden="true" className="invisible block whitespace-nowrap">
          {words[0].label}
        </span>

        {/* Calque de mesure des largeurs : en position fixed hors écran, donc
            mesuré à sa largeur naturelle. En absolute il serait rogné par la
            largeur animée de son parent, et toutes les mesures se vaudraient. */}
        <span
          aria-hidden="true"
          className="pointer-events-none invisible fixed left-[-9999px] top-0 block"
        >
          {words.map((word, i) => (
            <span
              key={word.label}
              ref={(el) => {
                measureRefs.current[i] = el;
              }}
              /* inline-block : chaque mot garde sa largeur propre. En block ils
                 rempliraient tous le calque, donc mesureraient tous pareil. */
              className="inline-block whitespace-nowrap"
            >
              {word.label}
            </span>
          ))}
        </span>

        {/* Mot affiché : rogné par la pastille pendant qu'elle s'étire */}
        <span className="absolute inset-0 flex items-center whitespace-nowrap">
          {current.label}
        </span>
      </motion.span>
    </motion.span>
  );
}
