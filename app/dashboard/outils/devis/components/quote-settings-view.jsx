"use client";

import React, { useState, useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { Tag } from "lucide-react";
import { documentSuggestions } from "@/src/utils/document-suggestions";
import { SuggestionDropdown } from "@/src/components/ui/suggestion-dropdown";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Separator } from "@/src/components/ui/separator";
import { Alert, AlertDescription } from "@/src/components/ui/alert";
import { Button } from "@/src/components/ui/button";
import { ColorPicker } from "@/src/components/ui/color-picker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";


export default function QuoteSettingsView({ canEdit, onCancel, onSave, onCloseAttempt }) {
  const {
    watch,
    setValue,
    register,
    formState: { errors, dirtyFields },
  } = useFormContext();
  const data = watch();
  
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const initialValuesRef = useRef(null);

  // Exposer la fonction de gestion de fermeture au parent
  React.useEffect(() => {
    if (onCloseAttempt) {
      onCloseAttempt(() => handleCancelClick);
    }
  }, [hasUnsavedChanges]);

  // Sauvegarder les valeurs initiales au montage
  useEffect(() => {
    if (!initialValuesRef.current) {
      initialValuesRef.current = {
        textColor: data.appearance?.textColor,
        headerTextColor: data.appearance?.headerTextColor,
        headerBgColor: data.appearance?.headerBgColor,
        headerNotes: data.headerNotes,
        footerNotes: data.footerNotes,
        termsAndConditions: data.termsAndConditions,
      };
    }
  }, []);

  // Détecter les changements non sauvegardés
  useEffect(() => {
    if (!initialValuesRef.current) return;

    const hasChanges =
      data.appearance?.textColor !== initialValuesRef.current.textColor ||
      data.appearance?.headerTextColor !== initialValuesRef.current.headerTextColor ||
      data.appearance?.headerBgColor !== initialValuesRef.current.headerBgColor ||
      data.headerNotes !== initialValuesRef.current.headerNotes ||
      data.footerNotes !== initialValuesRef.current.footerNotes ||
      data.termsAndConditions !== initialValuesRef.current.termsAndConditions;

    setHasUnsavedChanges(hasChanges);
  }, [data]);

  const handleCancelClick = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      onCancel();
    }
  };

  const handleConfirmCancel = () => {
    // Restaurer les valeurs initiales avec fallback sur les valeurs par défaut
    if (initialValuesRef.current) {
      setValue("appearance.textColor", initialValuesRef.current.textColor || "#000000");
      setValue("appearance.headerTextColor", initialValuesRef.current.headerTextColor || "#ffffff");
      setValue("appearance.headerBgColor", initialValuesRef.current.headerBgColor || "#5b50FF");
      setValue("headerNotes", initialValuesRef.current.headerNotes || "");
      setValue("footerNotes", initialValuesRef.current.footerNotes || "");
      setValue("termsAndConditions", initialValuesRef.current.termsAndConditions || "");
    }
    setShowConfirmDialog(false);
    onCancel();
  };

  const handleSaveClick = () => {
    // Mettre à jour les valeurs de référence après la sauvegarde
    initialValuesRef.current = {
      textColor: data.appearance?.textColor,
      headerTextColor: data.appearance?.headerTextColor,
      headerBgColor: data.appearance?.headerBgColor,
      headerNotes: data.headerNotes,
      footerNotes: data.footerNotes,
      termsAndConditions: data.termsAndConditions,
    };
    setHasUnsavedChanges(false);
    onSave();
  };


  return (
    <div className="h-full flex flex-col">
      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto pl-2 pr-2 space-y-6">
          {/* Bannière d'erreur globale */}
          {Object.keys(errors).length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                <div className="font-medium mb-2">Veuillez corriger les erreurs suivantes :</div>
                <ul className="list-disc list-inside space-y-1">
                  {errors.headerNotes && (
                    <li className="text-sm">Notes d'en-tête : {errors.headerNotes.message}</li>
                  )}
                  {errors.footerNotes && (
                    <li className="text-sm">Notes de bas de page : {errors.footerNotes.message}</li>
                  )}
                  {errors.termsAndConditions && (
                    <li className="text-sm">Conditions générales : {errors.termsAndConditions.message}</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Section Apparence */}
          <Card className="shadow-none border-none bg-transparent">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-2 font-normal text-lg">
                Apparence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              {/* Couleurs côte à côte */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Couleur du texte */}
                <div className="space-y-2">
                  <Label htmlFor="text-color" className="font-light">
                    Couleur du texte
                  </Label>
                  <ColorPicker
                    className="w-full"
                    color={data.appearance?.textColor || "#000000"}
                    onChange={(color) => {
                      setValue("appearance.textColor", color, {
                        shouldDirty: true,
                      });
                    }}
                    disabled={!canEdit}
                  />
                </div>

                {/* Couleur des titres du header */}
                <div className="space-y-2">
                  <Label htmlFor="header-text-color" className="font-light">
                    Couleur des titres du tableau
                  </Label>
                  <ColorPicker
                    className="w-full"
                    color={data.appearance?.headerTextColor || "#ffffff"}
                    onChange={(color) => {
                      setValue("appearance.headerTextColor", color, {
                        shouldDirty: true,
                      });
                    }}
                    disabled={!canEdit}
                  />
                </div>
              </div>

              {/* Couleur de fond du header */}
              <div className="space-y-2">
                <Label htmlFor="header-bg-color" className="font-light">
                  Couleur de fond du tableau
                </Label>
                <ColorPicker
                  className="w-full"
                  color={data.appearance?.headerBgColor || "#5b50FF"}
                  onChange={(color) => {
                    setValue("appearance.headerBgColor", color, {
                      shouldDirty: true,
                    });
                  }}
                  disabled={!canEdit}
                />
              </div>
            </CardContent>
          </Card>
          <Separator />

          {/* Notes et bas de page */}
          <Card className="shadow-none border-none bg-transparent">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-2 font-normal text-lg">
                <Tag className="h-5 w-5" />
                Notes et bas de page
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              {/* Notes d'en-tête */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="header-notes" className="font-light">
                    Notes d'en-tête
                  </Label>
                  <SuggestionDropdown
                    suggestions={documentSuggestions.headerNotes}
                    onSelect={(value) => setValue("headerNotes", value, { shouldDirty: true })}
                    label="Suggestions"
                  />
                </div>
                <div className="space-y-1">
                  <Textarea
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
                    placeholder="Notes qui apparaîtront en haut du devis..."
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

              {/* Notes de bas de page */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="footer-notes" className="font-light">
                    Notes de bas de page
                  </Label>
                  <SuggestionDropdown
                    suggestions={documentSuggestions.footerNotes}
                    onSelect={(value) => setValue("footerNotes", value, { shouldDirty: true })}
                    label="Suggestions"
                  />
                </div>
                <div className="space-y-1">
                  <Textarea
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
                    placeholder="Notes qui apparaîtront en bas du devis..."
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

              {/* Conditions générales */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="terms-conditions" className="font-light">
                    Conditions générales
                  </Label>
                  <SuggestionDropdown
                    suggestions={documentSuggestions.termsAndConditions}
                    onSelect={(value) => setValue("termsAndConditions", value, { shouldDirty: true })}
                    label="Suggestions"
                  />
                </div>
                <div className="space-y-1">
                  <Textarea
                    id="terms-conditions"
                    className={`mt-2 ${errors?.termsAndConditions ? "border-red-500" : ""}`}
                    {...register("termsAndConditions", {
                      maxLength: {
                        value: 2000,
                        message:
                          "Les conditions générales ne doivent pas dépasser 2000 caractères",
                      },
                    })}
                    defaultValue={data.termsAndConditions || ""}
                    placeholder="Conditions générales de vente..."
                    rows={4}
                    disabled={!canEdit}
                  />
                  {errors?.termsAndConditions && (
                    <p className="text-xs text-red-500">
                      {errors.termsAndConditions.message}
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
            className="font-normal"
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSaveClick} 
            disabled={!canEdit} 
            className="font-normal"
          >
            Enregistrer les modifications
          </Button>
        </div>
      </div>

      {/* Dialog de confirmation */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Modifications non sauvegardées</AlertDialogTitle>
            <AlertDialogDescription>
              Vous avez des modifications non sauvegardées. Si vous quittez maintenant, ces modifications seront perdues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>
              Continuer l'édition
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel}>
              Quitter sans sauvegarder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
