"use client";

import { useState } from "react";
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/src/lib/utils";

/**
 * Composant ValidationCallout pour afficher les erreurs de validation en temps réel
 * Version collapsible avec style minimaliste
 */
export function ValidationCallout({ errors = {}, className }) {
  const [isOpen, setIsOpen] = useState(true);

  // Compter le nombre total d'erreurs
  const errorCount = Object.keys(errors).length;

  // Si pas d'erreurs, ne rien afficher
  if (errorCount === 0) {
    return null;
  }

  // Formater les messages d'erreur
  const errorMessages = [];
  
  Object.entries(errors).forEach(([key, error]) => {
    if (error && error.message) {
      // Ajouter le message principal
      errorMessages.push(error.message);
    } else if (typeof error === 'string') {
      errorMessages.push(error);
    }
    
    // Ne pas ajouter les détails si on a déjà le message principal
    // car le message principal contient déjà toutes les infos
  });

  // Dédupliquer les messages
  const uniqueMessages = [...new Set(errorMessages)];

  return (
    <div
      className={cn(
        "rounded-lg border border-red-500/20 bg-red-50/50 dark:border-red-500/30 dark:bg-red-500/5",
        className
      )}
    >
      {/* Header - toujours visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-red-100/50 dark:hover:bg-red-500/10"
      >
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
          <div>
            <p className="text-sm font-medium text-red-900 dark:text-red-200">
              {errorCount === 1
                ? "1 erreur à corriger"
                : `${errorCount} erreurs à corriger`}
            </p>
            {!isOpen && uniqueMessages.length > 0 && (
              <p className="text-xs text-red-700/70 dark:text-red-300/70 mt-0.5">
                Cliquez pour voir les détails
              </p>
            )}
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-red-600 dark:text-red-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-red-600 dark:text-red-400" />
        )}
      </button>

      {/* Contenu - collapsible */}
      {isOpen && uniqueMessages.length > 0 && (
        <div className="border-t border-red-500/10 px-4 py-3">
          <ul className="space-y-1.5">
            {uniqueMessages.map((message, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-red-800 dark:text-red-200"
              >
                <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-red-600 dark:bg-red-400" />
                <span>{message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
