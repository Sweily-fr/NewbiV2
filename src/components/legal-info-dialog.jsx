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
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { LoaderCircle, Scale, CornerDownLeft } from "lucide-react";
import { toast } from "sonner";
import { updateOrganization } from "@/src/lib/organization-client";
import {
  VALIDATION_PATTERNS,
  detectInjectionAttempt,
} from "@/src/lib/validation";

// Mêmes groupes que l'onglet "Informations légales" des paramètres
const LEGAL_FORM_GROUPS = [
  {
    label: "Sociétés commerciales",
    forms: [
      { value: "SARL", label: "SARL - Société à responsabilité limitée" },
      {
        value: "EURL",
        label: "EURL - Entreprise unipersonnelle à responsabilité limitée",
      },
      { value: "SAS", label: "SAS - Société par actions simplifiée" },
      {
        value: "SASU",
        label: "SASU - Société par actions simplifiée unipersonnelle",
      },
      { value: "SA", label: "SA - Société anonyme" },
      { value: "SCA", label: "SCA - Société en commandite par actions" },
      { value: "SNC", label: "SNC - Société en nom collectif" },
      { value: "SCS", label: "SCS - Société en commandite simple" },
    ],
  },
  {
    label: "Sociétés d'exercice libéral",
    forms: [
      {
        value: "SELARL",
        label: "SELARL - Société d'exercice libéral à responsabilité limitée",
      },
      {
        value: "SELAS",
        label: "SELAS - Société d'exercice libéral par actions simplifiée",
      },
      {
        value: "SELAFA",
        label: "SELAFA - Société d'exercice libéral à forme anonyme",
      },
      {
        value: "SELCA",
        label: "SELCA - Société d'exercice libéral en commandite par actions",
      },
    ],
  },
  {
    label: "Sociétés civiles",
    forms: [
      { value: "SCI", label: "SCI - Société civile immobilière" },
      { value: "SCM", label: "SCM - Société civile de moyens" },
      { value: "SCP", label: "SCP - Société civile professionnelle" },
    ],
  },
  {
    label: "Entreprise individuelle",
    forms: [
      {
        value: "EI",
        label: "EI - Entreprise individuelle (auto-entrepreneur)",
      },
    ],
  },
];

const VAT_REGIMES = [
  { value: "debits", label: "Sur les débits" },
  { value: "encaissements", label: "Sur les encaissements" },
];

const FIELD_LABEL_CLASS = "text-sm text-muted-foreground";

const noInjection = (value) => {
  if (value && detectInjectionAttempt(value)) {
    return "Caractères non autorisés détectés";
  }
  return true;
};

// Valeurs du formulaire à partir de l'organisation. Sert aussi bien aux
// defaultValues qu'au reset à chaque ouverture de la modale.
const valuesFromOrganization = (organization) => ({
  // "Auto-entrepreneur" est l'ancien nom de l'EI — normalisé vers "EI",
  // comme dans le modal des paramètres.
  legalForm:
    organization?.legalForm === "Auto-entrepreneur"
      ? "EI"
      : organization?.legalForm || "",
  capitalSocial: organization?.capitalSocial || "",
  siret: organization?.siret || "",
  rcs: organization?.rcs || "",
  vatNumber: organization?.vatNumber || "",
  vatMode: organization?.vatMode || "",
});

/**
 * Édition des informations légales depuis le panneau de paramètres d'un
 * document. Ces informations appartiennent à l'organisation et non au document :
 * la modale les enregistre directement via updateOrganization, puis émet
 * "organizationUpdated" pour que l'aperçu du document en cours se rafraîchisse.
 * Même fonctionnement que CompanyInfoDialog et BankDetailsDialog.
 */
export function LegalInfoDialog({ open, onOpenChange, organization }) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: valuesFromOrganization(organization),
  });

  const legalForm = watch("legalForm");
  const vatMode = watch("vatMode");

  // Repartir des valeurs de l'organisation à l'ouverture uniquement. La
  // dépendance porte sur `open` et non sur `organization` : si le parent
  // recrée cet objet à chaque rendu, l'effet effacerait la saisie en cours.
  const organizationRef = useRef(organization);
  organizationRef.current = organization;
  useEffect(() => {
    if (open) {
      reset(valuesFromOrganization(organizationRef.current));
    }
  }, [open, reset]);

  const onSubmit = async (formData) => {
    try {
      setIsLoading(true);

      if (!organization?.id) {
        toast.error("Aucune organisation active trouvée");
        return;
      }

      // Le SIREN est dérivé des 9 premiers chiffres du SIRET, comme dans le
      // modal des paramètres.
      const payload = {
        legalForm: formData.legalForm || "",
        capitalSocial: formData.capitalSocial || "",
        siret: formData.siret || "",
        siren: (formData.siret || "").substring(0, 9),
        rcs: formData.rcs || "",
        vatNumber: formData.vatNumber || "",
        vatMode: formData.vatMode || "",
      };

      await updateOrganization(organization.id, payload, {
        onSuccess: () => {
          toast.success("Informations légales mises à jour");

          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("organizationUpdated", {
                detail: { organizationId: organization.id, ...payload },
              }),
            );
          }

          onOpenChange(false);
        },
        onError: (error) => {
          console.error("Erreur lors de la mise à jour:", error);
          toast.error("Erreur lors de la mise à jour des informations légales");
        },
      });
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] p-1 gap-0 top-[50%] max-h-[85vh] border-0 bg-[#efefef] dark:bg-[#1a1a1a] overflow-hidden rounded-2xl">
        <div className="bg-background rounded-xl overflow-hidden ring-1 ring-black/[0.07] dark:ring-white/[0.1] flex flex-col max-h-[calc(85vh-0.5rem)]">
          <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/40 shrink-0">
            <DialogTitle className="text-sm font-medium flex items-center gap-2">
              <Scale className="size-4" />
              Informations légales
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col min-h-0 flex-1"
          >
            <div className="space-y-5 px-5 pt-4 pb-4 overflow-y-auto flex-1">
              <p className="text-xs text-muted-foreground">
                Ces informations apparaissent en pied de page de vos devis,
                factures, bons de commande et avoirs.
              </p>

              {/* Forme juridique */}
              <div className="flex flex-col gap-2">
                <Label className={FIELD_LABEL_CLASS}>Forme juridique</Label>
                <Select
                  value={legalForm || ""}
                  onValueChange={(value) =>
                    setValue("legalForm", value, { shouldDirty: true })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionnez la forme juridique" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEGAL_FORM_GROUPS.map((group) => (
                      <SelectGroup key={group.label}>
                        <SelectLabel>{group.label}</SelectLabel>
                        {group.forms.map((form) => (
                          <SelectItem key={form.value} value={form.value}>
                            {form.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Capital social / SIRET */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="dialog-capital" className={FIELD_LABEL_CLASS}>
                    Capital social (€)
                  </Label>
                  <Input
                    id="dialog-capital"
                    placeholder="10000"
                    {...register("capitalSocial", {
                      pattern: {
                        value: VALIDATION_PATTERNS.capital.pattern,
                        message: VALIDATION_PATTERNS.capital.message,
                      },
                      validate: noInjection,
                    })}
                  />
                  {errors.capitalSocial && (
                    <p className="text-xs text-destructive">
                      {errors.capitalSocial.message}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="dialog-siret" className={FIELD_LABEL_CLASS}>
                    SIRET
                  </Label>
                  <Input
                    id="dialog-siret"
                    placeholder="12345678901234"
                    {...register("siret", {
                      pattern: {
                        value: VALIDATION_PATTERNS.siret.pattern,
                        message: VALIDATION_PATTERNS.siret.message,
                      },
                      validate: noInjection,
                    })}
                  />
                  {errors.siret && (
                    <p className="text-xs text-destructive">
                      {errors.siret.message}
                    </p>
                  )}
                </div>
              </div>

              {/* RCS */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="dialog-rcs" className={FIELD_LABEL_CLASS}>
                  RCS
                </Label>
                <Input
                  id="dialog-rcs"
                  placeholder="981 576 549 R.C.S. Paris"
                  {...register("rcs", {
                    pattern: {
                      value: VALIDATION_PATTERNS.rcs.pattern,
                      message: VALIDATION_PATTERNS.rcs.message,
                    },
                    validate: noInjection,
                  })}
                />
                {errors.rcs && (
                  <p className="text-xs text-destructive">
                    {errors.rcs.message}
                  </p>
                )}
              </div>

              {/* Numéro de TVA intracommunautaire */}
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="dialog-vat-number"
                  className={FIELD_LABEL_CLASS}
                >
                  Numéro de TVA intracommunautaire
                </Label>
                <Input
                  id="dialog-vat-number"
                  placeholder="FR12345678901"
                  {...register("vatNumber", {
                    pattern: {
                      value: VALIDATION_PATTERNS.vatNumber.pattern,
                      message: VALIDATION_PATTERNS.vatNumber.message,
                    },
                    validate: noInjection,
                  })}
                />
                {errors.vatNumber && (
                  <p className="text-xs text-destructive">
                    {errors.vatNumber.message}
                  </p>
                )}
              </div>

              {/* Régime de la TVA */}
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="dialog-vat-regime"
                  className={FIELD_LABEL_CLASS}
                >
                  Régime de la TVA
                </Label>
                <Select
                  value={vatMode || ""}
                  onValueChange={(value) =>
                    setValue("vatMode", value, { shouldDirty: true })
                  }
                >
                  <SelectTrigger id="dialog-vat-regime" className="w-full">
                    <SelectValue placeholder="Sélectionnez le régime de la TVA" />
                  </SelectTrigger>
                  <SelectContent>
                    {VAT_REGIMES.map((regime) => (
                      <SelectItem key={regime.value} value={regime.value}>
                        {regime.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Affiché en pied de page des factures : &quot;Paiement de la
                  TVA: sur les encaissements&quot; ou &quot;sur les
                  débits&quot;.
                </p>
              </div>
            </div>

            {/* Footer aligné droite */}
            <div className="flex justify-end border-t border-border/40 px-5 py-3 shrink-0">
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
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
