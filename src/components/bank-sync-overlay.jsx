"use client";

import { motion, AnimatePresence } from "framer-motion";
import { LoaderCircle } from "lucide-react";

export function BankSyncOverlay({
  isVisible,
  message = "Synchronisation de vos comptes bancaires...",
}) {
  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Fond sombre */}
          <motion.div
            className="fixed inset-0 z-[9998] bg-black/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Contenu central */}
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              className="flex flex-col items-center text-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {/* Loader circulaire animé */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <LoaderCircle
                  className="h-16 w-16 text-[#fff] animate-spin"
                  strokeWidth={1}
                />
              </motion.div>

              {/* Texte */}
              <motion.p
                className="mt-6 text-white text-xl font-medium tracking-tight"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
              >
                {message}
              </motion.p>

              {/* Sous-texte */}
              <motion.p
                className="mt-2 text-gray-400 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                Veuillez patienter quelques instants
              </motion.p>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
