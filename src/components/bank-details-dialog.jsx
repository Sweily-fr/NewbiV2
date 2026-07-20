"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Switch } from "@/src/components/ui/switch";
import { LoaderCircle, CreditCard, CornerDownLeft } from "lucide-react";
import { toast } from "sonner";
import { updateOrganization } from "@/src/lib/organization-client";
import { useSession } from "@/src/lib/auth-client";
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
      beneficiaryNameType: organization?.beneficiaryNameType || "companyName",
    },
  });

  // Le nom du bénéficiaire ne concerne que les entrepreneurs individuels, dont
  // le compte est souvent au nom propre plutôt qu'au nom de l'entreprise.
  const showBeneficiaryChoice = ["EI", "Auto-entrepreneur"].includes(
    organization?.legalForm,
  );
  const beneficiaryNameType = watch("beneficiaryNameType");

  // Nom réellement imprimé sur les documents, affiché entre parenthèses pour
  // que le choix soit explicite. Même résolution que UniversalPreviewPDF.
  const { data: session } = useSession();
  const beneficiaryPreview =
    beneficiaryNameType === "fullName"
      ? session?.user?.name || ""
      : organization?.companyName || "";

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

  // Réinitialiser le formulaire à l'ouverture uniquement. La dépendance porte
  // sur `open` et non sur `organization` : si le parent recrée cet objet à
  // chaque rendu, l'effet effacerait la saisie en cours.
  const organizationRef = useRef(organization);
  organizationRef.current = organization;
  useEffect(() => {
    if (!open) return;
    const org = organizationRef.current;
    if (!org) return;
    reset({
      bankName: org.bankName || "",
      iban: org.bankIban || "",
      bic: org.bankBic || "",
      beneficiaryNameType: org.beneficiaryNameType || "companyName",
    });
    setDisplayIban(formatIban(org.bankIban || ""));
  }, [open, reset]);

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

        if (
          !VALIDATION_PATTERNS.iban.pattern.test(
            formData.iban.replace(/\s/g, ""),
          )
        ) {
          toast.error("Format IBAN invalide");
          return;
        }

        if (!VALIDATION_PATTERNS.bic.pattern.test(formData.bic)) {
          toast.error(
            "Format BIC invalide (8 ou 11 caractères alphanumériques)",
          );
          return;
        }

        if (!VALIDATION_PATTERNS.bankName.pattern.test(formData.bankName)) {
          toast.error("Format du nom de banque invalide");
          return;
        }

        if (
          detectInjectionAttempt(formData.iban) ||
          detectInjectionAttempt(formData.bic) ||
          detectInjectionAttempt(formData.bankName)
        ) {
          toast.error("Caractères non autorisés détectés");
          return;
        }
      }

      const cleanedIban = cleanIban(formData.iban || "");
      const cleanedBic = (formData.bic || "").toUpperCase();
      const nextBeneficiaryNameType = showBeneficiaryChoice
        ? formData.beneficiaryNameType || "companyName"
        : organization.beneficiaryNameType || "companyName";

      await updateOrganization(
        organization.id,
        {
          bankName: formData.bankName || "",
          bankIban: cleanedIban,
          bankBic: cleanedBic,
          beneficiaryNameType: nextBeneficiaryNameType,
        },
        {
          onSuccess: () => {
            toast.success("Coordonnées bancaires mises à jour avec succès");

            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("organizationUpdated", {
                  detail: {
                    organizationId: organization.id,
                    bankName: formData.bankName || "",
                    bankIban: cleanedIban,
                    bankBic: cleanedBic,
                    beneficiaryNameType: nextBeneficiaryNameType,
                  },
                }),
              );
            }

            if (onSuccess) {
              onSuccess();
            }
            onOpenChange(false);
          },
          onError: (error) => {
            console.error("Erreur lors de la mise à jour:", error);
            toast.error(
              "Erreur lors de la mise à jour des coordonnées bancaires",
            );
          },
        },
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
      <DialogContent className="sm:max-w-[720px] p-1 gap-0 top-[40%] border-0 bg-[#efefef] dark:bg-[#1a1a1a] overflow-hidden rounded-2xl">
        <div className="bg-background rounded-xl overflow-hidden ring-1 ring-black/[0.07] dark:ring-white/[0.1]">
          <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/40">
            <DialogTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="size-4" />
              Coordonnées bancaires
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-3 px-5 pt-3 pb-0">
              {/* IBAN */}
              <div className="space-y-2">
                <label
                  htmlFor="dialog-iban"
                  className="text-sm text-muted-foreground"
                >
                  IBAN {hasAnyBankField && "*"}
                </label>
                <Input
                  id="dialog-iban"
                  placeholder="FR76 1234 5678 9012 3456 7890 123"
                  className="w-full"
                  value={displayIban}
                  onChange={(e) => handleIbanInput(e.target.value)}
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
                  <p className="text-xs text-destructive">
                    {errors.iban.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Format international (ex: FR76 1234 5678 9012 3456 7890 123)
                </p>
              </div>

              {/* BIC */}
              <div className="space-y-2">
                <label
                  htmlFor="dialog-bic"
                  className="text-sm text-muted-foreground"
                >
                  BIC/SWIFT {hasAnyBankField && "*"}
                </label>
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
                    const sanitized = sanitizeInput(
                      e.target.value,
                      "alphanumeric",
                    ).toUpperCase();
                    e.target.value = sanitized;
                  }}
                />
                {errors.bic && (
                  <p className="text-xs text-destructive">
                    {errors.bic.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Code d'identification de votre banque (8 ou 11 caractères)
                </p>
              </div>

              {/* Nom de la banque */}
              <div className="space-y-2">
                <label
                  htmlFor="dialog-bankName"
                  className="text-sm text-muted-foreground"
                >
                  Nom de la banque {hasAnyBankField && "*"}
                </label>
                <Input
                  id="dialog-bankName"
                  placeholder="BNP Paribas"
                  className="w-full"
                  {...register("bankName", {
                    required: hasAnyBankField
                      ? "Le nom de la banque est requis"
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
                {errors.bankName && (
                  <p className="text-xs text-destructive">
                    {errors.bankName.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Nom de votre établissement bancaire
                </p>
              </div>

              {/* Nom du bénéficiaire — entrepreneurs individuels uniquement */}
              {showBeneficiaryChoice && (
                <div className="flex items-center justify-between gap-4 p-3 rounded-xl border bg-[#F5F5F5] dark:bg-neutral-900">
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="dialog-beneficiary-name-type"
                      className="text-sm font-medium"
                    >
                      Nom du bénéficiaire
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {beneficiaryNameType === "fullName"
                        ? "Nom complet affiché sur vos documents"
                        : "Nom d'entreprise affiché sur vos documents"}
                      {beneficiaryPreview ? ` (${beneficiaryPreview})` : ""}
                    </p>
                    {!beneficiaryPreview && (
                      <p className="text-xs text-destructive">
                        {beneficiaryNameType === "fullName"
                          ? "Aucun nom sur votre compte : la ligne sera vide sur vos documents."
                          : "Aucune dénomination sociale : la ligne sera vide sur vos documents."}
                      </p>
                    )}
                  </div>
                  <Switch
                    id="dialog-beneficiary-name-type"
                    checked={beneficiaryNameType === "fullName"}
                    onCheckedChange={(checked) =>
                      setValue(
                        "beneficiaryNameType",
                        checked ? "fullName" : "companyName",
                        { shouldDirty: true },
                      )
                    }
                    className="shrink-0 data-[state=checked]:bg-[#5b4fff]"
                  />
                </div>
              )}

              {/* Footer aligné droite */}
              <div className="flex justify-end border-t border-border/40 mt-3 px-5 py-3 -mx-5">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading}
                  className="gap-2"
                >
                  {isLoading ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      Enregistrer
                      <kbd className="inline-flex items-center justify-center size-5 rounded bg-white/20 ml-0.5">
                        <CornerDownLeft className="size-3" />
                      </kbd>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
