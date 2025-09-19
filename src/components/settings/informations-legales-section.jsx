"use client";

import React, { useState } from "react";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Separator } from "@/src/components/ui/separator";
import { Switch } from "@/src/components/ui/switch";
import { Alert, AlertDescription } from "@/src/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { FileText, Building, Euro, Shield, Info } from "lucide-react";
import { getRequiredFields, getVisibleFields } from "@/src/lib/validation";

const LEGAL_FORMS = [
  { value: "SARL", label: "SARL - Société à Responsabilité Limitée" },
  { value: "SAS", label: "SAS - Société par Actions Simplifiée" },
  {
    value: "SASU",
    label: "SASU - Société par Actions Simplifiée Unipersonnelle",
  },
  {
    value: "EURL",
    label: "EURL - Entreprise Unipersonnelle à Responsabilité Limitée",
  },
  { value: "SA", label: "SA - Société Anonyme" },
  { value: "SNC", label: "SNC - Société en Nom Collectif" },
  { value: "Auto-entrepreneur", label: "Auto-entrepreneur / Micro-entreprise" },
  { value: "EI", label: "EI - Entreprise Individuelle" },
];

const TAX_REGIMES = [
  { value: "reel-normal", label: "Régime réel normal" },
  { value: "reel-simplifie", label: "Régime réel simplifié" },
  { value: "micro-entreprise", label: "Régime micro-entreprise" },
  { value: "micro-bic", label: "Régime micro-BIC" },
  { value: "micro-bnc", label: "Régime micro-BNC" },
];

const ACTIVITY_CATEGORIES = [
  { value: "commerciale", label: "Activité commerciale" },
  { value: "artisanale", label: "Activité artisanale" },
  { value: "liberale", label: "Profession libérale" },
  { value: "agricole", label: "Activité agricole" },
  { value: "industrielle", label: "Activité industrielle" },
];

export function InformationsLegalesSection({
  register,
  errors,
  watch,
  setValue,
  session,
  organization,
}) {
  const watchedValues = watch();
  const isVatSubject = watchedValues.legal?.isVatSubject || false;
  const hasCommercialActivity =
    watchedValues.legal?.hasCommercialActivity || false;
  const selectedLegalForm = watchedValues.legal?.legalForm || "";
  const selectedRegime = watchedValues.legal?.regime || "";
  const selectedCategory = watchedValues.legal?.category || "";

  const handleVatSubjectChange = (checked) => {
    setValue("legal.isVatSubject", checked, { shouldDirty: false });
  };

  const handleCommercialActivityChange = (checked) => {
    setValue("legal.hasCommercialActivity", checked, { shouldDirty: false });
  };

  const handleLegalFormChange = (value) => {
    setValue("legal.legalForm", value, { shouldDirty: false });
  };

  const handleRegimeChange = (value) => {
    setValue("legal.regime", value, { shouldDirty: false });
  };

  const handleCategoryChange = (value) => {
    setValue("legal.category", value, { shouldDirty: false });
  };

  // Calculer les champs requis et visibles en fonction de la forme juridique
  const requiredFields = getRequiredFields(
    selectedLegalForm,
    isVatSubject,
    hasCommercialActivity
  );
  const visibleFields = getVisibleFields(
    selectedLegalForm,
    isVatSubject,
    hasCommercialActivity
  );

  // Composant pour afficher les labels avec astérisque rouge si requis
  const RequiredLabel = ({ htmlFor, children, isRequired }) => (
    <Label htmlFor={htmlFor} className="text-sm font-normal pb-2">
      {children}
      {isRequired && <span className="text-red-500 ml-1">*</span>}
    </Label>
  );

  return (
    <div className="space-y-8">
      {/* Titre */}
      <div>
        <h2 className="text-lg font-medium mb-1">Informations légales</h2>
        <Separator />

        {/* Switches pour conditions spéciales */}
        <div className="space-y-6 mt-12">
          {/* Switch activité commerciale - visible seulement pour EI et Auto-entrepreneur */}
          {visibleFields.commercialActivityCheckbox && (
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-600 mb-1">
                  Exercez-vous une activité commerciale ?
                </h3>
                <p className="text-xs text-gray-400">
                  Cette information détermine si le numéro RCS est requis pour
                  votre forme juridique.
                </p>
              </div>
              <Switch
                checked={hasCommercialActivity}
                onCheckedChange={handleCommercialActivityChange}
                className="ml-4 flex-shrink-0 scale-75 data-[state=checked]:!bg-[#5b4eff]"
              />
            </div>
          )}

          {/* Switch TVA - toujours visible */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Êtes-vous assujetti à la TVA ?
              </h3>
              <p className="text-xs text-gray-400">
                Si oui, le numéro de TVA intracommunautaire sera requis.
              </p>
            </div>
            <Switch
              checked={isVatSubject}
              onCheckedChange={handleVatSubjectChange}
              className="ml-4 flex-shrink-0 scale-75 data-[state=checked]:!bg-[#5b4eff]"
            />
          </div>
        </div>

        {/* Formulaire des informations légales */}
        <div className="space-y-6 mt-8">
          {/* Forme juridique */}
          <div className="flex flex-col gap-1">
            <RequiredLabel htmlFor="legalForm" isRequired={true}>
              <Building className="h-4 w-4 inline mr-2 text-gray-500" />
              Forme juridique
            </RequiredLabel>
            <Select
              value={selectedLegalForm}
              onValueChange={handleLegalFormChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionnez la forme juridique" />
              </SelectTrigger>
              <SelectContent>
                {LEGAL_FORMS.map((form) => (
                  <SelectItem key={form.value} value={form.value}>
                    {form.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* SIRET et RCS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1">
              <RequiredLabel htmlFor="siret" isRequired={requiredFields.siret}>
                Numéro SIRET
              </RequiredLabel>
              <Input
                id="siret"
                placeholder="12345678901234"
                className="w-full"
                {...register("legal.siret")}
              />
              {errors.legal?.siret && (
                <p className="text-sm text-red-500">
                  {errors.legal.siret.message}
                </p>
              )}
              <p className="text-xs text-gray-600">14 chiffres sans espaces</p>
            </div>

            {visibleFields.rcs && (
              <div className="flex flex-col gap-1">
                <RequiredLabel htmlFor="rcs" isRequired={requiredFields.rcs}>
                  Numéro RCS
                  {!requiredFields.rcs &&
                    ["EI", "Auto-entrepreneur"].includes(selectedLegalForm) && (
                      <span className="text-gray-500 text-xs ml-2">
                        (si activité commerciale)
                      </span>
                    )}
                </RequiredLabel>
                <Input
                  id="rcs"
                  placeholder="RCS Paris 123 456 789"
                  className="w-full"
                  {...register("legal.rcs")}
                />
                {errors.legal?.rcs && (
                  <p className="text-sm text-red-500">
                    {errors.legal.rcs.message}
                  </p>
                )}
                <p className="text-xs text-gray-600">
                  Format: RCS Ville 123 456 789
                </p>
              </div>
            )}
          </div>

          {/* Numéro de TVA et Capital social */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visibleFields.vatNumber && (
              <div className="flex flex-col gap-1">
                <RequiredLabel
                  htmlFor="vatNumber"
                  isRequired={requiredFields.vatNumber}
                >
                  Numéro de TVA intracommunautaire
                </RequiredLabel>
                <Input
                  id="vatNumber"
                  placeholder="FR12345678901"
                  className="w-full"
                  {...register("legal.vatNumber")}
                />
                {errors.legal?.vatNumber && (
                  <p className="text-sm text-red-500">
                    {errors.legal.vatNumber.message}
                  </p>
                )}
                <p className="text-xs text-gray-600">
                  Format: FR + 11 chiffres
                </p>
              </div>
            )}

            {visibleFields.capital && (
              <div className="flex flex-col gap-1">
                <RequiredLabel
                  htmlFor="capital"
                  isRequired={requiredFields.capital}
                >
                  <Euro className="h-4 w-4 inline mr-2 text-gray-500" />
                  Capital social (€)
                </RequiredLabel>
                <Input
                  id="capital"
                  placeholder="10000"
                  type="number"
                  className="w-full"
                  {...register("legal.capital")}
                />
                {errors.legal?.capital && (
                  <p className="text-sm text-red-500">
                    {errors.legal.capital.message}
                  </p>
                )}
                <p className="text-xs text-gray-600">Montant en euros</p>
              </div>
            )}
          </div>

          {/* Régime fiscal */}
          <div className="flex flex-col gap-1">
            <RequiredLabel
              htmlFor="regime"
              isRequired={requiredFields.fiscalRegime}
            >
              Régime fiscal
            </RequiredLabel>
            <Select value={selectedRegime} onValueChange={handleRegimeChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionnez le régime fiscal" />
              </SelectTrigger>
              <SelectContent>
                {TAX_REGIMES.map((regime) => (
                  <SelectItem key={regime.value} value={regime.value}>
                    {regime.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Catégorie d'activité */}
          <div className="flex flex-col gap-1">
            <RequiredLabel
              htmlFor="category"
              isRequired={requiredFields.activityCategory}
            >
              Catégorie d'activité
            </RequiredLabel>
            <Select
              value={selectedCategory}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionnez la catégorie d'activité" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Information légale */}
          {/* <div className="bg-gradient-to-r from-[#5B4FFF]/10 to-[#5B4FFF]/20 p-4 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="bg-white p-2 rounded-lg shadow-sm">
                <FileText className="h-5 w-5 text-[#5B4FFF]" />
              </div>
              <div>
                <h4 className="font-medium text-[#5B4FFF]">
                  Informations légales
                </h4>
                <p className="text-sm text-[#5B4FFF]/80 mt-1">
                  Ces informations sont utilisées pour la génération automatique
                  de vos mentions légales et documents officiels. Assurez-vous
                  qu'elles sont exactes et à jour.
                </p>
              </div>
            </div>
          </div> */}
          <div className="mb-8 mt-2">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <span className="font-medium">Informations légales</span>
                <br />
                Ces informations sont utilisées pour la génération automatique
                de vos mentions légales et documents officiels. Assurez-vous
                qu'elles sont exactes et à jour.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InformationsLegalesSection;
