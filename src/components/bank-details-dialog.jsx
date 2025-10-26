"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Alert, AlertDescription } from "@/src/components/ui/alert";
import { Shield, Hash, Building2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { updateOrganization } from "@/src/lib/organization-client";
import {
  VALIDATION_PATTERNS,
  sanitizeInput,
  detectInjectionAttempt,
} from "@/src/lib/validation";

// Fonction de formatage de l'IBAN avec espaces (pour l'affichage)
const formatIban = (iban) => {
  if (!iban) return "";
  const cleanIban = iban.replace(/\s/g, "").toUpperCase();
  return cleanIban.replace(/(.{4})/g, "$1 ").trim();
};

// Fonction pour nettoyer l'IBAN (pour l'enregistrement en BDD)
const cleanIban = (iban) => {
  if (!iban) return "";
  return iban.replace(/\s/g, "").toUpperCase();
};

export function BankDetailsDialog({
  open,
  onOpenChange,
  organization,
  onSuccess,
}) {
  const [displayIban, setDisplayIban] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      bankName: organization?.bankName || "",
      iban: organization?.bankIban || "",
      bic: organization?.bankBic || "",
    },
  });

  const ibanValue = watch("iban") || "";
  const bicValue = watch("bic") || "";
  const bankNameValue = watch("bankName") || "";

  const hasIban = ibanValue.trim() !== "";
  const hasBic = bicValue.trim() !== "";
  const hasBankName = bankNameValue.trim() !== "";
  const hasAnyBankField = hasIban || hasBic || hasBankName;

  // Synchroniser l'affichage avec la valeur du formulaire
  useEffect(() => {
    if (ibanValue && ibanValue.trim() !== "") {
      setDisplayIban(formatIban(ibanValue));
    }
  }, [ibanValue]);

  // Réinitialiser le formulaire quand le dialog s'ouvre
  useEffect(() => {
    if (open && organization) {
      reset({
        bankName: organization.bankName || "",
        iban: organization.bankIban || "",
        bic: organization.bankBic || "",
      });
      setDisplayIban(formatIban(organization.bankIban || ""));
    }
  }, [open, organization, reset]);

  // Fonction utilitaire pour traiter l'IBAN (saisie ou collage)
  const handleIbanInput = (inputValue) => {
    const sanitized = sanitizeInput(inputValue, "alphanumeric");
    const formattedForDisplay = formatIban(sanitized);
    const cleanedForStorage = cleanIban(sanitized);

    setDisplayIban(formattedForDisplay);
    setValue("iban", cleanedForStorage, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const onSubmit = async (formData) => {
    try {
      setIsLoading(true);

      if (!organization?.id) {
        toast.error("Aucune organisation active trouvée");
        return;
      }

      // Validation : si au moins un champ est rempli, tous les 3 doivent l'être
      if (hasAnyBankField) {
        const errors = [];

        if (!formData.iban || formData.iban.trim() === "") {
          errors.push("L'IBAN est requis");
        }
        if (!formData.bic || formData.bic.trim() === "") {
          errors.push("Le BIC est requis");
        }
        if (!formData.bankName || formData.bankName.trim() === "") {
          errors.push("Le nom de la banque est requis");
        }

        if (errors.length > 0) {
          toast.error(errors.join(", "));
          return;
        }

        // Validation des formats
        if (!VALIDATION_PATTERNS.iban.pattern.test(formData.iban.replace(/\s/g, ""))) {
          toast.error("Format IBAN invalide");
          return;
        }

        if (!VALIDATION_PATTERNS.bic.pattern.test(formData.bic)) {
          toast.error("Format BIC invalide (8 ou 11 caractères alphanumériques)");
          return;
        }

        if (!VALIDATION_PATTERNS.bankName.pattern.test(formData.bankName)) {
          toast.error("Format du nom de banque invalide");
          return;
        }

        // Vérifier les injections
        if (
          detectInjectionAttempt(formData.iban) ||
          detectInjectionAttempt(formData.bic) ||
          detectInjectionAttempt(formData.bankName)
        ) {
          toast.error("Caractères non autorisés détectés");
          return;
        }
      }

      // Mettre à jour l'organisation
      await updateOrganization(
        {
          bankName: formData.bankName || "",
          bankIban: cleanIban(formData.iban || ""),
          bankBic: (formData.bic || "").toUpperCase(),
        },
        {
          onSuccess: () => {
            toast.success("Coordonnées bancaires mises à jour avec succès");
            onOpenChange(false);
            if (onSuccess) {
              onSuccess();
            }
          },
          onError: (error) => {
            console.error("Erreur lors de la mise à jour:", error);
            toast.error("Erreur lors de la mise à jour des coordonnées bancaires");
          },
        }
      );
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Coordonnées bancaires</DialogTitle>
          <DialogDescription>
            Configurez vos informations bancaires pour les afficher sur vos factures
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Information sur la validation conditionnelle */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <span className="font-medium">Coordonnées bancaires optionnelles</span>
              <br />
              Vous pouvez laisser tous les champs vides. Si vous renseignez une
              information bancaire, les trois champs (IBAN, BIC et nom de banque)
              deviennent obligatoires.
            </AlertDescription>
          </Alert>

          {/* IBAN */}
          <div className="space-y-2">
            <Label
              htmlFor="dialog-iban"
              className="flex items-center gap-2 text-sm font-normal"
            >
              <Hash className="h-4 w-4 text-gray-500" />
              IBAN {hasAnyBankField && "*"}
            </Label>
            <Input
              id="dialog-iban"
              placeholder="FR76 1234 5678 9012 3456 7890 123"
              className="w-full"
              value={displayIban}
              onChange={(e) => {
                handleIbanInput(e.target.value);
              }}
              onPaste={(e) => {
                e.preventDefault();
                const pastedText = e.clipboardData.getData("text");
                handleIbanInput(pastedText);
              }}
            />
            <input
              type="hidden"
              {...register("iban", {
                required: hasAnyBankField ? "L'IBAN est requis" : false,
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
            {errors.iban && (
              <p className="text-sm text-red-500">{errors.iban.message}</p>
            )}
            <p className="text-xs text-gray-600">
              Format international (ex: FR76 1234 5678 9012 3456 7890 123)
            </p>
          </div>

          {/* BIC */}
          <div className="space-y-2">
            <Label
              htmlFor="dialog-bic"
              className="flex items-center gap-2 text-sm font-normal"
            >
              <Building2 className="h-4 w-4 text-gray-500" />
              BIC/SWIFT {hasAnyBankField && "*"}
            </Label>
            <Input
              id="dialog-bic"
              placeholder="BNPAFRPP"
              className="w-full"
              {...register("bic", {
                required: hasAnyBankField ? "Le BIC est requis" : false,
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
            {errors.bic && (
              <p className="text-sm text-red-500">{errors.bic.message}</p>
            )}
            <p className="text-xs text-gray-600">
              Code d'identification de votre banque (8 ou 11 caractères)
            </p>
          </div>

          {/* Nom de la banque */}
          <div className="space-y-2">
            <Label
              htmlFor="dialog-bankName"
              className="flex items-center gap-2 text-sm font-normal"
            >
              <CreditCard className="h-4 w-4 text-gray-500" />
              Nom de la banque {hasAnyBankField && "*"}
            </Label>
            <Input
              id="dialog-bankName"
              placeholder="BNP Paribas"
              className="w-full"
              {...register("bankName", {
                required: hasAnyBankField ? "Le nom de la banque est requis" : false,
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
            {errors.bankName && (
              <p className="text-sm text-red-500">{errors.bankName.message}</p>
            )}
            <p className="text-xs text-gray-600">
              Nom de votre établissement bancaire
            </p>
          </div>

          {/* Alert sécurité */}
          <Alert>
            <Shield className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <span className="font-medium">Sécurité des données bancaires</span>
              <br />
              Vos informations bancaires sont chiffrées et stockées de manière
              sécurisée. Elles ne seront utilisées que pour les virements et
              facturations.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
