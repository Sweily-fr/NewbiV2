"use client";

import { useState, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { ChevronRight } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/src/components/ui/collapsible";
import { cn } from "@/src/lib/utils";
import CustomFieldsSection from "@/app/dashboard/outils/devis/components/quote-form-sections/CustomFieldsSection";
import ClientSection from "./delivery-note-form-sections/ClientSection";
import DeliveryInfoSection from "./delivery-note-form-sections/DeliveryInfoSection";
import DeliveryAddressSection from "./delivery-note-form-sections/DeliveryAddressSection";
import ItemsSection from "./delivery-note-form-sections/ItemsSection";
import NotesAndFooterSection from "./delivery-note-form-sections/NotesAndFooterSection";
import ReceptionSection from "./delivery-note-form-sections/ReceptionSection";

/**
 * Formulaire de bon de livraison : une seule page scrollable (client, infos
 * de livraison, adresse, articles SANS prix, notes, réception).
 */
export default function EnhancedDeliveryNoteForm({
  mode = "create",
  onSave,
  onSubmit,
  onLeave,
  hasUserChanges,
  loading,
  saving,
  validationErrors = {},
  setValidationErrors,
  nextDeliveryNumber,
  isDraft = true,
  onEditClient,
}) {
  const { watch } = useFormContext();
  const data = watch();
  const scrollContainerRef = useRef(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(
    () => !!(data.receivedBy || data.signatureDataUrl || data.customFields?.length),
  );

  const canEdit = !loading;

  // Scroll vers le premier champ en erreur après une validation refusée
  const scrollToFirstError = () => {
    const firstKey = Object.keys(validationErrors || {})[0];
    if (!firstKey) return;
    const el =
      document.querySelector(`[data-error-field="${firstKey}"]`) ||
      document.querySelector(`[name="${firstKey}"]`) ||
      document.querySelector(`[name^="${firstKey}."]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => el.focus?.(), 300);
    } else if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    await onSubmit?.();
    // Les erreurs éventuelles sont posées par le hook : y amener l'utilisateur
    setTimeout(scrollToFirstError, 50);
  };

  const submitLabel = saving
    ? mode === "edit"
      ? "Enregistrement..."
      : "Création..."
    : mode === "edit"
      ? isDraft
        ? "Émettre le bon de livraison"
        : "Enregistrer les modifications"
      : "Créer le bon de livraison";

  return (
    <div className="flex flex-col h-full w-full">
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 pb-20 lg:pb-12"
      >
        <div className="space-y-8 px-2 pt-4 md:pt-6">
          <ClientSection
            canEdit={canEdit}
            validationErrors={validationErrors}
            setValidationErrors={setValidationErrors}
            onEditClient={onEditClient}
          />

          <DeliveryInfoSection
            canEdit={canEdit}
            isDraft={isDraft}
            nextDeliveryNumber={nextDeliveryNumber}
            validationErrors={validationErrors}
          />

          <DeliveryAddressSection
            canEdit={canEdit}
            validationErrors={validationErrors}
          />

          <ItemsSection canEdit={canEdit} validationErrors={validationErrors} />

          <NotesAndFooterSection canEdit={canEdit} />

          {/* Options avancées : réception + champs personnalisés */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-3"
              >
                <ChevronRight
                  className={cn(
                    "size-3.5 transition-transform duration-200",
                    advancedOpen && "rotate-90",
                  )}
                />
                Réception et champs personnalisés
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-6 pt-2">
                <ReceptionSection canEdit={canEdit} />
                <CustomFieldsSection
                  canEdit={canEdit}
                  validationErrors={validationErrors}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Pied : actions */}
      <div className="pt-4 pb-6 z-50 border-t lg:relative lg:bottom-auto lg:pt-4 lg:pb-0 fixed bottom-0 left-0 right-0 bg-background lg:bg-transparent px-4 lg:p-0">
        <div className="max-w-2xl mx-auto px-2 md:px-6 lg:px-0">
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  if (hasUserChanges) {
                    setShowCancelDialog(true);
                  } else if (onLeave) {
                    onLeave();
                  } else {
                    window.history.back();
                  }
                }}
                disabled={loading || saving}
                className="hidden md:flex"
              >
                Annuler
              </Button>
            </div>

            <div className="flex gap-3">
              {isDraft && (
                <Button
                  variant="outline"
                  onClick={() => onSave?.()}
                  disabled={!canEdit || saving}
                >
                  {saving ? "Sauvegarde..." : "Enregistrer brouillon"}
                </Button>
              )}
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={!canEdit || saving}
                className="px-6"
              >
                {submitLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quitter l'éditeur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir quitter ? Les modifications non
              enregistrées seront perdues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Rester
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setShowCancelDialog(false);
                if (onLeave) onLeave();
                else window.history.back();
              }}
            >
              Quitter
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
