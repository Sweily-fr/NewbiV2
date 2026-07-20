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
import { Switch } from "@/src/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { CompanyLogoUpload } from "@/src/components/profile/CompanyLogoUpload";
import { LoaderCircle, Building2, CornerDownLeft } from "lucide-react";
import { toast } from "sonner";
import { updateOrganization } from "@/src/lib/organization-client";
import {
  VALIDATION_PATTERNS,
  detectInjectionAttempt,
} from "@/src/lib/validation";

const COUNTRIES = [
  { value: "France", label: "France", flag: "🇫🇷" },
  { value: "Belgique", label: "Belgique", flag: "🇧🇪" },
  { value: "Suisse", label: "Suisse", flag: "🇨🇭" },
  { value: "Canada", label: "Canada", flag: "🇨🇦" },
  { value: "Luxembourg", label: "Luxembourg", flag: "🇱🇺" },
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
  logo: organization?.logo || "",
  companyName: organization?.companyName || "",
  companyEmail: organization?.companyEmail || "",
  companyPhone: organization?.companyPhone || "",
  website: organization?.website || "",
  addressStreet: organization?.addressStreet || "",
  addressCity: organization?.addressCity || "",
  addressZipCode: organization?.addressZipCode || "",
  addressCountry: organization?.addressCountry || "France",
  showCommercialName: organization?.showCommercialName || false,
  commercialName: organization?.commercialName || "",
  isRegulatedActivity: organization?.isRegulatedActivity || false,
  professionalTitle: organization?.professionalTitle || "",
  regulatoryBody: organization?.regulatoryBody || "",
  professionalNumber: organization?.professionalNumber || "",
  decennialInsurance: organization?.decennialInsurance || "",
  professionalLiabilityInsurance:
    organization?.professionalLiabilityInsurance || "",
});

/**
 * Édition des informations de l'entreprise depuis le panneau de paramètres d'un
 * document. Ces informations appartiennent à l'organisation et non au document :
 * la modale les enregistre directement via updateOrganization, puis émet
 * "organizationUpdated" pour que l'aperçu du document en cours se rafraîchisse.
 * Même fonctionnement que BankDetailsDialog.
 */
export function CompanyInfoDialog({
  open,
  onOpenChange,
  organization,
  onSuccess,
}) {
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

  const logoUrl = watch("logo");
  const country = watch("addressCountry");
  const showCommercialName = watch("showCommercialName");
  const isRegulatedActivity = watch("isRegulatedActivity");

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

  // Le logo part immédiatement dans l'organisation, comme dans l'onglet
  // Générale : l'upload est déjà une action explicite de l'utilisateur.
  const handleLogoOrganizationUpdate = async (imageUrl) => {
    try {
      if (organization?.id) {
        await updateOrganization(organization.id, { logo: imageUrl });
      }
    } catch (error) {
      console.error("Erreur sauvegarde logo:", error);
      toast.error("Erreur lors de l'enregistrement du logo");
    }
  };

  const onSubmit = async (formData) => {
    try {
      setIsLoading(true);

      if (!organization?.id) {
        toast.error("Aucune organisation active trouvée");
        return;
      }

      // Le nom commercial et les champs d'activité réglementée ne sont envoyés
      // que si l'option correspondante est active, pour rester cohérent avec ce
      // qui est réellement affiché sur les documents.
      const payload = {
        logo: formData.logo || "",
        companyName: formData.companyName || "",
        companyEmail: formData.companyEmail || "",
        companyPhone: formData.companyPhone || "",
        website: formData.website || "",
        addressStreet: formData.addressStreet || "",
        addressCity: formData.addressCity || "",
        addressZipCode: formData.addressZipCode || "",
        addressCountry: formData.addressCountry || "France",
        showCommercialName: formData.showCommercialName || false,
        commercialName: formData.showCommercialName
          ? formData.commercialName || ""
          : "",
        isRegulatedActivity: formData.isRegulatedActivity || false,
        professionalTitle: formData.isRegulatedActivity
          ? formData.professionalTitle || ""
          : "",
        regulatoryBody: formData.isRegulatedActivity
          ? formData.regulatoryBody || ""
          : "",
        professionalNumber: formData.isRegulatedActivity
          ? formData.professionalNumber || ""
          : "",
        decennialInsurance: formData.isRegulatedActivity
          ? formData.decennialInsurance || ""
          : "",
        professionalLiabilityInsurance: formData.isRegulatedActivity
          ? formData.professionalLiabilityInsurance || ""
          : "",
      };

      await updateOrganization(organization.id, payload, {
        onSuccess: () => {
          toast.success("Informations de l'entreprise mises à jour");

          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("organizationUpdated", {
                detail: { organizationId: organization.id, ...payload },
              }),
            );
          }

          if (onSuccess) {
            onSuccess(payload);
          }
          onOpenChange(false);
        },
        onError: (error) => {
          console.error("Erreur lors de la mise à jour:", error);
          toast.error(
            "Erreur lors de la mise à jour des informations de l'entreprise",
          );
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
              <Building2 className="size-4" />
              Informations de l&apos;entreprise
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col min-h-0 flex-1"
          >
            <div className="space-y-5 px-5 pt-4 pb-4 overflow-y-auto flex-1">
              <p className="text-xs text-muted-foreground">
                Ces informations sont communes à tous vos devis, factures, bons
                de commande et avoirs.
              </p>

              {/* Logo — enregistré dans l'organisation dès l'upload, sans
                  attendre le bouton Enregistrer */}
              <div className="flex items-center gap-5">
                <CompanyLogoUpload
                  currentImageUrl={logoUrl || null}
                  onImageChange={(imageUrl) =>
                    setValue("logo", imageUrl, { shouldDirty: true })
                  }
                  onOrganizationUpdate={handleLogoOrganizationUpdate}
                  showDescription={false}
                />
                <div className="flex flex-col gap-1">
                  <Label className={FIELD_LABEL_CLASS}>
                    Logo de l&apos;entreprise
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Formats acceptés : PNG, JPEG, WebP ou SVG (max 5MB)
                  </p>
                </div>
              </div>

              {/* Dénomination sociale */}
              <div className="space-y-2">
                <Label
                  htmlFor="dialog-company-name"
                  className={FIELD_LABEL_CLASS}
                >
                  Dénomination sociale
                </Label>
                <Input
                  id="dialog-company-name"
                  placeholder="Nom de votre entreprise"
                  {...register("companyName", {
                    required: "Le nom est requis",
                    pattern: {
                      value: VALIDATION_PATTERNS.companyName.pattern,
                      message: VALIDATION_PATTERNS.companyName.message,
                    },
                    validate: noInjection,
                  })}
                />
                {errors.companyName && (
                  <p className="text-xs text-destructive">
                    {errors.companyName.message}
                  </p>
                )}
              </div>

              {/* Email / Téléphone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="dialog-company-email"
                    className={FIELD_LABEL_CLASS}
                  >
                    Email
                  </Label>
                  <Input
                    id="dialog-company-email"
                    type="email"
                    placeholder="contact@entreprise.fr"
                    {...register("companyEmail", {
                      required: "L'email est requis",
                      pattern: {
                        value: VALIDATION_PATTERNS.email.pattern,
                        message: VALIDATION_PATTERNS.email.message,
                      },
                      validate: noInjection,
                    })}
                  />
                  {errors.companyEmail && (
                    <p className="text-xs text-destructive">
                      {errors.companyEmail.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="dialog-company-phone"
                    className={FIELD_LABEL_CLASS}
                  >
                    Téléphone
                  </Label>
                  <Input
                    id="dialog-company-phone"
                    placeholder="01 23 45 67 89"
                    {...register("companyPhone", { validate: noInjection })}
                  />
                  {errors.companyPhone && (
                    <p className="text-xs text-destructive">
                      {errors.companyPhone.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Site web */}
              <div className="space-y-2">
                <Label htmlFor="dialog-website" className={FIELD_LABEL_CLASS}>
                  Site web
                </Label>
                <Input
                  id="dialog-website"
                  placeholder="https://www.entreprise.fr"
                  {...register("website", { validate: noInjection })}
                />
                {errors.website && (
                  <p className="text-xs text-destructive">
                    {errors.website.message}
                  </p>
                )}
              </div>

              {/* Adresse */}
              <div className="space-y-2">
                <Label
                  htmlFor="dialog-address-street"
                  className={FIELD_LABEL_CLASS}
                >
                  Adresse
                </Label>
                <Input
                  id="dialog-address-street"
                  placeholder="12 rue de la Paix"
                  {...register("addressStreet", { validate: noInjection })}
                />
                {errors.addressStreet && (
                  <p className="text-xs text-destructive">
                    {errors.addressStreet.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="dialog-address-zip"
                    className={FIELD_LABEL_CLASS}
                  >
                    Code postal
                  </Label>
                  <Input
                    id="dialog-address-zip"
                    placeholder="75001"
                    {...register("addressZipCode", { validate: noInjection })}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="dialog-address-city"
                    className={FIELD_LABEL_CLASS}
                  >
                    Ville
                  </Label>
                  <Input
                    id="dialog-address-city"
                    placeholder="Paris"
                    {...register("addressCity", { validate: noInjection })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={FIELD_LABEL_CLASS}>Pays</Label>
                  <Select
                    value={country || "France"}
                    onValueChange={(value) =>
                      setValue("addressCountry", value, { shouldDirty: true })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pays" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          <span className="mr-2">{c.flag}</span>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Nom commercial */}
              <div className="p-4 rounded-xl border bg-[#F5F5F5] dark:bg-neutral-900 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="dialog-show-commercial-name"
                      className="text-sm font-medium"
                    >
                      Afficher le nom commercial
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Affiché sous la dénomination sociale sur vos devis,
                      factures, bons de commande et avoirs.
                    </p>
                  </div>
                  <Switch
                    id="dialog-show-commercial-name"
                    checked={showCommercialName || false}
                    onCheckedChange={(checked) =>
                      setValue("showCommercialName", checked, {
                        shouldDirty: true,
                      })
                    }
                    className="shrink-0 data-[state=checked]:bg-[#5b4fff]"
                  />
                </div>
                {showCommercialName && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="dialog-commercial-name"
                      className={FIELD_LABEL_CLASS}
                    >
                      Nom commercial
                    </Label>
                    <Input
                      id="dialog-commercial-name"
                      placeholder="Ex : Newbi"
                      className="bg-white dark:bg-neutral-800"
                      {...register("commercialName", { validate: noInjection })}
                    />
                    {errors.commercialName && (
                      <p className="text-xs text-destructive">
                        {errors.commercialName.message}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Activité réglementée */}
              <div className="p-4 rounded-xl border bg-[#F5F5F5] dark:bg-neutral-900 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="dialog-is-regulated-activity"
                      className="text-sm font-medium"
                    >
                      Activité réglementée
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Titre professionnel dans les informations du document ;
                      organisme, numéro professionnel et assurances en bas de
                      page.
                    </p>
                  </div>
                  <Switch
                    id="dialog-is-regulated-activity"
                    checked={isRegulatedActivity || false}
                    onCheckedChange={(checked) =>
                      setValue("isRegulatedActivity", checked, {
                        shouldDirty: true,
                      })
                    }
                    className="shrink-0 data-[state=checked]:bg-[#5b4fff]"
                  />
                </div>
                {isRegulatedActivity && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="dialog-professional-title"
                        className={FIELD_LABEL_CLASS}
                      >
                        Titre professionnel
                      </Label>
                      <Input
                        id="dialog-professional-title"
                        placeholder="Ex : Expert-comptable"
                        className="bg-white dark:bg-neutral-800"
                        {...register("professionalTitle", {
                          validate: noInjection,
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="dialog-regulatory-body"
                        className={FIELD_LABEL_CLASS}
                      >
                        Organisme de rattachement
                      </Label>
                      <Input
                        id="dialog-regulatory-body"
                        placeholder="Ex : Ordre des experts-comptables"
                        className="bg-white dark:bg-neutral-800"
                        {...register("regulatoryBody", {
                          validate: noInjection,
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="dialog-professional-number"
                        className={FIELD_LABEL_CLASS}
                      >
                        Numéro professionnel
                      </Label>
                      <Input
                        id="dialog-professional-number"
                        placeholder="Ex : 12345678"
                        className="bg-white dark:bg-neutral-800"
                        {...register("professionalNumber", {
                          validate: noInjection,
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="dialog-decennial-insurance"
                        className={FIELD_LABEL_CLASS}
                      >
                        Assurance décennale (si applicable)
                      </Label>
                      <Input
                        id="dialog-decennial-insurance"
                        placeholder="Ex : AXA, police n° 123456"
                        className="bg-white dark:bg-neutral-800"
                        {...register("decennialInsurance", {
                          validate: noInjection,
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="dialog-rc-pro-insurance"
                        className={FIELD_LABEL_CLASS}
                      >
                        Assurance RC Pro (si applicable)
                      </Label>
                      <Input
                        id="dialog-rc-pro-insurance"
                        placeholder="Ex : MAAF, police n° 654321"
                        className="bg-white dark:bg-neutral-800"
                        {...register("professionalLiabilityInsurance", {
                          validate: noInjection,
                        })}
                      />
                    </div>
                  </div>
                )}
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
