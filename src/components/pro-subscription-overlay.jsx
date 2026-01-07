"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Image from "next/image";

export function ProSubscriptionOverlay({ isVisible, onComplete }) {
  const [phase, setPhase] = useState("enter");

  useEffect(() => {
    if (isVisible) {
      setPhase("enter");

      // Phase de sortie après l'animation complète
      const exitTimer = setTimeout(() => {
        setPhase("exit");
      }, 2800);

      // Callback de fin - fermer l'overlay
      const completeTimer = setTimeout(() => {
        onComplete?.();
      }, 3300);

      return () => {
        clearTimeout(exitTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Fond sombre - séparé pour garder opacité constante */}
          <motion.div
            className="fixed inset-0 z-[9998] bg-black/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Contenu de l'animation */}
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Contenu central */}
            <motion.div
              className="relative z-10 flex flex-col items-center text-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{
                scale: phase === "exit" ? 0.95 : 1,
                opacity: phase === "exit" ? 0 : 1,
              }}
              transition={{
                duration: 0.5,
                ease: "easeOut",
              }}
            >
              {/* Cercle avec checkmark animé (style Claude AI) */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                  duration: 0.5,
                }}
              >
                <svg
                  width="120"
                  height="120"
                  viewBox="0 0 120 120"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Cercle qui se dessine */}
                  <motion.circle
                    cx="60"
                    cy="60"
                    r="54"
                    stroke="url(#gradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                      duration: 1.2,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                  />

                  {/* Checkmark qui se dessine après le cercle */}
                  <motion.path
                    d="M 35 60 L 52 77 L 85 44"
                    stroke="#ffffff"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                      duration: 0.6,
                      delay: 0.8,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                  />

                  {/* Dégradé pour le cercle */}
                  <defs>
                    <linearGradient
                      id="gradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#5a50ff" />
                      <stop offset="50%" stopColor="#7c6dff" />
                      <stop offset="100%" stopColor="#9d8aff" />
                    </linearGradient>
                  </defs>
                </svg>
              </motion.div>

              {/* Texte simple */}
              <motion.p
                className="mt-6 text-white text-xl font-medium tracking-tight"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 0.5, ease: "easeOut" }}
              >
                Vous êtes prêt !
              </motion.p>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
