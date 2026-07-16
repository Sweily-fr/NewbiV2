"use client";

import React, { useEffect, useRef } from "react";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Separator } from "@/src/components/ui/separator";
import { Button } from "@/src/components/ui/button";
import { CompanyLogoUpload } from "@/src/components/profile/CompanyLogoUpload";
import { Camera, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useFormContext } from "react-hook-form";
import { useMutation } from "@apollo/client";
import { UPDATE_COMPANY_LOGO } from "@/src/graphql/mutations/user";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import {
  sanitizeInput,
  VALIDATION_PATTERNS,
  detectInjectionAttempt,
} from "@/src/lib/validation";
import { Callout } from "@/src/components/ui/callout";
import { toast } from "@/src/components/ui/sonner";
import { useSubscriptionAccess } from "@/src/hooks/useSubscriptionAccess";

const COUNTRIES = [
  { value: "France", label: "France" },
  { value: "Belgique", label: "Belgique" },
  { value: "Suisse", label: "Suisse" },
  { value: "Canada", label: "Canada" },
  { value: "Luxembourg", label: "Luxembourg" },
];

export function GeneraleSection({
  session,
  organization,
  updateOrganization,
  refetchOrganization,
  canManageOrgSettings = true,
}) {
  let formContext;
  try {
    formContext = useFormContext();
  } catch (error) {
    console.error("❌ [GENERALE] Erreur FormContext:", error);
    return <div>Erreur: FormContext non disponible</div>;
  }

  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const { workspaceId } = useWorkspace();
  const { isReadOnly, isOwner } = useSubscriptionAccess();
  const readOnlyTooltip = isReadOnly
    ? isOwner
      ? "Mode lecture seule · Renouvelez votre abonnement"
      : "Mode lecture seule · Contactez l'administrateur"
    : undefined;
  const [updateCompanyLogo] = useMutation(UPDATE_COMPANY_LOGO);
  const logoContainerRef = useRef(null);

  // Surveiller les valeurs du formulaire pour détecter les changements
  const watchedValues = watch();

  const logoUrl =
    watchedValues.logo !== undefined
      ? watchedValues.logo
      : organization?.logo || null;
  const selectedCountry =
    watchedValues.address?.country || organization?.addressCountry || "France";

  const handleLogoChange = (imageUrl) => {
    setValue("logo", imageUrl);
  };

  const handleOrganizationUpdate = async (logoUrl) => {
    if (updateOrganization && organization?.id) {
      try {
        await updateOrganization(
          { logo: logoUrl },
          {
            onSuccess: async () => {
              // Forcer un refetch de l'organisation pour mettre à jour la session
              if (refetchOrganization) {
                await refetchOrganization();
              }
            },
            onError: (error) => {
              console.error("❌ Erreur sauvegarde automatique logo:", error);
            },
          },
        );
      } catch (error) {
        console.error("❌ Erreur lors de la sauvegarde automatique:", error);
      }
    }
  };

  const handleCountryChange = (value) => {
    setValue("address.country", value, { shouldValidate: true });
  };

  return (
    <div className="space-y-8">
      {/* Titre */}
      <div>
        <h2 className="text-lg font-medium mb-1 hidden md:block">Générale</h2>
        <p className="text-sm text-muted-foreground mb-4 hidden md:block">
          Informations générales de votre entreprise.
        </p>
        <Separator className="hidden md:block bg-[#eeeff1] dark:bg-[#232323]" />

        {/* Message d'information si pas de permissions */}
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

        {/* Logo de l'entreprise */}
        <div className="mb-8 mt-4 md:mt-12">
          <div className="flex items-center gap-5">
            <div ref={logoContainerRef}>
              <CompanyLogoUpload
                currentImageUrl={logoUrl}
                onImageChange={handleLogoChange}
                onOrganizationUpdate={handleOrganizationUpdate}
                showDescription={false}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-foreground">
                Logo de l'entreprise
              </Label>
              <p className="text-xs text-muted-foreground">
                Formats acceptés : PNG, JPEG, WebP ou SVG (max 5MB)
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={!canManageOrgSettings || isReadOnly}
                  title={readOnlyTooltip}
                  onClick={() => {
                    const input =
                      logoContainerRef.current?.querySelector(
                        'input[type="file"]',
                      );
                    if (input) input.click();
                  }}
                >
                  <Camera className="h-4 w-4 mr-1.5" />
                  Uploader le logo
                </Button>
                {logoUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={!canManageOrgSettings || isReadOnly}
                    title={readOnlyTooltip}
                    onClick={async () => {
                      try {
                        // 1. Mettre à jour le formulaire local
                        handleLogoChange(null);

                        // 2. Supprimer via GraphQL (supprime de R2 + met à jour la BDD)
                        if (workspaceId) {
                          await updateCompanyLogo({
                            variables: { logoUrl: null, workspaceId },
                          });
                        }

                        // 3. Refetch pour synchroniser la session
                        if (refetchOrganization) {
                          await refetchOrganization();
                        }

                        toast.success("Logo supprimé avec succès");
                      } catch (error) {
                        console.error("❌ Erreur suppression logo:", error);
                        toast.error("Erreur lors de la suppression du logo");
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-[#eeeff1] dark:bg-[#232323]" />

        {/* Informations générales */}
        <div className="space-y-6 mt-8">
          {/* Nom de l'entreprise et Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55"
              >
                Dénomination sociale{" "}
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Dénomination sociale de votre entreprise"
                className="w-full"
                disabled={!canManageOrgSettings}
                {...register("name", {
                  required: "Le nom est requis",
                  pattern: {
                    value: VALIDATION_PATTERNS.companyName.pattern,
                    message: VALIDATION_PATTERNS.companyName.message,
                  },
                  validate: (value) => {
                    if (detectInjectionAttempt(value)) {
                      return "Caractères non autorisés détectés";
                    }
                    return true;
                  },
                })}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55"
              >
                Email professionnel <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@entreprise.com"
                className="w-full"
                disabled={!canManageOrgSettings}
                {...register("email", {
                  required: "L'email est requis",
                  pattern: {
                    value: VALIDATION_PATTERNS.email.pattern,
                    message: VALIDATION_PATTERNS.email.message,
                  },
                  validate: (value) => {
                    if (detectInjectionAttempt(value)) {
                      return "Caractères non autorisés détectés";
                    }
                    return true;
                  },
                })}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Nom commercial */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="commercialName"
                className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55"
              >
                Nom commercial
              </Label>
              <Input
                id="commercialName"
                placeholder="Nom commercial"
                className="w-full"
                disabled={!canManageOrgSettings}
                {...register("commercialName", {
                  validate: (value) => {
                    if (value && detectInjectionAttempt(value)) {
                      return "Caractères non autorisés détectés";
                    }
                    return true;
                  },
                })}
              />
              <p className="text-xs text-gray-400">
                Affiché sur vos devis, factures, bons de commande et avoirs si
                l'option est activée dans leurs paramètres.
              </p>
              {errors.commercialName && (
                <p className="text-sm text-red-500">
                  {errors.commercialName.message}
                </p>
              )}
            </div>
          </div>

          {/* Activité réglementée */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="is-regulated-activity"
                checked={watchedValues.isRegulatedActivity || false}
                onCheckedChange={(checked) => {
                  setValue("isRegulatedActivity", checked, {
                    shouldDirty: true,
                  });
                }}
                disabled={!canManageOrgSettings}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="is-regulated-activity"
                  className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Activité réglementée
                </Label>
                <p className="text-xs text-muted-foreground">
                  Le titre professionnel apparaîtra dans les informations de vos
                  documents, l'organisme de rattachement, le numéro
                  professionnel et les assurances en bas de page.
                </p>
              </div>
            </div>

            {watchedValues.isRegulatedActivity && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="professionalTitle"
                      className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55"
                    >
                      Titre professionnel
                    </Label>
                    <Input
                      id="professionalTitle"
                      placeholder="Ex : Infirmier D.E., Expert-comptable"
                      className="w-full"
                      disabled={!canManageOrgSettings}
                      {...register("professionalTitle", {
                        validate: (value) => {
                          if (value && detectInjectionAttempt(value)) {
                            return "Caractères non autorisés détectés";
                          }
                          return true;
                        },
                      })}
                    />
                    {errors.professionalTitle && (
                      <p className="text-sm text-red-500">
                        {errors.professionalTitle.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="regulatoryBody"
                      className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55"
                    >
                      Organisme de rattachement
                    </Label>
                    <Input
                      id="regulatoryBody"
                      placeholder="Ex : Ordre des experts-comptables"
                      className="w-full"
                      disabled={!canManageOrgSettings}
                      {...register("regulatoryBody", {
                        validate: (value) => {
                          if (value && detectInjectionAttempt(value)) {
                            return "Caractères non autorisés détectés";
                          }
                          return true;
                        },
                      })}
                    />
                    {errors.regulatoryBody && (
                      <p className="text-sm text-red-500">
                        {errors.regulatoryBody.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="professionalNumber"
                      className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55"
                    >
                      Numéro professionnel
                    </Label>
                    <Input
                      id="professionalNumber"
                      placeholder="Ex : 12345678"
                      className="w-full"
                      disabled={!canManageOrgSettings}
                      {...register("professionalNumber", {
                        validate: (value) => {
                          if (value && detectInjectionAttempt(value)) {
                            return "Caractères non autorisés détectés";
                          }
                          return true;
                        },
                      })}
                    />
                    {errors.professionalNumber && (
                      <p className="text-sm text-red-500">
                        {errors.professionalNumber.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="decennialInsurance"
                      className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55"
                    >
                      Assurance décennale (si applicable)
                    </Label>
                    <Input
                      id="decennialInsurance"
                      placeholder="Ex : AXA, police n° 123456"
                      className="w-full"
                      disabled={!canManageOrgSettings}
                      {...register("decennialInsurance", {
                        validate: (value) => {
                          if (value && detectInjectionAttempt(value)) {
                            return "Caractères non autorisés détectés";
                          }
                          return true;
                        },
                      })}
                    />
                    {errors.decennialInsurance && (
                      <p className="text-sm text-red-500">
                        {errors.decennialInsurance.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="professionalLiabilityInsurance"
                      className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55"
                    >
                      Assurance RC Pro (si applicable)
                    </Label>
                    <Input
                      id="professionalLiabilityInsurance"
                      placeholder="Ex : MAAF, police n° 654321"
                      className="w-full"
                      disabled={!canManageOrgSettings}
                      {...register("professionalLiabilityInsurance", {
                        validate: (value) => {
                          if (value && detectInjectionAttempt(value)) {
                            return "Caractères non autorisés détectés";
                          }
                          return true;
                        },
                      })}
                    />
                    {errors.professionalLiabilityInsurance && (
                      <p className="text-sm text-red-500">
                        {errors.professionalLiabilityInsurance.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Téléphone et Site web */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="phone"
                className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55"
              >
                Téléphone
              </Label>
              <Input
                id="phone"
                placeholder="+33 1 23 45 67 89"
                className="w-full"
                disabled={!canManageOrgSettings}
                {...register("phone", {
                  pattern: {
                    value: VALIDATION_PATTERNS.phone.pattern,
                    message: VALIDATION_PATTERNS.phone.message,
                  },
                  validate: (value) => {
                    if (value && detectInjectionAttempt(value)) {
                      return "Caractères non autorisés détectés";
                    }
                    return true;
                  },
                })}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="website"
                className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55"
              >
                Site web
              </Label>
              <Input
                id="website"
                placeholder="https://www.entreprise.com"
                className="w-full"
                disabled={!canManageOrgSettings}
                {...register("website", {
                  pattern: {
                    value: VALIDATION_PATTERNS.website.pattern,
                    message: VALIDATION_PATTERNS.website.message,
                  },
                  validate: (value) => {
                    if (value && detectInjectionAttempt(value)) {
                      return "Caractères non autorisés détectés";
                    }
                    return true;
                  },
                })}
              />
              {errors.website && (
                <p className="text-sm text-red-500">{errors.website.message}</p>
              )}
            </div>
          </div>

          <Separator className="bg-[#eeeff1] dark:bg-[#232323]" />

          {/* Section Adresse */}
          <div className="space-y-6">
            {/* <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500 dark;text-gray-200" />
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200">
                Adresse
              </h3>
            </div> */}

            {/* Adresse complète */}
            <div className="space-y-2">
              <Label
                className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55"
                htmlFor="address"
              >
                Adresse <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="address"
                placeholder="123 Rue de la République"
                className="w-full"
                disabled={!canManageOrgSettings}
                {...register("address.street", {
                  required: "L'adresse est requise",
                  pattern: {
                    value: VALIDATION_PATTERNS.street.pattern,
                    message: VALIDATION_PATTERNS.street.message,
                  },
                  validate: (value) => {
                    if (detectInjectionAttempt(value)) {
                      return "Caractères non autorisés détectés";
                    }
                    return true;
                  },
                })}
              />
              {errors.address?.street && (
                <p className="text-sm text-red-500">
                  {errors.address.street.message}
                </p>
              )}
            </div>

            {/* Ville et Code postal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55"
                  htmlFor="city"
                >
                  Ville <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="city"
                  placeholder="Paris"
                  className="w-full"
                  disabled={!canManageOrgSettings}
                  {...register("address.city", {
                    required: "La ville est requise",
                    pattern: {
                      value: VALIDATION_PATTERNS.city.pattern,
                      message: VALIDATION_PATTERNS.city.message,
                    },
                    validate: (value) => {
                      if (detectInjectionAttempt(value)) {
                        return "Caractères non autorisés détectés";
                      }
                      return true;
                    },
                  })}
                />
                {errors.address?.city && (
                  <p className="text-sm text-red-500">
                    {errors.address.city.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55"
                  htmlFor="postalCode"
                >
                  Code postal <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="postalCode"
                  placeholder="75001"
                  className="w-full"
                  disabled={!canManageOrgSettings}
                  {...register("address.postalCode", {
                    required: "Le code postal est requis",
                    pattern: {
                      value: VALIDATION_PATTERNS.postalCode.pattern,
                      message: VALIDATION_PATTERNS.postalCode.message,
                    },
                    validate: (value) => {
                      if (detectInjectionAttempt(value)) {
                        return "Caractères non autorisés détectés";
                      }
                      return true;
                    },
                  })}
                />
                {errors.address?.postalCode && (
                  <p className="text-sm text-red-500">
                    {errors.address.postalCode.message}
                  </p>
                )}
              </div>
            </div>

            {/* Pays */}
            <div className="space-y-2">
              <Label
                className="text-xs font-medium leading-4 -tracking-[0.01em] text-black/55 dark:text-white/55"
                htmlFor="country"
              >
                Pays <span className="text-red-500 ml-1">*</span>
              </Label>
              <Select
                value={selectedCountry}
                onValueChange={handleCountryChange}
                disabled={!canManageOrgSettings}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionnez un pays" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.value} value={country.value}>
                      {country.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.address?.country && (
                <p className="text-sm text-red-500">
                  {errors.address.country.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GeneraleSection;
