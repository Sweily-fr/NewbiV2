"use client";

import React, { useEffect, useState } from "react";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Separator } from "@/src/components/ui/separator";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { useFormContext } from "react-hook-form";
import {
  sanitizeInput,
  VALIDATION_PATTERNS,
  detectInjectionAttempt,
} from "@/src/lib/validation";
import { Callout } from "@/src/components/ui/callout";

// Fonction de formatage de l'IBAN avec espaces (pour l'affichage)
const formatIban = (iban) => {
  if (!iban) return "";

  // Supprimer tous les espaces existants et convertir en majuscules
  const cleanIban = iban.replace(/\s/g, "").toUpperCase();

  // Ajouter un espace tous les 4 caractères
  return cleanIban.replace(/(.{4})/g, "$1 ").trim();
};

// Fonction pour nettoyer l'IBAN (pour l'enregistrement en BDD)
const cleanIban = (iban) => {
  if (!iban) return "";

  // Supprimer tous les espaces et convertir en majuscules
  return iban.replace(/\s/g, "").toUpperCase();
};

export function CoordonneesBancairesSection({
  session,
  organization,
  updateOrganization,
  refetchOrganization,
  canManageOrgSettings = true,
}) {
  // État local pour l'affichage formaté de l'IBAN
  const [displayIban, setDisplayIban] = useState("");

  // Utiliser le contexte du formulaire global
  const {
    register,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext();

  // Surveiller les valeurs du formulaire
  const watchedValues = watch();
  const ibanValue = watch("bankDetails.iban") || "";
  const bicValue = watch("bankDetails.bic") || "";
  const bankNameValue = watch("bankDetails.bankName") || "";

  const hasIban = ibanValue.trim() !== "";
  const hasBic = bicValue.trim() !== "";
  const hasBankName = bankNameValue.trim() !== "";
  const hasAnyBankField = hasIban || hasBic || hasBankName;

  // Synchroniser l'affichage avec la valeur du formulaire au chargement
  useEffect(() => {
    const currentIban = getValues("bankDetails.iban");
    if (currentIban && currentIban.trim() !== "") {
      setDisplayIban(formatIban(currentIban));
    }
  }, [getValues]);

  // Synchroniser quand la valeur change depuis l'extérieur (reset du formulaire)
  useEffect(() => {
    // Seulement lors du reset du formulaire ou chargement initial
    if (ibanValue && !displayIban) {
      setDisplayIban(formatIban(ibanValue));
    }
  }, [ibanValue, displayIban]);

  // Fonction utilitaire pour traiter l'IBAN (saisie ou collage)
  const handleIbanInput = (inputValue) => {
    const sanitized = sanitizeInput(inputValue, "alphanumeric");
    const formattedForDisplay = formatIban(sanitized);
    const cleanedForStorage = cleanIban(sanitized);

    // Mettre à jour l'affichage local
    setDisplayIban(formattedForDisplay);

    // Enregistrer la version nettoyée dans le formulaire (pour la BDD)
    setValue("bankDetails.iban", cleanedForStorage, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <div className="space-y-8">
      {/* Titre */}
      <div>
        <h2 className="text-lg font-medium mb-1 hidden md:block">Coordonnées bancaires</h2>
        <Separator className="hidden md:block bg-[#eeeff1] dark:bg-[#232323]" />
        {!canManageOrgSettings && (
          <div className="mt-4">
            <Callout type="warning" noMargin>
              <p>
                Vous n'avez pas la permission de modifier les paramètres de
                l'organisation. Seuls les <strong>owners</strong> et{" "}
                <strong>admins</strong> peuvent effectuer ces modifications.
              </p>
            </Callout>
          </div>
        )}

        {/* Formulaire des coordonnées bancaires */}
        <div className="space-y-6 mt-4 md:mt-12">
          {/* IBAN */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label
                htmlFor="iban"
                className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55"
              >
                IBAN {hasAnyBankField && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[280px] sm:max-w-xs">
                  <p>Format international (ex: FR76 1234 5678 9012 3456 7890 123)</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="iban"
              placeholder="FR76 1234 5678 9012 3456 7890 123"
              className="w-full"
              disabled={!canManageOrgSettings}
              value={displayIban}
              onChange={(e) => {
                handleIbanInput(e.target.value);
              }}
              onPaste={(e) => {
                // Empêcher le comportement par défaut du paste
                e.preventDefault();

                // Récupérer le texte collé et le traiter
                const pastedText = e.clipboardData.getData("text");
                handleIbanInput(pastedText);
              }}
            />
            {/* Champ caché pour la validation React Hook Form */}
            <input
              type="hidden"
              {...register("bankDetails.iban", {
                required: hasAnyBankField
                  ? "L'IBAN est requis si vous renseignez des coordonnées bancaires"
                  : false,
                pattern: {
                  value: VALIDATION_PATTERNS.iban.pattern,
                  message: VALIDATION_PATTERNS.iban.message,
                },
                validate: (value) => {
                  if (value && detectInjectionAttempt(value)) {
                    return "Caractères non autorisés détectés";
                  }
                  return true;
                },
              })}
            />
            {errors.bankDetails?.iban && (
              <p className="text-sm text-red-500">
                {errors.bankDetails.iban.message}
              </p>
            )}
          </div>

          {/* BIC */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label
                htmlFor="bic"
                className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55"
              >
                BIC/SWIFT {hasAnyBankField && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[280px] sm:max-w-xs">
                  <p>Code d'identification de votre banque (8 ou 11 caractères)</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="bic"
              placeholder="BNPAFRPP"
              className="w-full"
              disabled={!canManageOrgSettings}
              {...register("bankDetails.bic", {
                required: hasAnyBankField
                  ? "Le BIC est requis si vous renseignez des coordonnées bancaires"
                  : false,
                pattern: {
                  value: VALIDATION_PATTERNS.bic.pattern,
                  message: VALIDATION_PATTERNS.bic.message,
                },
                validate: (value) => {
                  if (value && detectInjectionAttempt(value)) {
                    return "Caractères non autorisés détectés";
                  }
                  return true;
                },
              })}
              onChange={(e) => {
                const sanitized = sanitizeInput(e.target.value, "alphanumeric");
                e.target.value = sanitized.toUpperCase();
              }}
            />
            {errors.bankDetails?.bic && (
              <p className="text-sm text-red-500">
                {errors.bankDetails.bic.message}
              </p>
            )}
          </div>

          {/* Nom de la banque */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label
                htmlFor="bankName"
                className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55"
              >
                Nom de la banque {hasAnyBankField && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[280px] sm:max-w-xs">
                  <p>Nom de votre établissement bancaire</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="bankName"
              placeholder="BNP Paribas"
              className="w-full"
              disabled={!canManageOrgSettings}
              {...register("bankDetails.bankName", {
                required: hasAnyBankField
                  ? "Le nom de la banque est requis si vous renseignez des coordonnées bancaires"
                  : false,
                pattern: {
                  value: VALIDATION_PATTERNS.bankName.pattern,
                  message: VALIDATION_PATTERNS.bankName.message,
                },
                validate: (value) => {
                  if (value && detectInjectionAttempt(value)) {
                    return "Caractères non autorisés détectés";
                  }
                  return true;
                },
              })}
              onChange={(e) => {
                const sanitized = sanitizeInput(e.target.value);
                e.target.value = sanitized;
              }}
            />
            {errors.bankDetails?.bankName && (
              <p className="text-sm text-red-500">
                {errors.bankDetails.bankName.message}
              </p>
            )}
          </div>

          <Separator className="bg-[#eeeff1] dark:bg-[#232323]" />

          {/* Information de sécurité */}
          <Callout type="neutral" noMargin>
            <p>
              <span className="font-medium">
                Sécurité des données bancaires
              </span>
              <br />
              Vos informations bancaires sont chiffrées et stockées de manière
              sécurisée. Elles ne seront utilisées que pour les virements et
              facturations.
            </p>
          </Callout>
        </div>
      </div>
    </div>
  );
}

export default CoordonneesBancairesSection;
