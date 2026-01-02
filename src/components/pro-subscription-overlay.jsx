"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Image from "next/image";

export function ProSubscriptionOverlay({ isVisible, onComplete }) {
  const [phase, setPhase] = useState("enter");

  useEffect(() => {
    if (isVisible) {
      setPhase("enter");

      // Phase de sortie
      const exitTimer = setTimeout(() => {
        setPhase("exit");
      }, 2500);

      // Callback de fin
      const completeTimer = setTimeout(() => {
        onComplete?.();
      }, 3200);

      return () => {
        clearTimeout(exitTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Fond sombre */}
          <motion.div
            className="absolute inset-0 bg-black/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />

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
            {/* Logo avec cercle animé */}
            <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center">
              {/* Cercle animé SVG */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 128 128"
              >
                <motion.circle
                  cx="64"
                  cy="64"
                  r="58"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="3"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, rotate: -90 }}
                  animate={{ pathLength: 1 }}
                  style={{ originX: "50%", originY: "50%", rotate: -90 }}
                  transition={{
                    pathLength: {
                      duration: 1.5,
                      ease: "easeInOut",
                    },
                  }}
                />
              </svg>

              {/* Logo Newbi */}
              {/* <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
              > */}
              <Image
                src="/newbi_white.png"
                alt="Newbi"
                width={136}
                height={136}
                // className="md:w-28 md:h-28"
              />
              {/* </motion.div> */}
            </div>

            {/* Texte */}
            <motion.p
              className="mt-10 text-white text-md md:text-md font-medium"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.4 }}
            >
              Bienvenue dans Newbi Pro
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
