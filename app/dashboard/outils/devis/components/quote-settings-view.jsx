"use client";

import React, { useState, useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import {
  AlignLeft,
  AlignRight,
  Check,
  Info,
  Tag,
  Settings,
} from "lucide-react";
import { documentSuggestions } from "@/src/utils/document-suggestions";
import { SuggestionDropdown } from "@/src/components/ui/suggestion-dropdown";
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
import {
  generateQuotePrefix,
  generatePurchaseOrderPrefix,
  getCurrentMonthYear,
  validateQuoteNumber,
  formatQuoteNumber,
} from "@/src/utils/quoteUtils";
import { useQuoteNumber } from "../hooks/use-quote-number";
import { usePurchaseOrderNumber } from "@/app/dashboard/outils/bons-commande/hooks/use-purchase-order-number";
import { Separator } from "@/src/components/ui/separator";
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
import { Checkbox } from "@/src/components/ui/checkbox";
import { Switch } from "@/src/components/ui/switch";
import { BankDetailsDialog } from "@/src/components/bank-details-dialog";
import CompanyInfoSettingsSection from "@/src/components/settings/company-info-settings-section";

// Fonction de formatage de l'IBAN avec espaces
const formatIban = (iban) => {
  if (!iban) return "";
  const cleanIban = iban.replace(/\s/g, "").toUpperCase();
  return cleanIban.replace(/(.{4})/g, "$1 ").trim();
};

export default function QuoteSettingsView({
  canEdit,
  onCancel,
  onSave,
  onCloseAttempt,
  documentType = "quote",
  validateNumberExists,
  saveLabel = "Enregistrer les modifications",
  organization,
}) {
  const isPurchaseOrder = documentType === "purchaseOrder";
  const documentLabel = isPurchaseOrder ? "bon de commande" : "devis";
  const documentLabelPlural = isPurchaseOrder ? "bons de commande" : "devis";
  const {
    watch,
    setValue,
    register,
    formState: { errors, dirtyFields },
  } = useFormContext();
  const data = watch();

  // Hooks pour la numérotation séquentielle (filtrés par préfixe courant)
  const autoNumbering = data.autoNumbering || false;

  // Deux hooks par type : per-prefix (toujours actif) et global (quand autoNumbering)
  const quotePerPrefixHook = useQuoteNumber(
    isPurchaseOrder ? undefined : data.prefix,
    { autoNumbering: false },
  );
  const quoteGlobalHook = useQuoteNumber(
    isPurchaseOrder ? undefined : data.prefix,
    { autoNumbering: true },
  );
  const poPerPrefixHook = usePurchaseOrderNumber(
    isPurchaseOrder ? data.prefix : undefined,
    { autoNumbering: false },
  );
  const poGlobalHook = usePurchaseOrderNumber(
    isPurchaseOrder ? data.prefix : undefined,
    { autoNumbering: true },
  );

  // Sélectionner le bon hook selon le mode
  const perPrefixHook = isPurchaseOrder ? poPerPrefixHook : quotePerPrefixHook;
  const numberHook = autoNumbering
    ? isPurchaseOrder
      ? poGlobalHook
      : quoteGlobalHook
    : perPrefixHook;
  const nextNumber = isPurchaseOrder
    ? numberHook.nextNumber
    : numberHook.nextQuoteNumber;
  const isLoadingNumber = numberHook.isLoading;
  // Champ numéro éditable uniquement si aucun document finalisé n'existe pour ce préfixe
  // En mode autoNumbering, le numéro est toujours verrouillé
  const isFirstDocument = autoNumbering
    ? false
    : !perPrefixHook.hasDocumentsForPrefix;

  // Auto-initialiser le préfixe si vide (au montage uniquement)
  useEffect(() => {
    if (!data.prefix) {
      const defaultPrefix = isPurchaseOrder
        ? generatePurchaseOrderPrefix()
        : generateQuotePrefix();
      setValue("prefix", defaultPrefix, { shouldValidate: false });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Synchroniser le numéro depuis le hook de numérotation
  useEffect(() => {
    if (isLoadingNumber || nextNumber == null) return;
    const formattedNumber = String(nextNumber).padStart(4, "0");

    if (autoNumbering || perPrefixHook.hasDocumentsForPrefix) {
      // Auto-numbering activé ou préfixe existant → forcer le numéro séquentiel
      setValue("number", formattedNumber, { shouldValidate: false });
    } else if (!data.number) {
      // Nouveau préfixe, pas de numéro → proposer 0001
      setValue("number", formattedNumber, { shouldValidate: false });
    }
  }, [
    nextNumber,
    isLoadingNumber,
    perPrefixHook.hasDocumentsForPrefix,
    autoNumbering,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle prefix changes with auto-fill for MM and AAAA
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
  const [numberDuplicateError, setNumberDuplicateError] = useState(null);
  const initialValuesRef = useRef(null);

  // Écouter l'événement personnalisé émis par BankDetailsDialog
  useEffect(() => {
    const handleOrganizationUpdated = (event) => {
      const { bankName, bankIban, bankBic } = event.detail;

      if (bankIban || bankBic || bankName) {
        setValue("bankDetails.iban", bankIban || "", { shouldDirty: true });
        setValue("bankDetails.bic", bankBic || "", { shouldDirty: true });
        setValue("bankDetails.bankName", bankName || "", { shouldDirty: true });

        // Mettre à jour userBankDetails pour que la checkbox soit visible
        setValue("userBankDetails", {
          iban: bankIban || "",
          bic: bankBic || "",
          bankName: bankName || "",
        });

        // Cocher automatiquement la checkbox
        setValue("showBankDetails", true, { shouldDirty: true });
      }
    };

    window.addEventListener("organizationUpdated", handleOrganizationUpdated);
    return () => {
      window.removeEventListener(
        "organizationUpdated",
        handleOrganizationUpdated,
      );
    };
  }, [setValue]);

  // Import automatique des coordonnées bancaires lors du chargement initial
  useEffect(() => {
    if (
      data.showBankDetails &&
      !data.bankDetails?.iban &&
      !data.bankDetails?.bic &&
      !data.bankDetails?.bankName
    ) {
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
        clientPositionRight: data.clientPositionRight,
        showBankDetails: data.showBankDetails,
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
      data.clientPositionRight !==
        initialValuesRef.current.clientPositionRight ||
      data.showBankDetails !== initialValuesRef.current.showBankDetails;

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
        "clientPositionRight",
        initialValuesRef.current.clientPositionRight || false,
      );
      setValue(
        "showBankDetails",
        initialValuesRef.current.showBankDetails || false,
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
      clientPositionRight: data.clientPositionRight,
      showBankDetails: data.showBankDetails,
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
              <CardTitle className="flex items-center gap-2 font-medium text-lg">
                Numérotation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              {/* Toggle numérotation automatique */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-muted">
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
                  onCheckedChange={(checked) => {
                    setValue("autoNumbering", checked, {
                      shouldValidate: false,
                    });
                  }}
                  className="data-[state=checked]:bg-[#5b4fff]"
                />
              </div>

              {/* Préfixe et numéro */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="quote-prefix"
                      className="text-sm font-light"
                    >
                      Préfixe de {documentLabel}
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
                          Préfixe personnalisable pour identifier vos{" "}
                          {documentLabelPlural}. Tapez{" "}
                          <span className="font-mono">MM</span> pour insérer le
                          mois actuel ou <span className="font-mono">AAAA</span>{" "}
                          pour l'année.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="space-y-1">
                    <Input
                      id="quote-prefix"
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
                      onFocus={(e) => {
                        if (!e.target.value) {
                          const { month, year } = getCurrentMonthYear();
                          e.target.placeholder = isPurchaseOrder
                            ? `BC-${month}${year}`
                            : `D-${month}${year}`;
                        }
                      }}
                      onBlur={() => {}}
                      placeholder={isPurchaseOrder ? "BC-MMAAAA" : "D-MMAAAA"}
                      disabled={!canEdit}
                    />
                    {errors?.prefix && (
                      <p className="text-xs text-red-500">
                        {errors.prefix.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="quote-number"
                      className="text-sm font-light"
                    >
                      Numéro de {documentLabel}
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
                          Numéro unique et séquentiel de votre {documentLabel}.
                          Il sera automatiquement formaté avec des zéros (ex:
                          000001).
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="space-y-1">
                    <Input
                      id="quote-number"
                      value={data.number || ""}
                      disabled={!isFirstDocument}
                      readOnly={!isFirstDocument}
                      tabIndex={isFirstDocument ? 0 : -1}
                      onFocus={
                        isFirstDocument ? undefined : (e) => e.target.blur()
                      }
                      onChange={
                        isFirstDocument
                          ? (e) => {
                              const val = e.target.value.replace(/[^0-9]/g, "");
                              setValue("number", val, {
                                shouldValidate: false,
                              });
                              if (numberDuplicateError)
                                setNumberDuplicateError(null);
                            }
                          : () => {}
                      }
                      onBlur={
                        isFirstDocument
                          ? async (e) => {
                              if (validateNumberExists && e.target.value) {
                                const result = await validateNumberExists(
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
                        isFirstDocument
                          ? numberDuplicateError
                            ? "border-destructive focus-visible:ring-1 focus-visible:ring-destructive"
                            : ""
                          : "bg-muted/50 cursor-not-allowed select-none"
                      }
                    />
                    {numberDuplicateError && (
                      <p className="text-xs text-destructive">
                        {numberDuplicateError}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {autoNumbering
                        ? "Numéro attribué automatiquement — séquence continue indépendante du préfixe."
                        : isFirstDocument
                          ? `Premier ${documentLabel} — vous pouvez choisir le numéro de départ.`
                          : "Numéro attribué automatiquement de manière séquentielle."}
                    </p>
                    {data.number && data.number.startsWith("DRAFT-") && (
                      <p className="text-xs text-blue-600">
                        Numéro de brouillon - sera remplacé lors de la
                        validation
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Note explicative sur la numérotation */}
              <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-muted">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-medium">Note :</span> La numérotation
                  des {documentLabelPlural} doit être séquentielle et continue
                  pour respecter les obligations légales françaises. Le préfixe
                  vous permet d'organiser vos {documentLabelPlural} par période
                  (ex: {isPurchaseOrder ? "BC" : "D"}-122025 pour décembre
                  2025). Le système vérifie automatiquement qu'il n'y a pas de
                  saut dans la numérotation.
                </p>
              </div>
            </CardContent>
          </Card>
          <Separator />

          {/* Coordonnées bancaires */}
          <Card className="shadow-none border-none bg-transparent">
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
                      className="text-sm font-light leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Afficher les coordonnées bancaires
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Cochez pour inclure vos coordonnées bancaires sur le{" "}
                      {documentLabel}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-md">
                  <p className="mb-2">
                    Aucune coordonnée bancaire n&apos;est configurée pour votre
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

                    {/* TODO: Choix du nom du bénéficiaire pour les auto-entrepreneurs — désactivé pour devis/bons de commande, à réactiver si besoin */}
                    {/* {organization?.legalForm === "Auto-entrepreneur" && (
                      <div className="flex items-center justify-between p-4 bg-white rounded-md border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                        <div className="grid gap-1.5 leading-none">
                          <Label
                            htmlFor="beneficiary-name-type"
                            className="text-sm font-light leading-none"
                          >
                            Nom du bénéficiaire
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {data.beneficiaryNameType === "fullName"
                              ? "Nom complet affiché sur le document"
                              : "Nom d'entreprise affiché sur le document"}
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
                                { shouldDirty: true }
                              );
                            }}
                            disabled={!canEdit}
                          />
                        </div>
                      </div>
                    )} */}

                    <Alert>
                      <AlertDescription>
                        Ces coordonnées bancaires apparaîtront sur votre{" "}
                        {documentLabel} pour faciliter les paiements de vos
                        clients.
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
              <CardTitle className="flex items-center gap-2 font-medium text-lg">
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

          {/* Position du client */}
          <Card className="shadow-none border-none bg-transparent">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-2 font-medium text-lg">
                Position du client dans le PDF
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <p className="text-sm text-muted-foreground">
                Choisissez où afficher les informations du client dans vos{" "}
                {documentLabelPlural}
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
                    relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
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
                    relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
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
              <CardTitle className="flex items-center gap-2 font-medium text-lg">
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
                    placeholder={`Notes qui apparaîtront en haut du ${documentLabel}...`}
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
                    placeholder={`Notes qui apparaîtront en bas du ${documentLabel}...`}
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
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de configuration des coordonnées bancaires */}
      <BankDetailsDialog
        open={showBankDetailsDialog}
        onOpenChange={setShowBankDetailsDialog}
        organization={organization}
        onSuccess={() => {}}
      />

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
    </div>
  );
}
