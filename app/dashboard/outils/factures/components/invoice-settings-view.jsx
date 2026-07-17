"use client";

import { useFormContext } from "react-hook-form";
import React, { useEffect, useState, useRef } from "react";
import { Settings, Check, Info, Minus } from "lucide-react";
import { useInvoiceNumber } from "../hooks/use-invoice-number";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import {
  getCurrentMonthYear,
  generateInvoicePrefix,
} from "@/src/utils/invoiceUtils";
import { documentSuggestions } from "@/src/utils/document-suggestions";
import { SuggestionDropdown } from "@/src/components/ui/suggestion-dropdown";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import { TextareaNew } from "@/src/components/ui/textarea-new";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Input } from "@/src/components/ui/input";
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
import { BankDetailsDialog } from "@/src/components/bank-details-dialog";
import CompanyInfoSettingsSection from "@/src/components/settings/company-info-settings-section";
import { Switch } from "@/src/components/ui/switch";

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
  saveLabel = "Enregistrer les modifications",
  isGlobalSettings = false,
}) {
  const {
    watch,
    setValue,
    register,
    formState: { errors },
  } = useFormContext();
  const data = watch();

  // Hook pour la numérotation séquentielle des factures
  const autoNumbering = data.autoNumbering || false;

  // Deux hooks : un per-prefix (toujours actif) et un global (quand autoNumbering)
  const perPrefixHook = useInvoiceNumber(data.prefix, { autoNumbering: false });
  const globalHook = useInvoiceNumber(data.prefix, { autoNumbering: true });

  // Sélectionner le bon hook selon le mode
  const activeHook = autoNumbering ? globalHook : perPrefixHook;
  const {
    nextInvoiceNumber,
    validateInvoiceNumber,
    isLoading: isLoadingInvoiceNumber,
    hasExistingInvoices,
    hasDocumentsForPrefix,
    getFormattedNextNumber,
  } = activeHook;

  // Le numéro est éditable manuellement dès que la numérotation séquentielle
  // automatique est désactivée, indépendamment du préfixe.
  // En mode autoNumbering, le numéro est toujours verrouillé (séquence imposée).
  const canEditNumber = !autoNumbering;

  // Auto-initialiser le préfixe si vide (au montage uniquement)
  useEffect(() => {
    if (!data.prefix) {
      setValue("prefix", generateInvoicePrefix(), { shouldValidate: false });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Préfixe / mode pour lesquels le numéro a été synchronisé en dernier.
  const numberSyncedForPrefixRef = useRef(null);
  const lastAutoNumberingRef = useRef(autoNumbering);

  // Synchroniser le numéro depuis le hook de numérotation.
  // Déps limitées aux données du hook → n'agit qu'une fois la requête résolue
  // pour le préfixe courant. Ne met à jour le champ que si la valeur change
  // vraiment (pas d'état "numéro vide", pas de re-render inutile).
  useEffect(() => {
    if (isLoadingInvoiceNumber || nextInvoiceNumber == null) return;
    const formattedNumber = String(nextInvoiceNumber).padStart(4, "0");

    const firstSyncWithNumber =
      numberSyncedForPrefixRef.current === null && Boolean(data.number);
    const prefixChanged = numberSyncedForPrefixRef.current !== data.prefix;
    const modeChanged = lastAutoNumberingRef.current !== autoNumbering;
    numberSyncedForPrefixRef.current = data.prefix;
    lastAutoNumberingRef.current = autoNumbering;

    const setIfDifferent = () => {
      if (data.number !== formattedNumber) {
        setValue("number", formattedNumber, { shouldValidate: false });
      }
    };

    if (autoNumbering) {
      // Séquence continue → numéro séquentiel imposé (verrouillé)
      setIfDifferent();
    } else if (isGlobalSettings && hasDocumentsForPrefix) {
      // Paramètres généraux + préfixe existant → afficher le prochain numéro
      // RÉEL (cohérent avec l'éditeur). Le "numéro de départ" enregistré ne
      // s'applique qu'à un nouveau préfixe et devient périmé ensuite.
      setIfDifferent();
    } else if (firstSyncWithNumber) {
      // Première synchro avec un numéro déjà présent (numéro du document dans
      // l'éditeur, ou numéro de départ d'un nouveau préfixe) → préserver.
    } else if (prefixChanged || modeChanged || !data.number) {
      // Mode manuel : changement de préfixe (nouveau → 0001, existant → la
      // suite), désactivation de la séquence continue, ou champ vide.
      // Reste modifiable ensuite.
      setIfDifferent();
    }
    // data.number dans les deps : si le formulaire est réinitialisé en externe
    // (ex: le modal des paramètres réécrit le numéro de départ après coup),
    // l'effet se réapplique et reprend la main. La garde setIfDifferent évite
    // toute boucle (aucun setValue si la valeur est déjà correcte).
  }, [nextInvoiceNumber, isLoadingInvoiceNumber, autoNumbering, data.number]); // eslint-disable-line react-hooks/exhaustive-deps

  // Gérer le changement de préfixe avec auto-fill pour MM et AAAA
  const handlePrefixChange = (e) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;

    // Le useEffect synchronisera le numéro quand le hook aura rechargé avec le nouveau préfixe

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

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showBankDetailsDialog, setShowBankDetailsDialog] = useState(false);
  const [organizationRefreshKey, setOrganizationRefreshKey] = useState(0);
  const [numberDuplicateError, setNumberDuplicateError] = useState(null);
  const [numberSequenceError, setNumberSequenceError] = useState(null);
  const [showAutoNumberingConfirm, setShowAutoNumberingConfirm] =
    useState(false);
  const initialValuesRef = useRef(null);

  // Des factures finalisées existent-elles déjà (tous préfixes confondus) ?
  // Le hook global ne filtre pas par préfixe : hasDocumentsForPrefix = max global > 0.
  const hasAnyFinalizedInvoice = globalHook.hasDocumentsForPrefix;

  // Activation de la séquence continue : confirmation requise si des factures
  // existent déjà (la numérotation doit rester chronologique).
  const handleAutoNumberingChange = (checked) => {
    if (checked && hasAnyFinalizedInvoice) {
      setShowAutoNumberingConfirm(true);
      return;
    }
    setValue("autoNumbering", checked, { shouldValidate: false });
  };

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
        handleOrganizationUpdated,
      );
    };
  }, [setValue]);

  // Exposer la fonction de gestion de fermeture au parent
  // Enregistré UNE seule fois via une ref stable : ré-enregistrer à chaque
  // changement de hasUnsavedChanges provoquait un setState du parent en
  // cascade (risque de "Maximum update depth exceeded"), et le handler
  // capturé était figé sur une valeur périmée de hasUnsavedChanges.
  const handleCancelClickRef = React.useRef(null);
  React.useEffect(() => {
    handleCancelClickRef.current = handleCancelClick;
  });
  React.useEffect(() => {
    if (onCloseAttempt) {
      onCloseAttempt(() => () => handleCancelClickRef.current?.());
    }
  }, [onCloseAttempt]);

  // Sauvegarder les valeurs initiales au montage
  useEffect(() => {
    if (!initialValuesRef.current) {
      initialValuesRef.current = {
        // Numérotation
        prefix: data.prefix,
        number: data.number,
        autoNumbering: data.autoNumbering,
        textColor: data.appearance?.textColor,
        headerTextColor: data.appearance?.headerTextColor,
        headerBgColor: data.appearance?.headerBgColor,
        headerNotes: data.headerNotes,
        footerNotes: data.footerNotes,
        termsAndConditions: data.termsAndConditions,
        showBankDetails: data.showBankDetails,
        clientPositionRight: data.clientPositionRight,
        // Infos entreprise (flat + companyInfo nested pour la preview)
        companyName: data.companyName,
        commercialName: data.commercialName,
        showCommercialName: data.showCommercialName,
        isRegulatedActivity: data.isRegulatedActivity,
        professionalTitle: data.professionalTitle,
        regulatoryBody: data.regulatoryBody,
        professionalNumber: data.professionalNumber,
        decennialInsurance: data.decennialInsurance,
        professionalLiabilityInsurance: data.professionalLiabilityInsurance,
        logo: data.logo,
        companyEmail: data.companyEmail,
        companyPhone: data.companyPhone,
        website: data.website,
        addressStreet: data.addressStreet,
        addressCity: data.addressCity,
        addressZipCode: data.addressZipCode,
        addressCountry: data.addressCountry,
        companyInfo: data.companyInfo,
      };
    }
  }, []);

  // Détecter les changements non sauvegardés
  useEffect(() => {
    if (!initialValuesRef.current) return;

    const hasChanges =
      data.prefix !== initialValuesRef.current.prefix ||
      data.number !== initialValuesRef.current.number ||
      data.autoNumbering !== initialValuesRef.current.autoNumbering ||
      data.appearance?.textColor !== initialValuesRef.current.textColor ||
      data.appearance?.headerTextColor !==
        initialValuesRef.current.headerTextColor ||
      data.appearance?.headerBgColor !==
        initialValuesRef.current.headerBgColor ||
      data.headerNotes !== initialValuesRef.current.headerNotes ||
      data.footerNotes !== initialValuesRef.current.footerNotes ||
      data.termsAndConditions !== initialValuesRef.current.termsAndConditions ||
      data.showBankDetails !== initialValuesRef.current.showBankDetails ||
      data.clientPositionRight !==
        initialValuesRef.current.clientPositionRight ||
      data.companyName !== initialValuesRef.current.companyName ||
      data.commercialName !== initialValuesRef.current.commercialName ||
      data.showCommercialName !== initialValuesRef.current.showCommercialName ||
      data.isRegulatedActivity !==
        initialValuesRef.current.isRegulatedActivity ||
      data.professionalTitle !== initialValuesRef.current.professionalTitle ||
      data.regulatoryBody !== initialValuesRef.current.regulatoryBody ||
      data.professionalNumber !== initialValuesRef.current.professionalNumber ||
      data.decennialInsurance !== initialValuesRef.current.decennialInsurance ||
      data.professionalLiabilityInsurance !==
        initialValuesRef.current.professionalLiabilityInsurance ||
      data.logo !== initialValuesRef.current.logo ||
      data.companyEmail !== initialValuesRef.current.companyEmail ||
      data.companyPhone !== initialValuesRef.current.companyPhone ||
      data.website !== initialValuesRef.current.website ||
      data.addressStreet !== initialValuesRef.current.addressStreet ||
      data.addressCity !== initialValuesRef.current.addressCity ||
      data.addressZipCode !== initialValuesRef.current.addressZipCode ||
      data.addressCountry !== initialValuesRef.current.addressCountry;

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
      // Numérotation : restaurer le mode AVANT préfixe/numéro pour neutraliser
      // l'effet de resynchronisation, puis remettre le numéro initial.
      setValue(
        "autoNumbering",
        initialValuesRef.current.autoNumbering ?? false,
        {
          shouldValidate: false,
        },
      );
      setValue("prefix", initialValuesRef.current.prefix ?? "", {
        shouldValidate: false,
      });
      setValue("number", initialValuesRef.current.number ?? "", {
        shouldValidate: false,
      });
      setValue(
        "appearance.textColor",
        initialValuesRef.current.textColor || "#000000",
      );
      setValue(
        "appearance.headerTextColor",
        initialValuesRef.current.headerTextColor || "#ffffff",
      );
      setValue(
        "appearance.headerBgColor",
        initialValuesRef.current.headerBgColor || "#5b50FF",
      );
      setValue("headerNotes", initialValuesRef.current.headerNotes || "");
      setValue("footerNotes", initialValuesRef.current.footerNotes || "");
      setValue(
        "termsAndConditions",
        initialValuesRef.current.termsAndConditions || "",
      );
      setValue(
        "showBankDetails",
        initialValuesRef.current.showBankDetails || false,
      );
      setValue(
        "clientPositionRight",
        initialValuesRef.current.clientPositionRight || false,
      );
      // Infos entreprise — restaurer les champs plats et l'objet companyInfo
      setValue("companyName", initialValuesRef.current.companyName ?? "");
      setValue("commercialName", initialValuesRef.current.commercialName ?? "");
      setValue(
        "showCommercialName",
        initialValuesRef.current.showCommercialName ?? false,
      );
      setValue(
        "isRegulatedActivity",
        initialValuesRef.current.isRegulatedActivity ?? false,
      );
      setValue(
        "professionalTitle",
        initialValuesRef.current.professionalTitle ?? "",
      );
      setValue("regulatoryBody", initialValuesRef.current.regulatoryBody ?? "");
      setValue(
        "professionalNumber",
        initialValuesRef.current.professionalNumber ?? "",
      );
      setValue(
        "decennialInsurance",
        initialValuesRef.current.decennialInsurance ?? "",
      );
      setValue(
        "professionalLiabilityInsurance",
        initialValuesRef.current.professionalLiabilityInsurance ?? "",
      );
      setValue("logo", initialValuesRef.current.logo ?? "");
      setValue("companyEmail", initialValuesRef.current.companyEmail ?? "");
      setValue("companyPhone", initialValuesRef.current.companyPhone ?? "");
      setValue("website", initialValuesRef.current.website ?? "");
      setValue("addressStreet", initialValuesRef.current.addressStreet ?? "");
      setValue("addressCity", initialValuesRef.current.addressCity ?? "");
      setValue("addressZipCode", initialValuesRef.current.addressZipCode ?? "");
      setValue(
        "addressCountry",
        initialValuesRef.current.addressCountry ?? "France",
      );
      if (initialValuesRef.current.companyInfo) {
        setValue("companyInfo", initialValuesRef.current.companyInfo);
      }
    }
    setShowConfirmDialog(false);
    onCancel();
  };

  const handleSaveClick = () => {
    // Mettre à jour les valeurs de référence après la sauvegarde
    initialValuesRef.current = {
      prefix: data.prefix,
      number: data.number,
      autoNumbering: data.autoNumbering,
      textColor: data.appearance?.textColor,
      headerTextColor: data.appearance?.headerTextColor,
      headerBgColor: data.appearance?.headerBgColor,
      headerNotes: data.headerNotes,
      footerNotes: data.footerNotes,
      termsAndConditions: data.termsAndConditions,
      showBankDetails: data.showBankDetails,
      clientPositionRight: data.clientPositionRight,
      companyName: data.companyName,
      commercialName: data.commercialName,
      showCommercialName: data.showCommercialName,
      isRegulatedActivity: data.isRegulatedActivity,
      professionalTitle: data.professionalTitle,
      regulatoryBody: data.regulatoryBody,
      professionalNumber: data.professionalNumber,
      decennialInsurance: data.decennialInsurance,
      professionalLiabilityInsurance: data.professionalLiabilityInsurance,
      logo: data.logo,
      companyEmail: data.companyEmail,
      companyPhone: data.companyPhone,
      website: data.website,
      addressStreet: data.addressStreet,
      addressCity: data.addressCity,
      addressZipCode: data.addressZipCode,
      addressCountry: data.addressCountry,
      companyInfo: data.companyInfo,
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
        <div className="max-w-2xl mx-auto pl-2 pr-2 space-y-8 pt-4 md:pt-6">
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

          {/* Section Numérotation */}
          <Card className="shadow-none border-none bg-transparent p-0">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-2 font-medium text-lg">
                Numérotation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              {/* Toggle numérotation automatique */}
              <div className="flex items-center justify-between p-3 rounded-xl border bg-[#F5F5F5] dark:bg-neutral-900">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    Numérotation séquentielle continue
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Le numéro suit une séquence unique, même lors d'un
                    changement de préfixe.
                  </p>
                </div>
                <Switch
                  checked={autoNumbering}
                  onCheckedChange={handleAutoNumberingChange}
                  className="data-[state=checked]:bg-[#5b4fff]"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Préfixe de facture */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="invoice-prefix"
                      className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55"
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
                            e.target.value,
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
                      className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55"
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
                      value={data.number || ""}
                      disabled={!canEditNumber}
                      readOnly={!canEditNumber}
                      tabIndex={canEditNumber ? 0 : -1}
                      onFocus={
                        canEditNumber ? undefined : (e) => e.target.blur()
                      }
                      onChange={
                        canEditNumber
                          ? (e) => {
                              const val = e.target.value.replace(/[^0-9]/g, "");
                              setValue("number", val, {
                                shouldValidate: false,
                              });
                              if (numberDuplicateError)
                                setNumberDuplicateError(null);
                              // Vérifier la continuité de la séquence à la volée
                              const seq = val
                                ? validateInvoiceNumber(val)
                                : { isValid: true };
                              setNumberSequenceError(
                                seq.isValid ? null : seq.message,
                              );
                            }
                          : () => {}
                      }
                      onBlur={
                        canEditNumber
                          ? async (e) => {
                              if (
                                validateInvoiceNumberExists &&
                                e.target.value
                              ) {
                                const result =
                                  await validateInvoiceNumberExists(
                                    e.target.value,
                                    data.prefix,
                                  );
                                if (result?.exists) {
                                  setNumberDuplicateError(
                                    `Le numéro ${data.prefix}${e.target.value} existe déjà.`,
                                  );
                                } else {
                                  setNumberDuplicateError(null);
                                }
                              }
                            }
                          : undefined
                      }
                      className={
                        canEditNumber
                          ? numberDuplicateError || numberSequenceError
                            ? "border-destructive focus-visible:ring-1 focus-visible:ring-destructive"
                            : ""
                          : "bg-muted/50 cursor-not-allowed select-none"
                      }
                    />
                    {(numberDuplicateError || numberSequenceError) && (
                      <p className="text-xs text-destructive">
                        {numberDuplicateError || numberSequenceError}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {autoNumbering
                        ? "Numéro attribué automatiquement — séquence continue indépendante du préfixe."
                        : hasDocumentsForPrefix
                          ? "Numérotation par préfixe — le numéro doit suivre la séquence (sans saut)."
                          : "Nouveau préfixe — vous pouvez choisir le numéro de départ."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Note explicative sur la numérotation */}
              <div className="mt-4 p-3 rounded-xl border bg-[#F5F5F5] dark:bg-neutral-900">
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

          {/* Coordonnées bancaires */}
          <Card className="shadow-none border-none bg-transparent p-0">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-2 font-medium text-lg">
                Coordonnées bancaires
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
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
                      className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
                <div className="text-sm text-muted-foreground p-3 rounded-xl border bg-[#F5F5F5] dark:bg-neutral-900">
                  <p className="mb-2">
                    Aucune coordonnée bancaire n'est configurée pour votre
                    entreprise.
                  </p>
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto font-medium flex items-center gap-1 underline"
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
                  <div className="space-y-4 p-4 rounded-xl border bg-[#F5F5F5] dark:bg-neutral-900">
                    {/* Nom de la banque */}
                    <div>
                      <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">
                        Nom de la banque
                      </Label>
                      <div className="mt-2 p-2 bg-white rounded-md border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                        <p className="text-sm">
                          {data.bankDetails?.bankName || "Non spécifié"}
                        </p>
                      </div>
                    </div>

                    {/* IBAN */}
                    <div>
                      <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">
                        IBAN
                      </Label>
                      <div className="mt-2 p-2 bg-white rounded-md border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                        <p className="text-sm font-mono">
                          {formatIban(data.bankDetails?.iban) || "Non spécifié"}
                        </p>
                      </div>
                    </div>

                    {/* BIC/SWIFT */}
                    <div>
                      <Label className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55">
                        BIC/SWIFT
                      </Label>
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

                    {/* Choix du nom du bénéficiaire pour les auto-entrepreneurs */}
                    {["EI", "Auto-entrepreneur"].includes(
                      organization?.legalForm,
                    ) && (
                      <div className="flex items-center justify-between p-4 bg-white rounded-md border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                        <div className="grid gap-1.5 leading-none">
                          <Label
                            htmlFor="beneficiary-name-type"
                            className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55"
                          >
                            Nom du bénéficiaire
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {data.beneficiaryNameType === "fullName"
                              ? "Nom complet affiché sur la facture"
                              : "Nom d'entreprise affiché sur la facture"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {data.beneficiaryNameType === "fullName"
                              ? "Nom complet"
                              : "Nom d'entreprise"}
                          </span>
                          <Switch
                            id="beneficiary-name-type"
                            checked={data.beneficiaryNameType === "fullName"}
                            onCheckedChange={(checked) => {
                              setValue(
                                "beneficiaryNameType",
                                checked ? "fullName" : "companyName",
                                { shouldDirty: true },
                              );
                            }}
                            disabled={!canEdit}
                          />
                        </div>
                      </div>
                    )}

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

          {/* Section Apparence */}
          <Card className="shadow-none border-none bg-transparent p-0">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-2 font-medium text-lg">
                Apparence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              {/* Couleurs côte à côte */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Couleur du texte */}
                <div className="space-y-2">
                  <Label
                    htmlFor="text-color"
                    className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55"
                  >
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
                  <Label
                    htmlFor="header-text-color"
                    className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55"
                  >
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
                <Label
                  htmlFor="header-bg-color"
                  className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55"
                >
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

          {/* Position du client */}
          <Card className="shadow-none border-none bg-transparent p-0">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-2 font-medium text-lg">
                Position du client dans le PDF
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <p className="text-sm text-muted-foreground">
                Choisissez où afficher les informations du client dans vos
                factures
              </p>
              <div className="flex gap-3">
                {/* Option Centre — preview wireframe avec bloc client centré */}
                <button
                  type="button"
                  onClick={() =>
                    setValue("clientPositionRight", false, {
                      shouldDirty: true,
                    })
                  }
                  disabled={!canEdit}
                  className={`group ${!canEdit ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div
                    className={`w-[110px] overflow-hidden rounded-md border shadow-xs transition-[color,box-shadow] ${
                      !data.clientPositionRight
                        ? "border-ring bg-accent"
                        : "border-input"
                    }`}
                  >
                    <ClientPositionPreview position="center" />
                  </div>
                  <span
                    className={`mt-2 flex items-center gap-1 ${
                      !data.clientPositionRight
                        ? ""
                        : "text-muted-foreground/70"
                    }`}
                  >
                    {!data.clientPositionRight ? (
                      <Check size={16} aria-hidden="true" />
                    ) : (
                      <Minus size={16} aria-hidden="true" />
                    )}
                    <span className="text-xs font-medium">Au centre</span>
                  </span>
                </button>

                {/* Option Droite — preview wireframe avec bloc client à droite */}
                <button
                  type="button"
                  onClick={() =>
                    setValue("clientPositionRight", true, { shouldDirty: true })
                  }
                  disabled={!canEdit}
                  className={`group ${!canEdit ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div
                    className={`w-[110px] overflow-hidden rounded-md border shadow-xs transition-[color,box-shadow] ${
                      data.clientPositionRight
                        ? "border-ring bg-accent"
                        : "border-input"
                    }`}
                  >
                    <ClientPositionPreview position="right" />
                  </div>
                  <span
                    className={`mt-2 flex items-center gap-1 ${
                      data.clientPositionRight ? "" : "text-muted-foreground/70"
                    }`}
                  >
                    {data.clientPositionRight ? (
                      <Check size={16} aria-hidden="true" />
                    ) : (
                      <Minus size={16} aria-hidden="true" />
                    )}
                    <span className="text-xs font-medium">À droite</span>
                  </span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Notes et bas de page */}
          <Card className="shadow-none border-none bg-transparent p-0">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-2 font-medium text-lg">
                Notes et bas de page
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              {/* Notes d'en-tête */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label
                    htmlFor="header-notes"
                    className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55"
                  >
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

              {/* Conditions générales */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label
                    htmlFor="terms-conditions"
                    className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55"
                  >
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
                  <TextareaNew
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
              {/* Notes de bas de page */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label
                    htmlFor="footer-notes"
                    className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55"
                  >
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

      {/* Dialog de confirmation : activation de la séquence continue */}
      <AlertDialog
        open={showAutoNumberingConfirm}
        onOpenChange={setShowAutoNumberingConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Activer la numérotation séquentielle continue ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Des factures ont déjà été créées avec une numérotation par
              préfixe. En activant la séquence continue, les numéros existants
              restent inchangés, mais toutes les nouvelles factures suivront une
              séquence unique, indépendante du préfixe. La numérotation doit
              rester chronologique : cette action est irréversible pour les
              documents déjà émis.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAutoNumberingConfirm(false)}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setValue("autoNumbering", true, { shouldValidate: false });
                setShowAutoNumberingConfirm(false);
              }}
            >
              Activer la séquence continue
            </Button>
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

// Mini wireframe placeholder pour visualiser la position du bloc client
function ClientPositionPreview({ position }) {
  const isCenter = position === "center";
  // Bloc client (4 lignes placeholder)
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
      {/* Header : expéditeur (gauche) + titre (droite) */}
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

      {/* Bloc client — centré OU à droite */}
      <div
        className={`mt-0.5 flex ${isCenter ? "justify-center" : "justify-end"}`}
      >
        {ClientBlock}
      </div>

      {/* Espace flexible + lignes articles */}
      <div className="flex-1" />
      <div className="space-y-[2px]">
        <div className="h-[2px] w-full rounded-full bg-neutral-200" />
        <div className="h-[2px] w-full rounded-full bg-neutral-200" />
        <div className="h-[2px] w-full rounded-full bg-neutral-200" />
      </div>
    </div>
  );
}
