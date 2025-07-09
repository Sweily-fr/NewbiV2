"use client";

import { ArrowLeft, ArrowRight, Save, FileText } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export default function InvoiceFormFooter({ 
  currentStep,
  handlePreviousStep,
  handleNextStep,
  handleSaveDraft,
  handleCreateInvoice,
  isStep1Valid,
  isStep2Valid,
  saving,
  canEdit
}) {
  return (
    <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-10">
      <div className="flex items-center justify-between gap-4">
        {/* Bouton Annuler */}
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Annuler
        </Button>

        <div className="flex items-center gap-3">
          {/* Bouton Brouillon */}
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={saving || !canEdit}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? "Sauvegarde..." : "Brouillon"}
          </Button>

          {/* Navigation entre étapes */}
          {currentStep === 1 ? (
            <Button
              type="button"
              onClick={handleNextStep}
              disabled={!isStep1Valid() || !canEdit}
              className="gap-2"
            >
              Étape suivante
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handlePreviousStep}
                disabled={!canEdit}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Étape précédente
              </Button>
              <Button
                type="button"
                onClick={handleCreateInvoice}
                disabled={!isStep2Valid() || saving || !canEdit}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                {saving ? "Création..." : "Créer la facture"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
