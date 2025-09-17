"use client";

import React from "react";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Separator } from "@/src/components/ui/separator";
import { CompanyLogoUpload } from "@/src/components/profile/CompanyLogoUpload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Building, Mail, Phone, Globe, MapPin } from "lucide-react";

const COUNTRIES = [
  { value: "France", label: "France" },
  { value: "Belgique", label: "Belgique" },
  { value: "Suisse", label: "Suisse" },
  { value: "Canada", label: "Canada" },
  { value: "Luxembourg", label: "Luxembourg" },
];

export function GeneraleSection({ register, errors, watch, setValue, session, organization }) {
  const watchedValues = watch();
  const logoUrl = watchedValues.logo || organization?.logo || null;
  const selectedCountry = watchedValues.address?.country || organization?.addressCountry || "France";

  const handleLogoChange = (imageUrl) => {
    setValue("logo", imageUrl, { shouldDirty: false });
  };

  const handleCountryChange = (value) => {
    setValue("address.country", value, { shouldDirty: false });
  };

  return (
    <div className="space-y-8">
      {/* Titre */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-1">Générale</h2>
        <Separator />

        {/* Logo de l'entreprise */}
        <div className="mb-8 mt-12">
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
            <CompanyLogoUpload
              currentImageUrl={logoUrl}
              onImageChange={handleLogoChange}
              showDescription={false}
            />
            <div className="flex-1">
              <Label className="text-sm font-medium text-gray-900">
                Logo de l'entreprise
              </Label>
              <p className="text-xs text-gray-600 mt-1">
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
                className="flex items-center gap-2 text-sm font-medium"
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
                })}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="flex items-center gap-2 text-sm font-medium"
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
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Phone className="h-4 w-4 text-gray-500" />
                Téléphone
              </Label>
              <Input
                id="phone"
                placeholder="+33 1 23 45 67 89"
                className="w-full"
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="website"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Globe className="h-4 w-4 text-gray-500" />
                Site web
              </Label>
              <Input
                id="website"
                placeholder="https://www.entreprise.com"
                className="w-full"
                {...register("website")}
              />
              {errors.website && (
                <p className="text-sm text-red-500">{errors.website.message}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Section Adresse */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <h3 className="text-sm font-medium text-gray-900">Adresse</h3>
            </div>

            {/* Adresse complète */}
            <div className="space-y-2">
              <Label className="text-sm font-medium" htmlFor="address">
                Adresse *
              </Label>
              <Input
                id="address"
                placeholder="123 Rue de la République"
                className="w-full"
                {...register("address.street", {
                  required: "L'adresse est requise",
                })}
              />
              {errors.address?.street && (
                <p className="text-sm text-red-500">{errors.address.street.message}</p>
              )}
            </div>

            {/* Ville et Code postal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium" htmlFor="city">
                  Ville *
                </Label>
                <Input 
                  id="city" 
                  placeholder="Paris" 
                  className="w-full"
                  {...register("address.city", {
                    required: "La ville est requise",
                  })}
                />
                {errors.address?.city && (
                  <p className="text-sm text-red-500">{errors.address.city.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium" htmlFor="postalCode">
                  Code postal *
                </Label>
                <Input 
                  id="postalCode" 
                  placeholder="75001" 
                  className="w-full"
                  {...register("address.postalCode", {
                    required: "Le code postal est requis",
                  })}
                />
                {errors.address?.postalCode && (
                  <p className="text-sm text-red-500">{errors.address.postalCode.message}</p>
                )}
              </div>
            </div>

            {/* Pays */}
            <div className="space-y-2">
              <Label className="text-sm font-medium" htmlFor="country">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GeneraleSection;
