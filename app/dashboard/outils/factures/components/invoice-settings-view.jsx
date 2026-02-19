"use client";

import { useFormContext } from "react-hook-form";
import React, { useEffect, useState, useRef } from "react";
import {
  Settings,
  AlignLeft,
  AlignRight,
  Check,
  Info,
} from "lucide-react";
import { useInvoiceNumber } from "../hooks/use-invoice-number";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { getCurrentMonthYear } from "@/src/utils/invoiceUtils";
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
import { Checkbox } from "@/src/components/ui/checkbox";
import { Input } from "@/src/components/ui/input";
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
import { BankDetailsDialog } from "@/src/components/bank-details-dialog";
import CompanyInfoSettingsSection from "@/src/components/settings/company-info-settings-section";

// Fonction de validation de l'IBAN
const validateIBAN = (value) => {
  if (!value) return true; // Optionnel si les coordonnées bancaires ne sont pas affichées
  // Format IBAN de base - validation simplifiée
  const ibanRegex = /^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/;
  return ibanRegex.test(value.replace(/\s/g, "")) || "Format IBAN invalide";
};

// Fonction de validation du BIC/SWIFT
const validateBIC = (value) => {
  if (!value) return true; // Optionnel si les coordonnées bancaires ne sont pas affichées
  // Format BIC/SWIFT - 8 ou 11 caractères alphanumériques
  const bicRegex = /^[A-Z0-9]{8}([A-Z0-9]{3})?$/;
  return (
    bicRegex.test(value) ||
    "Format BIC/SWIFT invalide (8 ou 11 caractères alphanumériques)"
  );
};

// Fonction de formatage de l'IBAN avec espaces
const formatIban = (iban) => {
  if (!iban) return "";

  // Supprimer tous les espaces existants et convertir en majuscules
  const cleanIban = iban.replace(/\s/g, "").toUpperCase();

  // Ajouter un espace tous les 4 caractères
  return cleanIban.replace(/(.{4})/g, "$1 ").trim();
};

export default function InvoiceSettingsView({
  canEdit,
  onCancel,
  onSave,
  onCloseAttempt,
  validateInvoiceNumberExists,
  validationErrors = {},
  setValidationErrors,
  organization,
}) {
  const {
    watch,
    setValue,
    register,
    formState: { errors },
  } = useFormContext();
  const data = watch();

  // Hook pour la numérotation séquentielle des factures
  const {
    nextInvoiceNumber,
    validateInvoiceNumber,
    isLoading: isLoadingInvoiceNumber,
    hasExistingInvoices,
    getFormattedNextNumber,
  } = useInvoiceNumber();

  // Gérer le changement de préfixe avec auto-fill pour MM et AAAA
  const handlePrefixChange = (e) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;

    // Auto-fill MM (month)
    if (value.includes("MM")) {
      const { month } = getCurrentMonthYear();
      const newValue = value.replace("MM", month);
      setValue("prefix", newValue, { shouldValidate: true });
      const newPosition = cursorPosition + month.length - 2;
      setTimeout(() => {
        e.target.setSelectionRange(newPosition, newPosition);
      }, 0);
      return;
    }

    // Auto-fill AAAA (year)
    if (value.includes("AAAA")) {
      const { year } = getCurrentMonthYear();
      const newValue = value.replace("AAAA", year);
      setValue("prefix", newValue, { shouldValidate: true });
      const newPosition = cursorPosition + year.length - 4;
      setTimeout(() => {
        e.target.setSelectionRange(newPosition, newPosition);
      }, 0);
      return;
    }

    // Default behavior
    setValue("prefix", value, { shouldValidate: true });
  };

  // Debug: Log des couleurs reçues
  useEffect(() => {
    console.log("🎨 InvoiceSettingsView - Couleurs reçues:", {
      textColor: data.appearance?.textColor,
      headerTextColor: data.appearance?.headerTextColor,
      headerBgColor: data.appearance?.headerBgColor,
    });
  }, [data.appearance]);

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showBankDetailsDialog, setShowBankDetailsDialog] = useState(false);
  const [organizationRefreshKey, setOrganizationRefreshKey] = useState(0);
  const initialValuesRef = useRef(null);

  // Fonction pour rafraîchir les données de l'organisation après mise à jour
  const handleBankDetailsSuccess = async () => {
    // La mise à jour se fera via l'écouteur d'événement ci-dessous
  };

  // Écouter l'événement personnalisé émis par BankDetailsDialog
  useEffect(() => {
    const handleOrganizationUpdated = (event) => {
      const { bankName, bankIban, bankBic } = event.detail;

      if (bankIban || bankBic || bankName) {
        // Mettre à jour les données bancaires dans le formulaire
        setValue("bankDetails.iban", bankIban || "", {
          shouldDirty: true,
        });
        setValue("bankDetails.bic", bankBic || "", {
          shouldDirty: true,
        });
        setValue("bankDetails.bankName", bankName || "", {
          shouldDirty: true,
        });

        // Mettre à jour userBankDetails pour que la checkbox soit visible
        setValue("userBankDetails", {
          iban: bankIban || "",
          bic: bankBic || "",
          bankName: bankName || "",
        });

        // Cocher automatiquement la checkbox pour afficher les coordonnées bancaires
        setValue("showBankDetails", true, {
          shouldDirty: true,
        });
      }
    };

    window.addEventListener("organizationUpdated", handleOrganizationUpdated);

    // Nettoyer l'écouteur au démontage
    return () => {
      window.removeEventListener(
        "organizationUpdated",
        handleOrganizationUpdated
      );
    };
  }, [setValue]);

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
        showBankDetails: data.showBankDetails,
        clientPositionRight: data.clientPositionRight,
      };
    }
  }, []);

  // Détecter les changements non sauvegardés
  useEffect(() => {
    if (!initialValuesRef.current) return;

    const hasChanges =
      data.appearance?.textColor !== initialValuesRef.current.textColor ||
      data.appearance?.headerTextColor !==
        initialValuesRef.current.headerTextColor ||
      data.appearance?.headerBgColor !==
        initialValuesRef.current.headerBgColor ||
      data.headerNotes !== initialValuesRef.current.headerNotes ||
      data.footerNotes !== initialValuesRef.current.footerNotes ||
      data.termsAndConditions !== initialValuesRef.current.termsAndConditions ||
      data.showBankDetails !== initialValuesRef.current.showBankDetails ||
      data.clientPositionRight !== initialValuesRef.current.clientPositionRight;

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
      setValue(
        "appearance.textColor",
        initialValuesRef.current.textColor || "#000000"
      );
      setValue(
        "appearance.headerTextColor",
        initialValuesRef.current.headerTextColor || "#ffffff"
      );
      setValue(
        "appearance.headerBgColor",
        initialValuesRef.current.headerBgColor || "#5b50FF"
      );
      setValue("headerNotes", initialValuesRef.current.headerNotes || "");
      setValue("footerNotes", initialValuesRef.current.footerNotes || "");
      setValue(
        "termsAndConditions",
        initialValuesRef.current.termsAndConditions || ""
      );
      setValue(
        "showBankDetails",
        initialValuesRef.current.showBankDetails || false
      );
      setValue(
        "clientPositionRight",
        initialValuesRef.current.clientPositionRight || false
      );
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
      showBankDetails: data.showBankDetails,
      clientPositionRight: data.clientPositionRight,
    };
    setHasUnsavedChanges(false);
    onSave();
  };

  // Import automatique des coordonnées bancaires lors du chargement initial
  useEffect(() => {
    // Si showBankDetails est true et qu'il n'y a pas encore de données dans bankDetails
    // mais qu'il y a des données dans companyInfo.bankDetails (facture existante) ou userBankDetails (utilisateur actuel), les importer
    if (
      data.showBankDetails &&
      !data.bankDetails?.iban &&
      !data.bankDetails?.bic &&
      !data.bankDetails?.bankName
    ) {
      // Priorité aux données de la facture existante, sinon utiliser celles de l'utilisateur actuel
      const sourceData =
        data.companyInfo?.bankDetails &&
        (data.companyInfo.bankDetails.iban ||
          data.companyInfo.bankDetails.bic ||
          data.companyInfo.bankDetails.bankName)
          ? data.companyInfo.bankDetails
          : data.userBankDetails;

      if (
        sourceData &&
        (sourceData.iban || sourceData.bic || sourceData.bankName)
      ) {
        setValue("bankDetails.iban", sourceData.iban || "", {
          shouldDirty: true,
        });
        setValue("bankDetails.bic", sourceData.bic || "", {
          shouldDirty: true,
        });
        setValue("bankDetails.bankName", sourceData.bankName || "", {
          shouldDirty: true,
        });
      }
    }
  }, [
    data.showBankDetails,
    data.companyInfo?.bankDetails,
    data.userBankDetails,
    data.bankDetails,
    setValue,
  ]);

  return (
    <div className="h-full flex flex-col">
      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto pl-2 pr-2 space-y-6">
          {/* Bannière d'erreur globale */}
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
                  {errors.footerNotes && (
                    <li className="text-sm">
                      Notes de bas de page : {errors.footerNotes.message}
                    </li>
                  )}
                  {errors.termsAndConditions && (
                    <li className="text-sm">
                      Conditions générales : {errors.termsAndConditions.message}
                    </li>
                  )}
                  {errors.bankDetails?.iban && (
                    <li className="text-sm">
                      IBAN : {errors.bankDetails.iban.message}
                    </li>
                  )}
                  {errors.bankDetails?.bic && (
                    <li className="text-sm">
                      BIC/SWIFT : {errors.bankDetails.bic.message}
                    </li>
                  )}
                  {errors.prefix && (
                    <li className="text-sm">
                      Préfixe : {errors.prefix.message}
                    </li>
                  )}
                  {errors.number && (
                    <li className="text-sm">
                      Numéro : {errors.number.message}
                    </li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Section Informations de l'entreprise */}
          <CompanyInfoSettingsSection />
          <Separator />

          {/* Section Numérotation */}
          <Card className="shadow-none border-none bg-transparent">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-2 font-normal text-lg">
                Numérotation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Préfixe de facture */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="invoice-prefix"
                      className="text-sm font-light"
                    >
                      Préfixe de facture
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
                          Préfixe personnalisable pour identifier vos factures.
                          Tapez <span className="font-mono">MM</span> pour
                          insérer le mois actuel ou{" "}
                          <span className="font-mono">AAAA</span> pour l'année.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="space-y-1">
                    <Input
                      id="invoice-prefix"
                      {...register("prefix", {
                        maxLength: {
                          value: 20,
                          message:
                            "Le préfixe ne doit pas dépasser 20 caractères",
                        },
                        pattern: {
                          value: /^[A-Za-z0-9-]*$/,
                          message:
                            "Le préfixe ne doit contenir que des lettres, chiffres et tirets",
                        },
                      })}
                      onChange={handlePrefixChange}
                      onBlur={async (e) => {
                        // Vérifier si le numéro existe déjà quand le préfixe change
                        const currentNumber = data.number;
                        if (currentNumber && validateInvoiceNumberExists) {
                          await validateInvoiceNumberExists(
                            currentNumber,
                            e.target.value
                          );
                        }
                      }}
                      placeholder="F-MMAAAA"
                      disabled={!canEdit}
                      className={
                        errors?.prefix
                          ? "border-destructive focus-visible:ring-1 focus-visible:ring-destructive"
                          : ""
                      }
                    />
                    {errors?.prefix && (
                      <p className="text-xs text-destructive">
                        {errors.prefix.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Numéro de facture */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="invoice-number"
                      className="text-sm font-light"
                    >
                      Numéro de facture
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
                          Numéro unique et séquentiel de votre facture. La
                          numérotation doit être continue sans saut pour
                          respecter les obligations légales.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="space-y-1">
                    <Input
                      id="invoice-number"
                      {...register("number", {
                        required: "Le numéro de facture est requis",
                        validate: {
                          isNumeric: (value) => {
                            if (!/^\d+$/.test(value)) {
                              return "Le numéro doit contenir uniquement des chiffres";
                            }
                            return true;
                          },
                          isValidSequence: (value) => {
                            if (isLoadingInvoiceNumber) return true;
                            const result = validateInvoiceNumber(
                              parseInt(value, 10)
                            );
                            return result.isValid || result.message;
                          },
                        },
                        minLength: {
                          value: 1,
                          message: "Le numéro est requis",
                        },
                        maxLength: {
                          value: 6,
                          message: "Le numéro ne peut pas dépasser 6 chiffres",
                        },
                      })}
                      value={
                        data.number ||
                        (nextInvoiceNumber
                          ? String(nextInvoiceNumber).padStart(4, "0")
                          : "")
                      }
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        setValue("number", value, { shouldValidate: true });
                      }}
                      onBlur={async (e) => {
                        let finalNumber;
                        if (e.target.value) {
                          finalNumber = e.target.value.padStart(4, "0");
                          setValue("number", finalNumber, {
                            shouldValidate: true,
                          });
                        } else if (nextInvoiceNumber) {
                          finalNumber = String(nextInvoiceNumber).padStart(
                            4,
                            "0"
                          );
                          setValue("number", finalNumber, {
                            shouldValidate: true,
                          });
                        }

                        // Vérifier si le numéro existe déjà (avec le préfixe)
                        if (finalNumber && validateInvoiceNumberExists) {
                          const currentPrefix = data.prefix;
                          await validateInvoiceNumberExists(
                            finalNumber,
                            currentPrefix
                          );
                        }
                      }}
                      placeholder={
                        nextInvoiceNumber
                          ? String(nextInvoiceNumber).padStart(4, "0")
                          : "000001"
                      }
                      disabled={!canEdit || isLoadingInvoiceNumber}
                      className={
                        errors?.number || validationErrors?.invoiceNumber
                          ? "border-destructive focus-visible:ring-1 focus-visible:ring-destructive"
                          : ""
                      }
                    />
                    {errors?.number && (
                      <p className="text-xs text-destructive">
                        {errors.number.message}
                      </p>
                    )}
                    {!errors?.number && validationErrors?.invoiceNumber && (
                      <p className="text-xs text-destructive">
                        {validationErrors.invoiceNumber.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Note explicative sur la numérotation */}
              <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-muted">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-medium">Note :</span> La numérotation
                  des factures doit être séquentielle et continue pour respecter
                  les obligations légales françaises. Le préfixe vous permet
                  d'organiser vos factures par période (ex: F-122025 pour
                  décembre 2025). Le système vérifie automatiquement qu'il n'y a
                  pas de saut dans la numérotation.
                </p>
              </div>
            </CardContent>
          </Card>
          <Separator />

          {/* Coordonnées bancaires */}
          <Card className="shadow-none border-none bg-transparent">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-2 font-normal text-lg">
                Coordonnées bancaires
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              {/* Séparateur avec titre de section */}
              {/* <div className="relative">
                <Separator />
              </div> */}

              {/* Vérifier si des coordonnées bancaires sont disponibles */}
              {data.userBankDetails?.iban ||
              data.userBankDetails?.bic ||
              data.userBankDetails?.bankName ? (
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="show-bank-details"
                    checked={data.showBankDetails || false}
                    onCheckedChange={(checked) => {
                      setValue("showBankDetails", checked, {
                        shouldDirty: true,
                      });
                    }}
                    disabled={!canEdit}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="show-bank-details"
                      className="text-sm font-light leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Afficher les coordonnées bancaires
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Cochez pour inclure vos coordonnées bancaires sur la
                      facture
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-md">
                  <p className="mb-2">
                    Aucune coordonnée bancaire n'est configurée pour votre
                    entreprise.
                  </p>
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto font-medium flex items-center gap-1"
                    onClick={() => setShowBankDetailsDialog(true)}
                  >
                    <Settings className="h-4 w-4" />
                    Configurer les coordonnées bancaires
                  </Button>
                </div>
              )}

              {/* Afficher les détails bancaires si activé et disponibles */}
              {data.showBankDetails &&
                (data.userBankDetails?.iban ||
                  data.userBankDetails?.bic ||
                  data.userBankDetails?.bankName) && (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                    {/* Nom de la banque */}
                    <div>
                      <Label className="font-light">Nom de la banque</Label>
                      <div className="mt-2 p-2 bg-white rounded-md border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                        <p className="text-sm">
                          {data.bankDetails?.bankName || "Non spécifié"}
                        </p>
                      </div>
                    </div>

                    {/* IBAN */}
                    <div>
                      <Label className="font-normal">IBAN</Label>
                      <div className="mt-2 p-2 bg-white rounded-md border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                        <p className="text-sm font-mono">
                          {formatIban(data.bankDetails?.iban) || "Non spécifié"}
                        </p>
                      </div>
                    </div>

                    {/* BIC/SWIFT */}
                    <div>
                      <Label className="font-normal">BIC/SWIFT</Label>
                      <div className="mt-2 p-2 bg-white rounded-md border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                        <p className="text-sm font-mono">
                          {data.bankDetails?.bic || "Non spécifié"}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mt-2">
                      Les coordonnées bancaires sont gérées dans les paramètres
                      de votre entreprise.
                    </p>

                    {/* Alerte informative */}
                    <Alert>
                      <AlertDescription>
                        Ces coordonnées bancaires apparaîtront sur votre facture
                        pour faciliter les paiements de vos clients.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
            </CardContent>
          </Card>
          <Separator />

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
                />
              </div>
            </CardContent>
          </Card>
          <Separator />

          {/* Position du client */}
          <Card className="shadow-none border-none bg-transparent">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-2 font-normal text-lg">
                Position du client dans le PDF
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <p className="text-sm text-muted-foreground">
                Choisissez où afficher les informations du client dans vos
                factures
              </p>
              <div className="grid grid-cols-2 gap-3">
                {/* Option Centre */}
                <button
                  type="button"
                  onClick={() =>
                    setValue("clientPositionRight", false, {
                      shouldDirty: true,
                    })
                  }
                  disabled={!canEdit}
                  className={`
                    relative flex flex-col items-center gap-2 p-4 rounded-lg border-1 transition-all
                    ${
                      !data.clientPositionRight
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-background hover:border-primary/50"
                    }
                    ${!canEdit ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                  `}
                >
                  <AlignLeft
                    className={`h-6 w-6 ${!data.clientPositionRight ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <div className="text-center">
                    <div
                      className={`text-sm font-medium ${!data.clientPositionRight ? "text-primary" : "text-foreground"}`}
                    >
                      Au centre
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Position standard
                    </div>
                  </div>
                  {!data.clientPositionRight && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </button>

                {/* Option Droite */}
                <button
                  type="button"
                  onClick={() =>
                    setValue("clientPositionRight", true, { shouldDirty: true })
                  }
                  disabled={!canEdit}
                  className={`
                    relative flex flex-col items-center gap-2 p-4 rounded-lg border-1 transition-all
                    ${
                      data.clientPositionRight
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-background hover:border-primary/50"
                    }
                    ${!canEdit ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                  `}
                >
                  <AlignRight
                    className={`h-6 w-6 ${data.clientPositionRight ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <div className="text-center">
                    <div
                      className={`text-sm font-medium ${data.clientPositionRight ? "text-primary" : "text-foreground"}`}
                    >
                      À droite
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Aligné à droite
                    </div>
                  </div>
                  {data.clientPositionRight && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
          <Separator />

          {/* Notes et bas de page */}
          <Card className="shadow-none border-none bg-transparent">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-2 font-normal text-lg">
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
                    onSelect={(value) =>
                      setValue("headerNotes", value, { shouldDirty: true })
                    }
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
                    placeholder="Notes qui apparaîtront en haut de la facture..."
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
                    onSelect={(value) =>
                      setValue("footerNotes", value, { shouldDirty: true })
                    }
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
                    placeholder="Notes qui apparaîtront en bas de la facture..."
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
                    onSelect={(value) =>
                      setValue("termsAndConditions", value, {
                        shouldDirty: true,
                      })
                    }
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
              Vous avez des modifications non sauvegardées. Si vous quittez
              maintenant, ces modifications seront perdues.
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

      {/* Dialog de configuration des coordonnées bancaires */}
      <BankDetailsDialog
        open={showBankDetailsDialog}
        onOpenChange={setShowBankDetailsDialog}
        organization={organization}
        onSuccess={handleBankDetailsSuccess}
      />
    </div>
  );
}
