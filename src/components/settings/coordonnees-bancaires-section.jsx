"use client";

import React, { useEffect, useState } from "react";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Separator } from "@/src/components/ui/separator";
import { CreditCard, Building2, Hash, Info, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/src/components/ui/alert";
import { useFormContext } from "react-hook-form";
import {
  VALIDATION_PATTERNS,
  sanitizeInput,
  detectInjectionAttempt,
} from "@/src/lib/validation";

// Fonction de formatage de l'IBAN avec espaces (pour l'affichage)
const formatIban = (iban) => {
  if (!iban) return "";
  
  // Supprimer tous les espaces existants et convertir en majuscules
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();
  
  // Ajouter un espace tous les 4 caractères
  return cleanIban.replace(/(.{4})/g, '$1 ').trim();
};

// Fonction pour nettoyer l'IBAN (pour l'enregistrement en BDD)
const cleanIban = (iban) => {
  if (!iban) return "";
  
  // Supprimer tous les espaces et convertir en majuscules
  return iban.replace(/\s/g, '').toUpperCase();
};

export function CoordonneesBancairesSection({
  session,
  organization,
  updateOrganization,
  refetchOrganization,
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
      shouldValidate: true 
    });
  };

  return (
    <div className="space-y-8">
      {/* Titre */}
      <div>
        <h2 className="text-lg font-medium mb-1">Coordonnées bancaires</h2>
        <Separator />

        {/* Information sur la validation conditionnelle */}
        <div className="mb-8 mt-12">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <span className="font-medium">
                Coordonnées bancaires optionnelles
              </span>
              <br />
              Vous pouvez laisser tous les champs vides. Si vous renseignez une
              information bancaire, les trois champs (IBAN, BIC et nom de
              banque) deviennent obligatoires.
            </AlertDescription>
          </Alert>
        </div>

        <Separator />

        {/* Formulaire des coordonnées bancaires */}
        <div className="space-y-6 mt-8">
          {/* IBAN */}
          <div className="space-y-2">
            <Label
              htmlFor="iban"
              className="flex items-center gap-2 text-sm font-normal"
            >
              <Hash className="h-4 w-4 text-gray-500" />
              IBAN {hasAnyBankField && "*"}
            </Label>
            <Input
              id="iban"
              placeholder="FR76 1234 5678 9012 3456 7890 123"
              className="w-full"
              value={displayIban}
              onChange={(e) => {
                handleIbanInput(e.target.value);
              }}
              onPaste={(e) => {
                // Empêcher le comportement par défaut du paste
                e.preventDefault();
                
                // Récupérer le texte collé et le traiter
                const pastedText = e.clipboardData.getData('text');
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
            <p className="text-xs text-gray-600">
              Format international (ex: FR76 1234 5678 9012 3456 7890 123)
            </p>
          </div>

          {/* BIC */}
          <div className="space-y-2">
            <Label
              htmlFor="bic"
              className="flex items-center gap-2 text-sm font-normal"
            >
              <Building2 className="h-4 w-4 text-gray-500" />
              BIC/SWIFT {hasAnyBankField && "*"}
            </Label>
            <Input
              id="bic"
              placeholder="BNPAFRPP"
              className="w-full"
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
            <p className="text-xs text-gray-600">
              Code d'identification de votre banque (8 ou 11 caractères)
            </p>
          </div>

          {/* Nom de la banque */}
          <div className="space-y-2">
            <Label
              htmlFor="bankName"
              className="flex items-center gap-2 text-sm font-normal"
            >
              <CreditCard className="h-4 w-4 text-gray-500" />
              Nom de la banque {hasAnyBankField && "*"}
            </Label>
            <Input
              id="bankName"
              placeholder="BNP Paribas"
              className="w-full"
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
            <p className="text-xs text-gray-600">
              Nom de votre établissement bancaire
            </p>
          </div>

          <Separator />

          {/* Information de sécurité */}
          <Alert>
            <Shield className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <span className="font-medium">
                Sécurité des données bancaires
              </span>
              <br />
              Vos informations bancaires sont chiffrées et stockées de manière
              sécurisée. Elles ne seront utilisées que pour les virements et
              facturations.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}

export default CoordonneesBancairesSection;
