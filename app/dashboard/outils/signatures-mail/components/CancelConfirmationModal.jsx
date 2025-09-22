"use client";

import React from "react";
import { Button } from "@/src/components/ui/button";
import { AlertTriangle, X } from "lucide-react";

/**
 * Modal de confirmation pour l'annulation de la création/modification d'une signature
 */
export default function CancelConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Annuler les modifications ?",
  message = "Êtes-vous sûr de vouloir annuler ? Toutes les modifications non sauvegardées seront perdues."
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-full">
              <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Message */}
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="font-normal"
          >
            Continuer l'édition
          </Button>
          <Button
            onClick={onConfirm}
            variant="destructive"
            className="font-normal"
          >
            Oui, annuler
          </Button>
        </div>
      </div>
    </div>
  );
}
