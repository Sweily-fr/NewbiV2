"use client";

import React, { useState } from "react";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Separator } from "@/src/components/ui/separator";
import { Switch } from "@/src/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format, parse } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as ShadcnCalendar } from "@/src/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import {
  getRequiredFields,
  getVisibleFields,
  VALIDATION_PATTERNS,
  detectInjectionAttempt,
} from "@/src/lib/validation";
import { useFormContext } from "react-hook-form";
import { Callout } from "@/src/components/ui/callout";

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

const ALL_TAX_REGIMES = [
  { value: "reel-normal", label: "Régime réel normal" },
  { value: "reel-simplifie", label: "Régime réel simplifié" },
  { value: "micro-entreprise", label: "Régime micro-entreprise" },
  { value: "micro-bic", label: "Régime micro-BIC" },
  { value: "micro-bnc", label: "Régime micro-BNC" },
];

// Filtrage des régimes fiscaux selon la forme juridique
// - Auto-entrepreneur : uniquement micro (micro-entreprise, micro-BIC, micro-BNC)
// - EI / EURL : tous les régimes (micro possible sous conditions + réel)
// - Sociétés (SARL, SAS, SASU, SA, SNC) : réel uniquement (IS, pas de micro)
function getAvailableTaxRegimes(legalForm) {
  const microOnly = ["micro-entreprise", "micro-bic", "micro-bnc"];
  const reelOnly = ["reel-normal", "reel-simplifie"];

  switch (legalForm) {
    case "Auto-entrepreneur":
      return ALL_TAX_REGIMES.filter((r) => microOnly.includes(r.value));
    case "EI":
    case "EURL":
      return ALL_TAX_REGIMES;
    case "SARL":
    case "SAS":
    case "SASU":
    case "SA":
    case "SNC":
      return ALL_TAX_REGIMES.filter((r) => reelOnly.includes(r.value));
    default:
      return ALL_TAX_REGIMES;
  }
}

const ACTIVITY_CATEGORIES = [
  { value: "commerciale", label: "Activité commerciale" },
  { value: "artisanale", label: "Activité artisanale" },
  { value: "liberale", label: "Profession libérale" },
  { value: "agricole", label: "Activité agricole" },
  { value: "industrielle", label: "Activité industrielle" },
];

const VAT_REGIMES = [
  { value: "reel-normal", label: "Réel normal" },
  { value: "reel-simplifie", label: "Réel simplifié" },
];

const VAT_FREQUENCIES = [
  { value: "mensuel", label: "Mensuel" },
  { value: "trimestriel", label: "Trimestrielle" },
];

const VAT_MODES = [
  { value: "debits", label: "Débits" },
  { value: "encaissements", label: "Encaissements" },
];

export function InformationsLegalesSection({
  session,
  organization,
  updateOrganization,
  refetchOrganization,
  canManageOrgSettings = true,
}) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const watchedValues = watch();

  const isVatSubject = watchedValues.legal?.isVatSubject || false;
  const hasCommercialActivity =
    watchedValues.legal?.hasCommercialActivity || false;
  const selectedLegalForm = watchedValues.legal?.legalForm || "";
  const selectedRegime = watchedValues.legal?.regime || "";
  const selectedCategory = watchedValues.legal?.category || "";
  const selectedVatRegime = watchedValues.legal?.vatRegime || "";
  const selectedVatFrequency = watchedValues.legal?.vatFrequency || "";
  const selectedVatMode = watchedValues.legal?.vatMode || "";

  const handleVatSubjectChange = (checked) => {
    setValue("legal.isVatSubject", checked, { shouldDirty: true });
  };

  const handleCommercialActivityChange = (checked) => {
    setValue("legal.hasCommercialActivity", checked, { shouldDirty: true });
  };

  const availableTaxRegimes = getAvailableTaxRegimes(selectedLegalForm);

  const handleLegalFormChange = (value) => {
    setValue("legal.legalForm", value, { shouldDirty: true });
    // Reset le régime fiscal si la valeur actuelle n'est plus disponible
    const newAvailable = getAvailableTaxRegimes(value);
    if (selectedRegime && !newAvailable.some((r) => r.value === selectedRegime)) {
      setValue("legal.regime", "", { shouldDirty: true });
    }
  };

  const handleRegimeChange = (value) => {
    setValue("legal.regime", value, { shouldDirty: true });
  };

  const handleCategoryChange = (value) => {
    setValue("legal.category", value, { shouldDirty: true });
  };

  const handleVatRegimeChange = (value) => {
    setValue("legal.vatRegime", value, { shouldDirty: true });
    // Reset frequency when changing VAT regime
    if (value === "reel-simplifie") {
      setValue("legal.vatFrequency", "", { shouldDirty: true });
    }
  };

  const handleVatFrequencyChange = (value) => {
    setValue("legal.vatFrequency", value, { shouldDirty: true });
  };

  const handleVatModeChange = (value) => {
    setValue("legal.vatMode", value, { shouldDirty: true });
  };

  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

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

  const RequiredLabel = ({ htmlFor, children, isRequired }) => (
    <Label htmlFor={htmlFor}>
      {children}
      {isRequired && <span className="text-red-500 ml-1">*</span>}
    </Label>
  );

  const SectionTitle = ({ children }) => (
    <div className="flex items-center gap-2 mb-4">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
        {children}
      </h3>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Titre */}
      <div>
        <h2 className="text-lg font-medium mb-1 hidden md:block">Informations légales</h2>
        <Separator className="hidden md:block" />
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

        {/* Switch activité commerciale - visible seulement pour EI et Auto-entrepreneur */}
        <div className="space-y-6 mt-4 md:mt-12">
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
        </div>

        {/* Formulaire des informations légales */}
        <div className="space-y-5 md:space-y-6 mt-0 md:mt-8">
          {/* Forme juridique */}
          <div>
            <RequiredLabel htmlFor="legalForm" isRequired={true}>
              Forme juridique
            </RequiredLabel>
            <Select
              value={selectedLegalForm}
              onValueChange={handleLegalFormChange}
              disabled={!canManageOrgSettings}
            >
              <SelectTrigger className="w-full mt-1.5">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            <div>
              <RequiredLabel htmlFor="siret" isRequired={requiredFields.siret}>
                Numéro SIRET
              </RequiredLabel>
              <Input
                id="siret"
                placeholder="12345678901234"
                className="w-full mt-1.5"
                disabled={!canManageOrgSettings}
                {...register("legal.siret", {
                  required: requiredFields.siret
                    ? "Le numéro SIRET est requis"
                    : false,
                  pattern: {
                    value: VALIDATION_PATTERNS.siret.pattern,
                    message: VALIDATION_PATTERNS.siret.message,
                  },
                  validate: (value) => {
                    if (value && detectInjectionAttempt(value)) {
                      return "Caractères non autorisés détectés";
                    }
                    return true;
                  },
                })}
              />
              {errors.legal?.siret && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.legal.siret.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1.5">14 chiffres sans espaces</p>
            </div>

            {visibleFields.rcs && (
              <div>
                <RequiredLabel htmlFor="rcs" isRequired={requiredFields.rcs}>
                  Numéro RCS
                  {!requiredFields.rcs &&
                    ["EI", "Auto-entrepreneur"].includes(selectedLegalForm) && (
                      <span className="text-muted-foreground text-xs ml-2">
                        (si activité commerciale)
                      </span>
                    )}
                </RequiredLabel>
                <Input
                  id="rcs"
                  placeholder="RCS Paris 123 456 789"
                  className="w-full mt-1.5"
                  disabled={!canManageOrgSettings}
                  {...register("legal.rcs", {
                    required: requiredFields.rcs
                      ? "Le numéro RCS est requis"
                      : false,
                    pattern: {
                      value: VALIDATION_PATTERNS.rcs.pattern,
                      message: VALIDATION_PATTERNS.rcs.message,
                    },
                    validate: (value) => {
                      if (value && detectInjectionAttempt(value)) {
                        return "Caractères non autorisés détectés";
                      }
                      return true;
                    },
                  })}
                />
                {errors.legal?.rcs && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.legal.rcs.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1.5">
                  Format: RCS Ville 123 456 789
                </p>
              </div>
            )}
          </div>

          {/* Capital social et Catégorie d'activité */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            {visibleFields.capital && (
              <div>
                <RequiredLabel
                  htmlFor="capital"
                  isRequired={requiredFields.capital}
                >
                  Capital social (€)
                </RequiredLabel>
                <Input
                  id="capital"
                  placeholder="10000"
                  type="number"
                  disabled={!canManageOrgSettings}
                  className="w-full mt-1.5"
                  {...register("legal.capital", {
                    required: requiredFields.capital
                      ? "Le capital social est requis"
                      : false,
                    pattern: {
                      value: VALIDATION_PATTERNS.capital.pattern,
                      message: VALIDATION_PATTERNS.capital.message,
                    },
                    validate: (value) => {
                      if (value && detectInjectionAttempt(value)) {
                        return "Caractères non autorisés détectés";
                      }
                      return true;
                    },
                  })}
                />
                {errors.legal?.capital && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.legal.capital.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1.5">Montant en euros</p>
              </div>
            )}

            <div>
              <RequiredLabel
                htmlFor="category"
                isRequired={requiredFields.activityCategory}
              >
                Catégorie d'activité
              </RequiredLabel>
              <Select
                value={selectedCategory}
                onValueChange={handleCategoryChange}
                disabled={!canManageOrgSettings}
              >
                <SelectTrigger className="w-full mt-1.5">
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
          </div>

          {/* ══════════════════════════════════════════ */}
          {/* Section Impôts                             */}
          {/* ══════════════════════════════════════════ */}
          <div className="mt-4">
            <SectionTitle>Impôts</SectionTitle>
            <div className="space-y-5 md:space-y-6">
              {/* Régime fiscal */}
              <div>
                <RequiredLabel
                  htmlFor="regime"
                  isRequired={requiredFields.fiscalRegime}
                >
                  Régime fiscal
                </RequiredLabel>
                <Select
                  value={selectedRegime}
                  onValueChange={handleRegimeChange}
                  disabled={!canManageOrgSettings}
                >
                  <SelectTrigger className="w-full mt-1.5">
                    <SelectValue placeholder="Sélectionnez le régime fiscal" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTaxRegimes.map((regime) => (
                      <SelectItem key={regime.value} value={regime.value}>
                        {regime.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>
          </div>

          {/* ══════════════════════════════════════════ */}
          {/* Section TVA                                */}
          {/* ══════════════════════════════════════════ */}
          <div className="mt-4">
            <SectionTitle>TVA</SectionTitle>
            <div className="space-y-5 md:space-y-6">
              {/* Switch TVA */}
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

              {isVatSubject ? (
                <div className="space-y-5 md:space-y-6">
                  {/* Régime de TVA */}
                  <div>
                    <RequiredLabel htmlFor="vatRegime" isRequired={false}>
                      Régime de TVA
                    </RequiredLabel>
                    <Select
                      value={selectedVatRegime}
                      onValueChange={handleVatRegimeChange}
                      disabled={!canManageOrgSettings}
                    >
                      <SelectTrigger className="w-full mt-1.5">
                        <SelectValue placeholder="Sélectionnez le régime de TVA" />
                      </SelectTrigger>
                      <SelectContent>
                        {VAT_REGIMES.map((regime) => (
                          <SelectItem key={regime.value} value={regime.value}>
                            {regime.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Fréquence - conditionnelle selon le régime de TVA */}
                  {selectedVatRegime === "reel-normal" && (
                    <div>
                      <RequiredLabel htmlFor="vatFrequency" isRequired={false}>
                        Fréquence de déclaration
                      </RequiredLabel>
                      <Select
                        value={selectedVatFrequency}
                        onValueChange={handleVatFrequencyChange}
                        disabled={!canManageOrgSettings}
                      >
                        <SelectTrigger className="w-full mt-1.5">
                          <SelectValue placeholder="Sélectionnez la fréquence" />
                        </SelectTrigger>
                        <SelectContent>
                          {VAT_FREQUENCIES.map((freq) => (
                            <SelectItem key={freq.value} value={freq.value}>
                              {freq.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedVatRegime === "reel-simplifie" && (
                    <div className="rounded-md bg-gray-50 dark:bg-gray-900 px-4 py-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Acompte de TVA en Juillet et Décembre
                      </p>
                    </div>
                  )}

                  {/* Mode de TVA */}
                  <div>
                    <RequiredLabel htmlFor="vatMode" isRequired={false}>
                      Mode de TVA
                    </RequiredLabel>
                    <Select
                      value={selectedVatMode}
                      onValueChange={handleVatModeChange}
                      disabled={!canManageOrgSettings}
                    >
                      <SelectTrigger className="w-full mt-1.5">
                        <SelectValue placeholder="Sélectionnez le mode de TVA" />
                      </SelectTrigger>
                      <SelectContent>
                        {VAT_MODES.map((mode) => (
                          <SelectItem key={mode.value} value={mode.value}>
                            {mode.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Numéro de TVA intracommunautaire */}
                  {visibleFields.vatNumber && (
                    <div>
                      <RequiredLabel
                        htmlFor="vatNumber"
                        isRequired={requiredFields.vatNumber}
                      >
                        Numéro de TVA intracommunautaire
                      </RequiredLabel>
                      <Input
                        id="vatNumber"
                        placeholder="FR12345678901"
                        className="w-full mt-1.5"
                        disabled={!canManageOrgSettings}
                        {...register("legal.vatNumber", {
                          required: requiredFields.vatNumber
                            ? "Le numéro de TVA est requis"
                            : false,
                          pattern: {
                            value: VALIDATION_PATTERNS.vatNumber.pattern,
                            message: VALIDATION_PATTERNS.vatNumber.message,
                          },
                          validate: (value) => {
                            if (value && detectInjectionAttempt(value)) {
                              return "Caractères non autorisés détectés";
                            }
                            return true;
                          },
                        })}
                      />
                      {errors.legal?.vatNumber && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.legal.vatNumber.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Format: FR + 11 chiffres
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-md bg-gray-50 dark:bg-gray-900 px-4 py-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Franchise en base de TVA
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════ */}
          {/* Section Exercice comptable                 */}
          {/* ══════════════════════════════════════════ */}
          <div className="mt-4">
            <SectionTitle>Exercice comptable</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              <div>
                <RequiredLabel
                  htmlFor="fiscalYearStartDate"
                  isRequired={false}
                >
                  Date de début
                </RequiredLabel>
                <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!canManageOrgSettings}
                      className={cn(
                        "w-full mt-1.5 justify-start text-left font-normal",
                        !watchedValues.legal?.fiscalYearStartDate &&
                          "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {watchedValues.legal?.fiscalYearStartDate ? (
                        format(
                          parse(
                            watchedValues.legal.fiscalYearStartDate,
                            "yyyy-MM-dd",
                            new Date()
                          ),
                          "dd MMM yyyy",
                          { locale: fr }
                        )
                      ) : (
                        <span>Sélectionner une date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <ShadcnCalendar
                      mode="single"
                      selected={
                        watchedValues.legal?.fiscalYearStartDate
                          ? parse(
                              watchedValues.legal.fiscalYearStartDate,
                              "yyyy-MM-dd",
                              new Date()
                            )
                          : undefined
                      }
                      onSelect={(date) => {
                        setValue(
                          "legal.fiscalYearStartDate",
                          date ? format(date, "yyyy-MM-dd") : "",
                          { shouldDirty: true }
                        );
                        setStartDateOpen(false);
                      }}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <RequiredLabel htmlFor="fiscalYearEndDate" isRequired={false}>
                  Date de clôture
                </RequiredLabel>
                <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!canManageOrgSettings}
                      className={cn(
                        "w-full mt-1.5 justify-start text-left font-normal",
                        !watchedValues.legal?.fiscalYearEndDate &&
                          "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {watchedValues.legal?.fiscalYearEndDate ? (
                        format(
                          parse(
                            watchedValues.legal.fiscalYearEndDate,
                            "yyyy-MM-dd",
                            new Date()
                          ),
                          "dd MMM yyyy",
                          { locale: fr }
                        )
                      ) : (
                        <span>Sélectionner une date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <ShadcnCalendar
                      mode="single"
                      selected={
                        watchedValues.legal?.fiscalYearEndDate
                          ? parse(
                              watchedValues.legal.fiscalYearEndDate,
                              "yyyy-MM-dd",
                              new Date()
                            )
                          : undefined
                      }
                      onSelect={(date) => {
                        setValue(
                          "legal.fiscalYearEndDate",
                          date ? format(date, "yyyy-MM-dd") : "",
                          { shouldDirty: true }
                        );
                        setEndDateOpen(false);
                      }}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <Separator />

          {/* Information légale */}
          <div className="mb-8 mt-2">
            <Callout type="neutral" noMargin>
              <p>
                <span className="font-medium">Facturation électronique</span>
                <br />
                Ces informations sont essentielles pour la conformité de vos
                factures électroniques. Elles apparaissent sur chaque document
                émis et sont requises par la réglementation française en matière
                de facturation électronique.
              </p>
            </Callout>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InformationsLegalesSection;
