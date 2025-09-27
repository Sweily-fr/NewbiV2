"use client";

import React, { useEffect } from "react";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Separator } from "@/src/components/ui/separator";
import { Building, Mail, Phone, Globe, MapPin } from "lucide-react";
import { CompanyLogoUpload } from "@/src/components/profile/CompanyLogoUpload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useFormContext } from "react-hook-form";
import {
  sanitizeInput,
  VALIDATION_PATTERNS,
  detectInjectionAttempt,
} from "@/src/lib/validation";

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

  // Surveiller les valeurs du formulaire pour détecter les changements
  const watchedValues = watch();


  const logoUrl = watchedValues.logo || organization?.logo || null;
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
          }
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
        <h2 className="text-lg font-medium mb-1">Générale</h2>
        <Separator className="hidden md:block" />

        {/* Logo de l'entreprise */}
        <div className="mb-8 mt-12">
          <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-[#2c2c2c] rounded-xl">
            <CompanyLogoUpload
              currentImageUrl={logoUrl}
              onImageChange={handleLogoChange}
              onOrganizationUpdate={handleOrganizationUpdate}
              showDescription={false}
            />
            <div className="flex-1">
              <Label className="text-sm font-normal text-gray-900 dark:text-gray-100">
                Logo de l'entreprise
              </Label>
              <p className="text-xs w-[80%] text-gray-600 dark:text-gray-400 mt-1">
                Glissez une image ou cliquez pour uploader le logo de votre
                entreprise. Formats acceptés : JPG, PNG, GIF (max 5MB)
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Informations générales */}
        <div className="space-y-6 mt-8">
          {/* Nom de l'entreprise et Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="flex items-center gap-2 text-sm font-normal"
              >
                <Building className="h-4 w-4 text-gray-500" />
                Nom de l'entreprise *
              </Label>
              <Input
                id="name"
                placeholder="Nom de votre entreprise"
                className="w-full"
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
                className="flex items-center gap-2 text-sm font-normal"
              >
                <Mail className="h-4 w-4 text-gray-500" />
                Email professionnel *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@entreprise.com"
                className="w-full"
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

          {/* Téléphone et Site web */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="phone"
                className="flex items-center gap-2 text-sm font-normal"
              >
                <Phone className="h-4 w-4 text-gray-500" />
                Téléphone
              </Label>
              <Input
                id="phone"
                placeholder="+33 1 23 45 67 89"
                className="w-full"
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
                className="flex items-center gap-2 text-sm font-normal"
              >
                <Globe className="h-4 w-4 text-gray-500" />
                Site web
              </Label>
              <Input
                id="website"
                placeholder="https://www.entreprise.com"
                className="w-full"
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

          <Separator />

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
              <Label className="text-sm font-normal" htmlFor="address">
                Adresse *
              </Label>
              <Input
                id="address"
                placeholder="123 Rue de la République"
                className="w-full"
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
                <Label className="text-sm font-normal" htmlFor="city">
                  Ville *
                </Label>
                <Input
                  id="city"
                  placeholder="Paris"
                  className="w-full"
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
                <Label className="text-sm font-normal" htmlFor="postalCode">
                  Code postal *
                </Label>
                <Input
                  id="postalCode"
                  placeholder="75001"
                  className="w-full"
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
              <Label className="text-sm font-normal" htmlFor="country">
                Pays *
              </Label>
              <Select
                value={selectedCountry}
                onValueChange={handleCountryChange}
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
