"use client";

import React, { useState, useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { Check, Minus, Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { TextareaNew } from "@/src/components/ui/textarea-new";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { Alert, AlertDescription } from "@/src/components/ui/alert";
import { Button } from "@/src/components/ui/button";
import { ColorPicker } from "@/src/components/ui/color-picker";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { SuggestionDropdown } from "@/src/components/ui/suggestion-dropdown";
import { documentSuggestions } from "@/src/utils/document-suggestions";
import CompanyInfoSettingsSection from "@/src/components/settings/company-info-settings-section";
import LegalInfoSettingsSection from "@/src/components/settings/legal-info-settings-section";

const LABEL_CLASS =
  "text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55";

// Suggestions propres aux remarques de livraison
const DELIVERY_NOTE_SUGGESTIONS = [
  {
    label: "Bon état, sans réserve",
    value: "Marchandises livrées en bon état, sans réserve.",
  },
  {
    label: "Vérification des colis",
    value: "Merci de vérifier le nombre et l'état des colis à la réception.",
  },
  {
    label: "Réserves sous 3 jours",
    value:
      "Toute réserve doit être notifiée sur ce bon de livraison et confirmée par écrit sous 3 jours.",
  },
  {
    label: "Colis fragiles",
    value: "Colis fragiles : manipuler avec précaution.",
  },
];

/**
 * Paramètres d'un bon de livraison : même écran que les paramètres des devis
 * et bons de commande (informations de l'entreprise, informations légales,
 * numérotation, apparence, position du client, notes et bas de page), sans
 * les coordonnées bancaires ni les conditions générales, qui n'ont pas de
 * sens sur un document sans montant.
 */
export default function DeliveryNoteSettingsView({
  canEdit,
  onCancel,
  onSave,
  onCloseAttempt,
  saveLabel = "Appliquer à ce bon de livraison",
  organization,
  isDraft = true,
  nextDeliveryNumber,
}) {
  const {
    watch,
    setValue,
    register,
    formState: { errors },
  } = useFormContext();
  const data = watch();

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const initialValuesRef = useRef(null);

  const snapshot = () => ({
    prefix: data.prefix,
    textColor: data.appearance?.textColor,
    headerTextColor: data.appearance?.headerTextColor,
    headerBgColor: data.appearance?.headerBgColor,
    headerNotes: data.headerNotes,
    notes: data.notes,
    footerNotes: data.footerNotes,
    clientPositionRight: data.clientPositionRight,
  });

  // Le parent (croix de fermeture) passe par la même logique que « Annuler »
  const handleCancelClickRef = useRef(null);
  useEffect(() => {
    handleCancelClickRef.current = handleCancelClick;
  });
  useEffect(() => {
    if (onCloseAttempt) {
      onCloseAttempt(() => () => handleCancelClickRef.current?.());
    }
  }, [onCloseAttempt]);

  useEffect(() => {
    if (!initialValuesRef.current) initialValuesRef.current = snapshot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!initialValuesRef.current) return;
    const initial = initialValuesRef.current;
    const current = snapshot();
    setHasUnsavedChanges(
      Object.keys(initial).some((key) => initial[key] !== current[key]),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const handleCancelClick = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      onCancel();
    }
  };

  const handleConfirmCancel = () => {
    const initial = initialValuesRef.current;
    if (initial) {
      setValue("prefix", initial.prefix ?? "", { shouldValidate: false });
      setValue("appearance.textColor", initial.textColor || "#000000");
      setValue(
        "appearance.headerTextColor",
        initial.headerTextColor || "#ffffff",
      );
      setValue("appearance.headerBgColor", initial.headerBgColor || "#5b50FF");
      setValue("headerNotes", initial.headerNotes || "");
      setValue("notes", initial.notes || "");
      setValue("footerNotes", initial.footerNotes || "");
      setValue("clientPositionRight", initial.clientPositionRight || false);
    }
    setShowConfirmDialog(false);
    onCancel();
  };

  const handleSaveClick = () => {
    initialValuesRef.current = snapshot();
    setHasUnsavedChanges(false);
    onSave();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto pl-2 pr-2 space-y-8 pt-4 md:pt-6">
          {Object.keys(errors).length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                <div className="font-medium mb-2">
                  Veuillez corriger les erreurs suivantes :
                </div>
                <ul className="list-disc list-inside space-y-1">
                  {errors.headerNotes && (
                    <li className="text-sm">
                      Notes d'en-tête : {errors.headerNotes.message}
                    </li>
                  )}
                  {errors.notes && (
                    <li className="text-sm">
                      Remarques de livraison : {errors.notes.message}
                    </li>
                  )}
                  {errors.footerNotes && (
                    <li className="text-sm">
                      Notes de bas de page : {errors.footerNotes.message}
                    </li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Informations de l'entreprise et informations légales : mêmes
              sections que les devis / factures (enregistrées dans l'organisation) */}
          <CompanyInfoSettingsSection organization={organization} />
          <LegalInfoSettingsSection organization={organization} />

          {/* Numérotation */}
          <Card className="shadow-none border-none bg-transparent p-0 py-0!">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-2 font-medium text-lg">
                Numérotation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="dn-prefix" className={LABEL_CLASS}>
                      Préfixe
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="max-w-[280px] sm:max-w-xs"
                      >
                        <p>
                          Préfixe des bons de livraison (ex : BL-122025 pour
                          décembre 2025). La numérotation est séquentielle par
                          préfixe.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="dn-prefix"
                    value={data.prefix || ""}
                    onChange={(e) =>
                      setValue("prefix", e.target.value.toUpperCase(), {
                        shouldDirty: true,
                      })
                    }
                    placeholder="BL-MMAAAA"
                    maxLength={10}
                    disabled={!canEdit || !isDraft}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="dn-number" className={LABEL_CLASS}>
                      Numéro
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="max-w-[280px] sm:max-w-xs"
                      >
                        <p>
                          {isDraft
                            ? "Attribué automatiquement à l'émission du bon de livraison (prochain numéro de la séquence)."
                            : "Le numéro d'un bon de livraison émis est verrouillé."}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="dn-number"
                    value={
                      isDraft ? nextDeliveryNumber || "…" : data.number || ""
                    }
                    readOnly
                    disabled
                    className="bg-muted/40"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Aperçu :{" "}
                <span className="font-medium text-foreground">
                  {data.prefix || "BL-MMAAAA"}-
                  {isDraft ? nextDeliveryNumber || "0001" : data.number}
                </span>
              </p>
            </CardContent>
          </Card>

          {/* Apparence */}
          <Card className="shadow-none border-none bg-transparent p-0 py-0!">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-2 font-medium text-lg">
                Apparence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="text-color" className={LABEL_CLASS}>
                    Couleur du texte
                  </Label>
                  <ColorPicker
                    className="w-full"
                    color={data.appearance?.textColor || "#000000"}
                    onChange={(color) =>
                      setValue("appearance.textColor", color, {
                        shouldDirty: true,
                      })
                    }
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="header-text-color" className={LABEL_CLASS}>
                    Couleur des titres du tableau
                  </Label>
                  <ColorPicker
                    className="w-full"
                    color={data.appearance?.headerTextColor || "#ffffff"}
                    onChange={(color) =>
                      setValue("appearance.headerTextColor", color, {
                        shouldDirty: true,
                      })
                    }
                    disabled={!canEdit}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="header-bg-color" className={LABEL_CLASS}>
                  Couleur de fond du tableau
                </Label>
                <ColorPicker
                  className="w-full"
                  color={data.appearance?.headerBgColor || "#5b50FF"}
                  onChange={(color) =>
                    setValue("appearance.headerBgColor", color, {
                      shouldDirty: true,
                    })
                  }
                  disabled={!canEdit}
                />
              </div>
            </CardContent>
          </Card>

          {/* Position du client */}
          <Card className="shadow-none border-none bg-transparent p-0 py-0!">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-2 font-medium text-lg">
                Position du client dans le PDF
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <p className="text-sm text-muted-foreground">
                Choisissez où afficher les informations du client dans vos bons
                de livraison
              </p>
              <div className="flex gap-3">
                {[
                  { right: false, label: "Au centre", position: "center" },
                  { right: true, label: "À droite", position: "right" },
                ].map((option) => {
                  const selected = !!data.clientPositionRight === option.right;
                  return (
                    <button
                      key={option.position}
                      type="button"
                      onClick={() =>
                        setValue("clientPositionRight", option.right, {
                          shouldDirty: true,
                        })
                      }
                      disabled={!canEdit}
                      className={`group ${!canEdit ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <div
                        className={`w-[110px] overflow-hidden rounded-md border shadow-xs transition-[color,box-shadow] ${
                          selected ? "border-ring bg-accent" : "border-input"
                        }`}
                      >
                        <ClientPositionPreview position={option.position} />
                      </div>
                      <span
                        className={`mt-2 flex items-center gap-1 ${
                          selected ? "" : "text-muted-foreground/70"
                        }`}
                      >
                        {selected ? (
                          <Check size={16} aria-hidden="true" />
                        ) : (
                          <Minus size={16} aria-hidden="true" />
                        )}
                        <span className="text-xs font-medium">
                          {option.label}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Notes et bas de page */}
          <Card className="shadow-none border-none bg-transparent p-0 py-0!">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-2 font-medium text-lg">
                Notes et bas de page
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="header-notes" className={LABEL_CLASS}>
                    Notes d'en-tête
                  </Label>
                  <SuggestionDropdown
                    suggestions={documentSuggestions.headerNotes}
                    onSelect={(value) =>
                      setValue("headerNotes", value, { shouldDirty: true })
                    }
                    label="Suggestions"
                  />
                </div>
                <div className="space-y-1">
                  <TextareaNew
                    id="header-notes"
                    className={`mt-2 ${errors?.headerNotes ? "border-red-500" : ""}`}
                    {...register("headerNotes", {
                      maxLength: {
                        value: 1000,
                        message:
                          "Les notes d'en-tête ne doivent pas dépasser 1000 caractères",
                      },
                    })}
                    defaultValue={data.headerNotes || ""}
                    placeholder="Notes qui apparaîtront en haut du bon de livraison..."
                    rows={3}
                    disabled={!canEdit}
                  />
                  {errors?.headerNotes && (
                    <p className="text-xs text-red-500">
                      {errors.headerNotes.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="delivery-notes" className={LABEL_CLASS}>
                    Remarques de livraison
                  </Label>
                  <SuggestionDropdown
                    suggestions={DELIVERY_NOTE_SUGGESTIONS}
                    onSelect={(value) =>
                      setValue("notes", value, { shouldDirty: true })
                    }
                    label="Suggestions"
                  />
                </div>
                <div className="space-y-1">
                  <TextareaNew
                    id="delivery-notes"
                    className={`mt-2 ${errors?.notes ? "border-red-500" : ""}`}
                    {...register("notes", {
                      maxLength: {
                        value: 2000,
                        message:
                          "Les remarques ne doivent pas dépasser 2000 caractères",
                      },
                    })}
                    defaultValue={data.notes || ""}
                    placeholder="Remarques imprimées sous la liste des articles (réserves, consignes...)"
                    rows={4}
                    disabled={!canEdit}
                  />
                  {errors?.notes && (
                    <p className="text-xs text-red-500">
                      {errors.notes.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="footer-notes" className={LABEL_CLASS}>
                    Notes de bas de page
                  </Label>
                  <SuggestionDropdown
                    suggestions={documentSuggestions.footerNotes}
                    onSelect={(value) =>
                      setValue("footerNotes", value, { shouldDirty: true })
                    }
                    label="Suggestions"
                  />
                </div>
                <div className="space-y-1">
                  <TextareaNew
                    id="footer-notes"
                    className={`mt-2 ${errors?.footerNotes ? "border-red-500" : ""}`}
                    {...register("footerNotes", {
                      maxLength: {
                        value: 2000,
                        message:
                          "Les notes de bas de page ne doivent pas dépasser 2000 caractères",
                      },
                    })}
                    defaultValue={data.footerNotes || ""}
                    placeholder="Notes qui apparaîtront en bas du bon de livraison..."
                    rows={3}
                    disabled={!canEdit}
                  />
                  {errors?.footerNotes && (
                    <p className="text-xs text-red-500">
                      {errors.footerNotes.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Boutons fixes en bas */}
      <div className="flex-shrink-0 border-t bg-background pt-4">
        <div className="max-w-2xl mx-auto flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleCancelClick}
            disabled={!canEdit}
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveClick}
            disabled={!canEdit}
          >
            {saveLabel}
          </Button>
        </div>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Modifications non sauvegardées</AlertDialogTitle>
            <AlertDialogDescription>
              Vous avez des modifications non sauvegardées. Si vous quittez
              maintenant, ces modifications seront perdues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Continuer l'édition
            </Button>
            <Button variant="danger" onClick={handleConfirmCancel}>
              Quitter sans sauvegarder
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Mini wireframe pour visualiser la position du bloc client (copie des devis)
function ClientPositionPreview({ position }) {
  const isCenter = position === "center";
  const ClientBlock = (
    <div className="flex flex-col gap-[2px] w-[22px]">
      <div className="h-[2px] w-full rounded-full bg-neutral-300" />
      <div className="h-[2px] w-[80%] rounded-full bg-neutral-300" />
      <div className="h-[2px] w-[90%] rounded-full bg-neutral-300" />
      <div className="h-[2px] w-[70%] rounded-full bg-neutral-300" />
    </div>
  );
  return (
    <div className="w-full aspect-[88/70] bg-white dark:bg-neutral-100 rounded p-2 flex flex-col gap-1.5 overflow-hidden">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-[2px] w-[22px]">
          <div className="h-[2px] w-full rounded-full bg-neutral-400" />
          <div className="h-[2px] w-[70%] rounded-full bg-neutral-300" />
          <div className="h-[2px] w-[85%] rounded-full bg-neutral-300" />
        </div>
        <div className="flex flex-col items-end gap-[2px] w-[18px]">
          <div className="h-[3px] w-full rounded-full bg-neutral-500" />
          <div className="h-[2px] w-[70%] rounded-full bg-neutral-300" />
        </div>
      </div>
      <div
        className={`mt-0.5 flex ${isCenter ? "justify-center" : "justify-end"}`}
      >
        {ClientBlock}
      </div>
      <div className="flex-1" />
      <div className="space-y-[2px]">
        <div className="h-[2px] w-full rounded-full bg-neutral-200" />
        <div className="h-[2px] w-full rounded-full bg-neutral-200" />
        <div className="h-[2px] w-full rounded-full bg-neutral-200" />
      </div>
    </div>
  );
}
